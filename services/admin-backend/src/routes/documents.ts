import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { randomUUID } from 'crypto';
import { getDb, getStorage, getConfig } from '../utils/context';
import { 
  Document, 
  DocumentUploadResponse, 
  ApiResponse, 
  PaginatedResponse,
  PDFProcessingResult 
} from '../types';

export const documentsRouter = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// Upload document -> store original, trigger processing, persist record
documentsRouter.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded', timestamp: new Date() } as ApiResponse);
    }

    const file = req.file;
    const id = randomUUID();
    const now = new Date();
    const db = getDb();
    const storage = getStorage();
    const config = getConfig<{ pdfProcessorUrl: string }>();

    // Save original PDF to private bucket
    const originalKey = `documents/${id}/original/${file.originalname}`;
    const originalUri = await storage.uploadPrivate({ key: originalKey, contentType: file.mimetype, body: file.buffer });

    // Create initial DB record
    const docRecord: Document = {
      id,
      filename: `${id}.pdf`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: 'admin',
      uploadedAt: now,
      status: 'processing',
      storage: { originalPdf: originalUri },
      stats: {}
    };
    await db.collection('documents').insertOne(docRecord as any);

    // Call PDF processor to get ZIP (analysis json + images)
    const fd = new FormData();
    fd.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    const zipResp = await axios.post(`${config.pdfProcessorUrl}/extract/zip`, fd, { headers: fd.getHeaders(), responseType: 'arraybuffer', timeout: 120000 });

    // Upload ZIP bundle
    const zipKey = `documents/${id}/processed/${id}_content.zip`;
    const zipUri = await storage.uploadPrivate({ key: zipKey, contentType: 'application/zip', body: Buffer.from(zipResp.data) });

    // Also call JSON endpoint for structured metadata/content
    const fd2 = new FormData();
    fd2.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    const jsonResp = await axios.post(`${config.pdfProcessorUrl}/extract`, fd2, { headers: fd2.getHeaders(), timeout: 120000 });
    const result: PDFProcessingResult = jsonResp.data;

    // Save analysis JSON to storage
    const analysisKey = `documents/${id}/processed/${id}_analysis.json`;
    const analysisUri = await storage.uploadPrivate({ key: analysisKey, contentType: 'application/json', body: Buffer.from(JSON.stringify(result)) });

    // Update DB with results
    const update: Partial<Document> = {
      status: 'completed',
      processedAt: new Date(),
      metadata: result.metadata,
      extractedText: result.content?.full_text,
      storage: { ...(docRecord.storage || {}), zipBundle: zipUri, analysisJson: analysisUri, imagesPrefix: `documents/${id}/images/` },
      stats: {
        pageCount: result.metadata.page_count,
        totalChars: result.content?.total_chars,
        imagesCount: result.content?.images_count
      }
    } as any;

    await db.collection('documents').updateOne({ id }, { $set: update });

    res.json({ success: true, status: 'processing', document: { ...docRecord, ...update } } as DocumentUploadResponse);
  } catch (error) {
    try {
      const db = getDb();
      const id = (req as any)._docId; // best-effort
      if (id) await db.collection('documents').updateOne({ id }, { $set: { status: 'failed', error: String(error), processedAt: new Date() } });
    } catch {}
    next(error);
  }
});

// Poll document status
documentsRouter.get('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const doc = await db.collection('documents').findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found', timestamp: new Date() } as ApiResponse);
    }
    res.json({ success: true, data: doc as unknown as Document, timestamp: new Date() } as ApiResponse<Document>);
  } catch (error) {
    next(error);
  }
});

// List documents (simple pagination)
documentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '10')));
    const skip = (page - 1) * limit;

    const db = getDb();
    const [items, total] = await Promise.all([
      db.collection('documents').find({}, { projection: { _id: 0 } }).sort({ uploadedAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('documents').countDocuments()
    ]);

    res.json({
      success: true,
      data: items as any,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      timestamp: new Date()
    } as PaginatedResponse<Document>);
  } catch (error) {
    next(error);
  }
});

// Get document by ID
documentsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const doc = await db.collection('documents').findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found', timestamp: new Date() } as ApiResponse);
    }
    res.json({ success: true, data: doc as unknown as Document, timestamp: new Date() } as ApiResponse<Document>);
  } catch (error) {
    next(error);
  }
});

// Delete document
documentsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    await db.collection('documents').deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Document deleted', timestamp: new Date() } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// Upload generated translation artifact to private bucket
documentsRouter.post('/:id/translations', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file', timestamp: new Date() } as ApiResponse);
    const db = getDb();
    const storage = getStorage();
    const id = req.params.id;
    const doc = await db.collection('documents').findOne({ id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found', timestamp: new Date() } as ApiResponse);

    const artifactKey = `documents/${id}/translations/${req.file.originalname}`;
    const uri = await storage.uploadPrivate({ key: artifactKey, contentType: req.file.mimetype, body: req.file.buffer });

    await db.collection('documents').updateOne({ id }, { $push: { translations: { name: req.file.originalname, contentType: req.file.mimetype, size: req.file.size, uri, uploadedAt: new Date() } } });

    res.json({ success: true, message: 'Translation uploaded', timestamp: new Date() } as ApiResponse);
  } catch (error) { next(error); }
});

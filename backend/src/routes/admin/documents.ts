import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { randomUUID } from 'crypto';
import AdmZip from 'adm-zip';
import mime from 'mime-types';
import { getDb, getStorage, getConfig } from '../../utils/context';
import { 
  Document, 
  DocumentUploadResponse, 
  ApiResponse, 
  PaginatedResponse,
  PDFProcessingResult 
} from '../../types';

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
      storage: { originalPdf: originalUri, originalKey },
      stats: {}
    };
    await db.collection('documents').insertOne(docRecord as any);

    // Call PDF processor to get ZIP (analysis json + images)
    const fd = new FormData();
    fd.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    const zipResp = await axios.post(`${config.pdfProcessorUrl}/extract/zip`, fd, { headers: fd.getHeaders(), responseType: 'arraybuffer', timeout: 120000 });

    // Upload ZIP bundle
    const zipBuf = Buffer.from(zipResp.data);
    const zipKey = `documents/${id}/processed/${id}_content.zip`;
    const zipUri = await storage.uploadPrivate({ key: zipKey, contentType: 'application/zip', body: zipBuf });

    // Unpack images from ZIP and upload to private bucket under images/
    try {
      const zip = new AdmZip(zipBuf);
      const entries = zip.getEntries();
      let imageCount = 0;
      for (const e of entries) {
        if (e.isDirectory) continue;
        const name = e.entryName;
        if (name.startsWith('images/')) {
          const imgBuf = e.getData();
          const imgName = name.substring('images/'.length);
          const key = `documents/${id}/images/${imgName}`;
          const contentType = (mime.lookup(imgName) || 'application/octet-stream').toString();
          await storage.uploadPrivate({ key, contentType, body: imgBuf });
          imageCount++;
        }
      }
      if (imageCount > 0) {
        await db.collection('documents').updateOne({ id }, { $set: { 'storage.imagesPrefix': `documents/${id}/images/` } });
      }
    } catch (e) {
      // Non-fatal: keep ZIP only
      // eslint-disable-next-line no-console
      console.warn('Failed to unpack images from ZIP:', e);
    }

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
      status: 'processed',
      processedAt: new Date(),
      metadata: result.metadata,
      // also persist full text into the generic 'content' field from shared models
      content: result.content?.full_text as any,
      extractedText: result.content?.full_text as any,
      storage: { ...(docRecord.storage || {}), zipBundle: zipUri, zipKey, analysisJson: analysisUri, analysisKey, imagesPrefix: `documents/${id}/images/` },
      stats: {
        pageCount: result.metadata?.page_count,
        totalChars: (result as any).content?.total_chars,
        imagesCount: (result as any).content?.images_count
      }
    } as any;

    await db.collection('documents').updateOne({ id }, { $set: update });

    return res.json({ success: true, status: 'processing', document: { ...docRecord, ...update } } as DocumentUploadResponse);
  } catch (error) {
    try {
      const db = getDb();
      const id = (req as any)._docId; // best-effort
      if (id) await db.collection('documents').updateOne({ id }, { $set: { status: 'failed', error: String(error), processedAt: new Date() } });
    } catch {}
    return return next(error);
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
    return res.json({ success: true, data: doc as unknown as Document, timestamp: new Date() } as ApiResponse<Document>);
  } catch (error) {
    return return next(error);
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
    return next(error);
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
    return next(error);
  }
});

// Delete document
documentsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    await db.collection('documents').deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Document deleted', timestamp: new Date() } as ApiResponse);
  } catch (error) {
    return next(error);
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

    await (db.collection('documents') as any).updateOne(
      { id }, 
      { $push: { translations: { name: req.file.originalname, contentType: req.file.mimetype, size: req.file.size, uri, uploadedAt: new Date() } } }
    );

    res.json({ success: true, message: 'Translation uploaded', timestamp: new Date() } as ApiResponse);
  } catch (error) { return next(error); }
});

// Reduce content (detect repeated components across languages)
documentsRouter.post('/:id/reduce', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const storage = getStorage();
    const id = req.params.id;
    const doc = await db.collection('documents').findOne({ id });
    if (!doc?.storage?.analysisKey) return res.status(400).json({ success: false, message: 'Analysis JSON not found', timestamp: new Date() } as ApiResponse);

    // Download analysis JSON
    const analysisBuf = await storage.downloadPrivate(doc.storage.analysisKey);
    const analysis = JSON.parse(analysisBuf.toString('utf-8')) as PDFProcessingResult;

    // Stub: perform grouping and detection. In future, use LLM.
    const reduced = {
      success: true,
      groups: [],
      languages: [],
      notes: 'Reduced content placeholder. Implement grouping by titles/paragraphs and language detection.'
    };

    const reducedKey = `documents/${id}/processed/${id}_reduced.json`;
    const reducedUri = await storage.uploadPrivate({ key: reducedKey, contentType: 'application/json', body: Buffer.from(JSON.stringify(reduced)) });

    await db.collection('documents').updateOne({ id }, { $set: { 'storage.reducedJson': reducedUri, 'storage.reducedKey': reducedKey } });

    res.json({ success: true, message: 'Reduced content created', timestamp: new Date(), data: { key: reducedKey } } as ApiResponse);
  } catch (error) { return next(error); }
});

// Generate chunks of markdown with metadata
documentsRouter.post('/:id/chunks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const storage = getStorage();
    const id = req.params.id;
    const doc = await db.collection('documents').findOne({ id });
    const key = doc?.storage?.reducedKey || doc?.storage?.analysisKey;
    if (!key) return res.status(400).json({ success: false, message: 'No source JSON to chunk', timestamp: new Date() } as ApiResponse);

    const srcBuf = await storage.downloadPrivate(key);
    const src = JSON.parse(srcBuf.toString('utf-8'));

    // Stub: produce simple chunk list preserving layout hints
    const chunks = {
      success: true,
      chunks: [
        { id: 'c1', lang: 'unknown', type: 'paragraph', markdown: '...', meta: { page: 1, bbox: [0,0,0,0] } }
      ]
    };

    const chunksKey = `documents/${id}/processed/${id}_chunks.json`;
    const chunksUri = await storage.uploadPrivate({ key: chunksKey, contentType: 'application/json', body: Buffer.from(JSON.stringify(chunks)) });

    await db.collection('documents').updateOne({ id }, { $set: { 'storage.chunksJson': chunksUri, 'storage.chunksKey': chunksKey } });

    res.json({ success: true, message: 'Chunks generated', timestamp: new Date(), data: { key: chunksKey } } as ApiResponse);
  } catch (error) { return next(error); }
});

// Generate missing language using LLM (placeholder)
documentsRouter.post('/:id/generate-translation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetLanguage, layoutRefLang, textRefLang } = req.body || {};
    if (!targetLanguage) return res.status(400).json({ success: false, message: 'targetLanguage is required', timestamp: new Date() } as ApiResponse);

    const db = getDb();
    const storage = getStorage();
    const id = req.params.id;
    const doc = await db.collection('documents').findOne({ id });
    const sourceKey = doc?.storage?.chunksKey || doc?.storage?.reducedKey || doc?.storage?.analysisKey;
    if (!sourceKey) return res.status(400).json({ success: false, message: 'No source for translation', timestamp: new Date() } as ApiResponse);

    // Download source
    const srcBuf = await storage.downloadPrivate(sourceKey);
    const src = JSON.parse(srcBuf.toString('utf-8'));

    // Stub: create a dummy translated artifact
    const translated = { success: true, language: targetLanguage, layoutRefLang, textRefLang, content: [], note: 'LLM translation placeholder' };
    const tKey = `documents/${id}/translations/${targetLanguage}/${Date.now()}_translation.json`;
    const tUri = await storage.uploadPrivate({ key: tKey, contentType: 'application/json', body: Buffer.from(JSON.stringify(translated)) });

    await (db.collection('documents') as any).updateOne(
      { id },
      { $push: { translations: { name: `${targetLanguage}.json`, contentType: 'application/json', size: Buffer.byteLength(JSON.stringify(translated)), uri: tUri, uploadedAt: new Date(), language: targetLanguage, sourceLayoutLang: layoutRefLang, sourceTextLang: textRefLang } } }
    );

    res.json({ success: true, message: 'Translation generated', timestamp: new Date(), data: { key: tKey } } as ApiResponse);
  } catch (error) { return next(error); }
});

// Publish selected variant to public bucket
documentsRouter.post('/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { language, version, artifactKey } = req.body || {};
    if (!language || !version) return res.status(400).json({ success: false, message: 'language and version are required', timestamp: new Date() } as ApiResponse);

    const db = getDb();
    const storage = getStorage();
    const id = req.params.id;
    const doc = await db.collection('documents').findOne({ id });

    // Resolve source key
    let srcKey = artifactKey as string | undefined;
    if (!srcKey) {
      if (version === 'original') srcKey = doc?.storage?.chunksKey || doc?.storage?.analysisKey;
      else {
        const t = (doc?.translations || []).find((x: any) => x.language === language);
        if (!t) return res.status(400).json({ success: false, message: 'Translation not found', timestamp: new Date() } as ApiResponse);
        // extract key from uri when MinIO; for GCS we can't derive reliably -> require artifactKey ideally
        srcKey = t.uri?.split(`${doc?.storage?.originalKey?.split('documents/')[0]}documents/`)[1] || undefined;
      }
    }
    if (!srcKey) return res.status(400).json({ success: false, message: 'Unable to resolve artifact key to publish', timestamp: new Date() } as ApiResponse);

    // Download from private and upload to public
    const buf = await storage.downloadPrivate(srcKey);
    const publicKey = `documents/${id}/published/${language}/${version}.json`;
    const url = await storage.uploadPublic({ key: publicKey, contentType: 'application/json', body: buf });

    await (db.collection('documents') as any).updateOne(
      { id },
      { $push: { published: { language, version, url, publishedAt: new Date(), artifactKey: srcKey } } }
    );

    res.json({ success: true, message: 'Published', timestamp: new Date(), data: { url } } as ApiResponse);
  } catch (error) { return next(error); }
});

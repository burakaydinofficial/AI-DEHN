import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { randomUUID } from 'crypto';
import AdmZip from 'adm-zip';
import mime from 'mime-types';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { getDb, getStorage, getConfig, getAppContext } from '../../utils/context';
import { appConfig } from '../../config';
import { 
  Document, 
  DocumentUploadResponse, 
  ApiResponse, 
  PaginatedResponse,
  PDFProcessingResult,
  ContentReductionRequest,
  ContentReductionResult,
  TextGroup,
  LanguageText,
  ChunksResult,
  MarkdownChunk,
  PDFAnalysisData,
  ProcessedTextBlock,
  ContentReductionGroup,
  AILogEntry
} from '../../types/api';
import { 
  performStandardContentReduction,
  generateMarkdownChunks
} from '../../utils/contentReductionProcessor';

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

    const zipResp = await axios.post(`${appConfig.services.pdfProcessorUrl}/extract/zip`, fd, { headers: fd.getHeaders(), responseType: 'arraybuffer', timeout: 120000 });

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
    const jsonResp = await axios.post(`${appConfig.services.pdfProcessorUrl}/extract`, fd2, { headers: fd2.getHeaders(), timeout: 120000 });
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
    return next(error);
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
    return next(error);
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

    return res.json({
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
    return res.json({ success: true, data: doc as unknown as Document, timestamp: new Date() } as ApiResponse<Document>);
  } catch (error) {
    return next(error);
  }
});

// Delete document
documentsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    await db.collection('documents').deleteOne({ id: req.params.id });
    return res.json({ success: true, message: 'Document deleted', timestamp: new Date() } as ApiResponse);
  } catch (error) {
    return next(error);
  }
});

// Rename document
documentsRouter.put('/:id/rename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newName } = req.body;
    
    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'New name is required and must be a non-empty string', 
        timestamp: new Date() 
      } as ApiResponse);
    }

    const db = getDb();
    const result = await db.collection('documents').updateOne(
      { id: req.params.id },
      { 
        $set: { 
          originalName: newName.trim(),
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found', 
        timestamp: new Date() 
      } as ApiResponse);
    }

    return res.json({ 
      success: true, 
      message: 'Document renamed successfully', 
      timestamp: new Date() 
    } as ApiResponse);
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

    return res.json({ success: true, message: 'Translation uploaded', timestamp: new Date() } as ApiResponse);
  } catch (error) { return next(error); }
});

// Content Reduction - AI-powered text grouping and language detection
// This step detects components repeated in different languages and creates grouped JSON
documentsRouter.post('/:id/reduce', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: documentId } = req.params;
    const db = getDb();
    const storage = getStorage();

    // Get document from database
    const document = await db.collection('documents').findOne({ id: documentId });
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date()
      } as ApiResponse);
    }

    // Check if document has been processed (PDF → ZIP extraction complete)
    if (document.status !== 'processed' || !document.storage?.analysisJson) {
      return res.status(400).json({
        success: false,
        error: 'Document must be processed first. PDF analysis data not found.',
        timestamp: new Date()
      } as ApiResponse);
    }

    // Update document status to show reduction is starting
    await db.collection('documents').updateOne(
      { id: documentId },
      { $set: { status: 'reducing', processingStage: 'content-reduction' } }
    );

    // Load the analysis JSON containing extracted PDF content
    const analysisBuffer = await storage.downloadPrivate(document.storage.analysisKey);
    const analysisData = JSON.parse(analysisBuffer.toString('utf8')) as PDFAnalysisData;

    // Perform content reduction using our standard AI processor
    const aiAgent = getAppContext().aiAgent;
    const reductionResult = await performStandardContentReduction(
      analysisData,
      aiAgent,
      documentId
    );

    // Save content reduction results to storage
    const reducedKey = `documents/${documentId}/reduced/${documentId}_content_groups.json`;
    await storage.uploadPrivate({
      key: reducedKey,
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(reductionResult, null, 2))
    });

    // Generate markdown chunks for all languages found
    const chunksResult = await generateMarkdownChunks(analysisData, reductionResult, aiAgent);
    const chunksKey = `documents/${documentId}/reduced/${documentId}_markdown_chunks.json`;
    await storage.uploadPrivate({
      key: chunksKey,
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(chunksResult, null, 2))
    });

    // Save AI logs to storage for debugging
    let aiLogsKey = '';
    if (reductionResult.aiLogs && reductionResult.aiLogs.length > 0) {
      aiLogsKey = `documents/${documentId}/reduced/${documentId}_ai_logs.json`;
      await storage.uploadPrivate({
        key: aiLogsKey,
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify(reductionResult.aiLogs, null, 2))
      });
    }

    // Update document in database with results
    await db.collection('documents').updateOne(
      { id: documentId },
      {
        $set: {
          status: 'reduced',
          processingStage: 'content-reduction-complete',
          contentReduction: {
            totalGroups: reductionResult.totalGroups,
            languagesDetected: reductionResult.languagesDetected,
            processedAt: new Date(),
            hasAiLogs: Boolean(aiLogsKey)
          },
          'storage.reducedJson': reducedKey,
          'storage.chunksJson': chunksKey,
          'storage.aiLogsKey': aiLogsKey || undefined,
          'stats.languagesDetected': reductionResult.languagesDetected.length,
          'stats.textGroupsCount': reductionResult.totalGroups,
          availableLanguages: reductionResult.languagesDetected,
          processedAt: new Date()
        }
      }
    );

    return res.json({
      success: true,
      data: {
        totalGroups: reductionResult.totalGroups,
        languagesDetected: reductionResult.languagesDetected,
        processedAt: new Date(),
        hasAiLogs: Boolean(aiLogsKey),
        chunksGenerated: chunksResult.totalChunks,
        processingModel: 'gemini-1.5-pro'
      },
      message: 'Content reduction completed successfully',
      timestamp: new Date()
    } as ApiResponse);

  } catch (error) {
    // Update document status to failed on error
    try {
      const db = getDb();
      await db.collection('documents').updateOne(
        { id: req.params.id },
        { 
          $set: { 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Content reduction failed',
            processedAt: new Date() 
          } 
        }
      );
    } catch {}
    return next(error);
  }
});

// Get AI processing logs for a document (on-demand loading)
documentsRouter.get('/:id/ai-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: documentId } = req.params;
    const db = getDb();
    const storage = getStorage();

    const document = await db.collection('documents').findOne({ id: documentId });
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date()
      } as ApiResponse);
    }

    // Load AI logs from storage if they exist
    let aiLogs = [];
    if (document.storage?.aiLogsKey) {
      try {
        const logsBuffer = await storage.downloadPrivate(document.storage.aiLogsKey);
        aiLogs = JSON.parse(logsBuffer.toString('utf8'));
      } catch (error) {
        console.warn('Could not load AI logs:', error);
      }
    }

    return res.json({
      success: true,
      data: { aiLogs },
      timestamp: new Date()
    } as ApiResponse);

  } catch (error) {
    return next(error);
  }
});

// Get detailed content reduction results for a document
documentsRouter.get('/:id/reduction-details', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: documentId } = req.params;
    const db = getDb();
    const storage = getStorage();

    const document = await db.collection('documents').findOne({ id: documentId });
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date()
      } as ApiResponse);
    }

    if (!document.storage?.reducedJson) {
      return res.status(404).json({
        success: false,
        error: 'Content reduction not completed for this document',
        timestamp: new Date()
      } as ApiResponse);
    }

    // Load reduction results and chunks
    const [reductionBuffer, chunksBuffer] = await Promise.all([
      storage.downloadPrivate(document.storage.reducedJson),
      document.storage.chunksJson ? storage.downloadPrivate(document.storage.chunksJson) : Promise.resolve(null)
    ]);

    const reductionData = JSON.parse(reductionBuffer.toString('utf8'));
    const chunksData = chunksBuffer ? JSON.parse(chunksBuffer.toString('utf8')) : null;

    return res.json({
      success: true,
      data: {
        reduction: reductionData,
        chunks: chunksData,
        summary: {
          totalGroups: reductionData.totalGroups,
          languagesDetected: reductionData.languagesDetected,
          processedAt: reductionData.processedAt,
          totalChunks: chunksData?.totalChunks || 0
        }
      },
      timestamp: new Date()
    } as ApiResponse);

  } catch (error) {
    return next(error);
  }
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

    return res.json({ success: true, message: 'Published', timestamp: new Date(), data: { url } } as ApiResponse);
  } catch (error) { return next(error); }
});

// Helper function to perform AI-powered content reduction (legacy - kept for compatibility)
async function performContentReduction(
  analysisData: PDFAnalysisData,
  aiAgent: any,
  groupingStrategy: 'layout-based' | 'semantic' | 'mixed',
  languageThreshold: number,
  model: string
): Promise<ContentReductionResult> {
  // Delegate to the standard processor - legacy compatibility wrapper
  return performStandardContentReduction(analysisData, aiAgent, 'legacy-compatibility');
}

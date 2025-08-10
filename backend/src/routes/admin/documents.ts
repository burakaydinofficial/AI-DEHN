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
            hasAiLogs: reductionResult.aiLogs && reductionResult.aiLogs.length > 0
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
        hasAiLogs: reductionResult.aiLogs && reductionResult.aiLogs.length > 0,
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
  const startTime = Date.now();
  const aiLogs: AILogEntry[] = [];

  // Extract text blocks from PDF analysis data
  const textBlocks = extractTextBlocks(analysisData);
  
  // Group text blocks using AI and layout analysis
  const groups = await groupTextBlocks(textBlocks, aiAgent, groupingStrategy, model);
  
  // Detect languages in each group
  const groupsWithLanguages = await detectLanguagesInGroups(groups, aiAgent, languageThreshold, model, textBlocks);
  
  // Get unique languages detected
  const languagesDetected = [...new Set(
    groupsWithLanguages.flatMap(group => 
      group.originalTexts.map(text => text.language)
    )
  )];

  const processingTime = Date.now() - startTime;

  return {
    groups: groupsWithLanguages,
    languagesDetected,
    totalGroups: groupsWithLanguages.length,
    processedAt: new Date(),
    aiLogs
  };
}

// Extract text blocks from PDF analysis data
function extractTextBlocks(analysisData: PDFAnalysisData): ProcessedTextBlock[] {
  const blocks: ProcessedTextBlock[] = [];
  
  if (analysisData.content?.pages) {
    for (const page of analysisData.content.pages) {
      if (page.text_blocks) {
        for (const block of page.text_blocks) {
          if (block.block_type === 'text' && block.lines?.length > 0) {
            // Extract text from spans within lines
            const blockText = block.lines
              .flatMap((line) => line.spans || [])
              .map((span) => span.text || '')
              .join(' ')
              .trim();
            
            if (blockText.length > 10) { // Filter out very short blocks
              blocks.push({
                text: blockText,
                bbox: block.bbox,
                pageNumber: page.page_number,
                lines: block.lines
              });
            }
          }
        }
      }
    }
  }
  
  return blocks;
}

// Group text blocks using AI analysis
async function groupTextBlocks(
  textBlocks: ProcessedTextBlock[],
  aiAgent: any,
  strategy: string,
  model: string
): Promise<ContentReductionGroup[]> {
  const prompt = `
You are analyzing text blocks extracted from a multilingual PDF document. Your task is to group related text blocks that represent the same content across different languages.

Strategy: ${strategy}

Text blocks with their positions and page numbers:
${textBlocks.slice(0, 20).map((block, idx) => 
  `Block ${idx}: Page ${block.pageNumber}, BBox: ${block.bbox}, Text: "${block.text.substring(0, 100)}..."`
).join('\n')}

Group these text blocks by:
1. Content similarity (same meaning in different languages)
2. Layout position (blocks in similar positions likely contain similar content)
3. Text type (title, paragraph, list item, table cell, etc.)

Return a JSON array of groups where each group contains:
- id: unique identifier (use uuid format)
- type: 'title' | 'paragraph' | 'list' | 'table' | 'other'
- blockIndices: array of block indices that belong to this group
- overallBbox: calculated overall bounding box [x0, y0, x1, y1]
- pageNumber: page number where this group primarily appears
- order: order within the page (0-based)

Focus on creating meaningful groups that represent the same content across languages.
Return only the JSON array, no other text.
`;

  try {
    const response = await aiAgent.generateContent(prompt, {
      model,
      temperature: 0.3,
      maxOutputTokens: 4000
    });

    const groupsData = JSON.parse(response.text);
    
    return groupsData.map((group: any, idx: number) => ({
      id: group.id || uuidv4(),
      type: group.type || 'other',
      originalTexts: [], // Will be populated with language detection
      bbox: group.overallBbox || calculateOverallBbox(group.blockIndices?.map((i: number) => textBlocks[i]) || []),
      pageNumber: group.pageNumber || 1,
      order: group.order ?? idx,
      _blockIndices: group.blockIndices || [] // Temporary for language processing
    }));
  } catch (error) {
    console.error('AI grouping failed, falling back to simple grouping:', error);
    
    // Fallback: simple position-based grouping
    return textBlocks.map((block, idx) => ({
      id: uuidv4(),
      type: 'paragraph' as const,
      originalTexts: [],
      bbox: block.bbox,
      pageNumber: block.pageNumber,
      order: idx,
      _blockIndices: [idx]
    }));
  }
}

// Detect languages in grouped text blocks
async function detectLanguagesInGroups(
  groups: ContentReductionGroup[],
  aiAgent: any,
  threshold: number,
  model: string,
  allBlocks: ProcessedTextBlock[]
): Promise<ContentReductionGroup[]> {
  const processedGroups: ContentReductionGroup[] = [];

  for (const group of groups) {
    const blockIndices = group._blockIndices || [];
    const groupTexts: LanguageText[] = [];

    for (const blockIdx of blockIndices) {
      const block = allBlocks[blockIdx];
      if (!block) continue;

      // Detect language for this text block
      const language = await detectLanguage(block.text, aiAgent, model);
      
      if (language) {
        groupTexts.push({
          language,
          text: block.text,
          bbox: block.bbox,
          confidence: 0.8, // Default confidence, could be improved with actual detection
          isOriginal: true
        });
      }
    }

    if (groupTexts.length > 0) {
      processedGroups.push({
        id: group.id,
        type: group.type,
        originalTexts: groupTexts,
        bbox: group.bbox,
        pageNumber: group.pageNumber,
        order: group.order
      });
    }
  }

  return processedGroups;
}

// Detect language of text using AI
async function detectLanguage(text: string, aiAgent: any, model: string): Promise<string | null> {
  if (!text || text.trim().length < 3) return null;

  const prompt = `
Detect the language of this text and return only the ISO 639-1 language code (2 letters, lowercase):

Text: "${text.substring(0, 200)}"

Return only the language code (e.g., "en", "tr", "de", "fr", "es", etc.). If uncertain, return "unknown".
`;

  try {
    const response = await aiAgent.generateContent(prompt, {
      model,
      temperature: 0.1,
      maxOutputTokens: 10
    });

    const language = response.text.trim().toLowerCase();
    
    // Validate it's a reasonable language code
    if (/^[a-z]{2}$/.test(language) && language !== 'un') {
      return language;
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Language detection failed for text:', text.substring(0, 50), error);
    return 'unknown';
  }
}

// Calculate overall bounding box from multiple blocks
function calculateOverallBbox(blocks: ProcessedTextBlock[]): [number, number, number, number] {
  if (blocks.length === 0) return [0, 0, 0, 0];
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const block of blocks) {
    if (block.bbox && Array.isArray(block.bbox) && block.bbox.length === 4) {
      minX = Math.min(minX, block.bbox[0]);
      minY = Math.min(minY, block.bbox[1]);
      maxX = Math.max(maxX, block.bbox[2]);
      maxY = Math.max(maxY, block.bbox[3]);
    }
  }
  
  return [minX, minY, maxX, maxY];
}

// Our standard content reduction processor - tuned for multilingual PDFs
async function performStandardContentReduction(
  analysisData: PDFAnalysisData,
  aiAgent: any, // TODO: Add proper AIAgent type
  documentId: string
): Promise<ContentReductionResult> {
  const startTime = Date.now();
  const aiLogs: AILogEntry[] = [];

  // Extract text blocks from PDF analysis data
  const textBlocks = extractTextBlocks(analysisData);
  
  // Use our standard grouping algorithm - no user configuration needed
  const groups = await performStandardGrouping(textBlocks, aiAgent, aiLogs);
  
  // Detect languages in each group with high accuracy
  const groupsWithLanguages = await detectLanguagesInGroups(groups, aiAgent, 0.8, 'gemini-1.5-pro', textBlocks);
  
  // Get unique languages detected
  const languagesDetected = [...new Set(
    groupsWithLanguages.flatMap(group => 
      group.originalTexts.map(text => text.language)
    )
  )].filter(lang => lang !== 'unknown');

  return {
    groups: groupsWithLanguages,
    languagesDetected,
    totalGroups: groupsWithLanguages.length,
    processedAt: new Date(),
    aiLogs
  };
}

// Standard grouping algorithm optimized for our use case
async function performStandardGrouping(
  textBlocks: ProcessedTextBlock[],
  aiAgent: any,
  aiLogs: AILogEntry[]
): Promise<ContentReductionGroup[]> {
  
  const prompt = `
You are analyzing text blocks extracted from a multilingual PDF document. Your task is to intelligently group text blocks that represent the same content across different languages or related content within the same language.

CRITICAL GROUPING RULES:
1. For TITLES/HEADERS: Group text blocks that appear to be the same title in different languages
2. For PARAGRAPHS: Group text blocks that contain the same paragraph content in different languages
3. For LISTS: Group list items that represent the same content across languages
4. Consider LAYOUT POSITION: Blocks in similar positions likely contain equivalent content
5. Consider TEXT LENGTH: Similar-length blocks in similar positions often represent the same content

Text blocks to analyze:
${textBlocks.slice(0, 30).map((block, idx) => 
  `Block ${idx}: Page ${block.pageNumber}, Position [${block.bbox?.join(',')}], Length: ${block.text.length}, Text: "${block.text.substring(0, 150)}..."`
).join('\n')}

Return a JSON array of groups where each group represents content that should be grouped together:
{
  "groups": [
    {
      "id": "uuid-string",
      "type": "title|paragraph|list|table|other",
      "blockIndices": [0, 5, 12],
      "confidence": 0.95,
      "reasoning": "Brief explanation of why these blocks are grouped"
    }
  ]
}

Focus on quality over quantity - only group blocks that clearly represent the same content.
`;

  try {
    const response = await aiAgent.generateContent(prompt, {
      model: 'gemini-1.5-pro', // Use our configured model
      temperature: 0.2, // Low temperature for consistent results
      maxOutputTokens: 4000
    });

    // Log the AI interaction for debugging
    aiLogs.push({
      timestamp: new Date(),
      phase: 'text-grouping',
      prompt: prompt.substring(0, 500) + '...',
      response: response.text.substring(0, 1000) + '...',
      model: 'gemini-1.5-pro'
    });

    const result = JSON.parse(response.text);
    const groupsData = result.groups || [];
    
    return groupsData.map((group: any, idx: number) => ({
      id: group.id || uuidv4(),
      type: group.type || 'other',
      originalTexts: [], // Will be populated with language detection
      bbox: calculateOverallBbox(group.blockIndices?.map((i: number) => textBlocks[i]) || []),
      pageNumber: textBlocks[group.blockIndices?.[0] || 0]?.pageNumber || 1,
      order: idx,
      _blockIndices: group.blockIndices || [],
      _confidence: group.confidence || 0.5
    }));
    
  } catch (error) {
    console.error('AI grouping failed, using fallback:', error);
    aiLogs.push({
      timestamp: new Date(),
      phase: 'text-grouping-error',
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'simple-position-based'
    });
    
    // Fallback: simple position-based grouping
    return textBlocks.map((block, idx) => ({
      id: uuidv4(),
      type: 'paragraph' as const,
      originalTexts: [],
      bbox: block.bbox,
      pageNumber: block.pageNumber,
      order: idx,
      _blockIndices: [idx],
      _confidence: 0.3
    }));
  }
}

// Generate markdown chunks with metadata as per business requirements
async function generateMarkdownChunks(
  analysisData: PDFAnalysisData,
  reductionResult: ContentReductionResult,
  aiAgent: any
): Promise<ChunksResult> {
  const startTime = Date.now();
  const chunks: MarkdownChunk[] = [];
  
  // Group by language and page for chunk generation
  const languagePages = new Map<string, Set<number>>();
  
  for (const group of reductionResult.groups) {
    for (const text of group.originalTexts) {
      if (!languagePages.has(text.language)) {
        languagePages.set(text.language, new Set());
      }
      languagePages.get(text.language)!.add(group.pageNumber);
    }
  }

  // Generate chunks for each language-page combination
  for (const [language, pages] of languagePages) {
    for (const pageNum of pages) {
      const pageGroups = reductionResult.groups.filter((g) => 
        g.pageNumber === pageNum && 
        g.originalTexts.some((t) => t.language === language)
      );

      if (pageGroups.length > 0) {
        const markdownContent = await generatePageMarkdown(pageGroups, language, pageNum, aiAgent);
        
        chunks.push({
          id: uuidv4(),
          content: markdownContent,
          sourceGroups: pageGroups.map((g) => g.id),
          language,
          pageNumbers: [pageNum],
          metadata: {
            chunkType: 'page',
            layoutReference: language,
            mergedPages: undefined,
            childChunks: undefined
          }
        });
      }
    }
  }

  return {
    chunks,
    totalChunks: chunks.length,
    languages: Array.from(languagePages.keys()),
    processedAt: new Date(),
    metadata: {
      chunkingStrategy: 'page-based-with-language-separation',
      aiModel: 'gemini-1.5-pro',
      processingTime: Date.now() - startTime
    }
  };
}

// Generate markdown for a page with proper structure
async function generatePageMarkdown(
  pageGroups: ContentReductionGroup[],
  language: string,
  pageNumber: number,
  aiAgent: any
): Promise<string> {
  // Sort groups by order and position
  const sortedGroups = pageGroups.sort((a, b) => a.order - b.order);
  
  let markdown = `# Page ${pageNumber} (${language.toUpperCase()})\n\n`;
  
  for (const group of sortedGroups) {
    const text = group.originalTexts.find((t) => t.language === language);
    if (text) {
      switch (group.type) {
        case 'title':
          markdown += `## ${text.text}\n\n`;
          break;
        case 'list':
          markdown += `- ${text.text}\n`;
          break;
        case 'paragraph':
        default:
          markdown += `${text.text}\n\n`;
          break;
      }
    }
  }
  
  return markdown;
}

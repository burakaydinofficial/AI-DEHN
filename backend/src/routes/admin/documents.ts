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
  LanguageText
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

    return res.json({ success: true, message: 'Reduced content created', timestamp: new Date(), data: { key: reducedKey } } as ApiResponse);
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

    return res.json({ success: true, message: 'Chunks generated', timestamp: new Date(), data: { key: chunksKey } } as ApiResponse);
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

    return res.json({ success: true, message: 'Translation generated', timestamp: new Date(), data: { key: tKey } } as ApiResponse);
  } catch (error) { return next(error); }
});

// Content Reduction - AI-powered text grouping and language detection
documentsRouter.post('/:id/reduce', async (req: Request<{ id: string }, ApiResponse<ContentReductionResult>, ContentReductionRequest>, res: Response<ApiResponse<ContentReductionResult>>, next: NextFunction) => {
  try {
    const { id: documentId } = req.params;
    const {
      aiModel = 'gemini-1.5-pro',
      groupingStrategy = 'mixed',
      languageDetectionThreshold = 0.7
    } = req.body;

    const context = getAppContext();
    const { storage, database } = context;

    // Get document from database
    const document = await database.collection('documents').findOne({ id: documentId });
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date()
      });
    }

    // Check if document has been processed (PDF → ZIP extraction complete)
    if (!document.storage?.analysisJson) {
      return res.status(400).json({
        success: false,
        error: 'Document must be processed first. PDF analysis data not found.',
        timestamp: new Date()
      });
    }

    // Load the analysis JSON containing extracted PDF content
    const analysisPath = path.join(process.cwd(), 'storage', 'private', document.storage.analysisJson);
    const analysisData = JSON.parse(await fs.readFile(analysisPath, 'utf8'));

    // Perform content reduction using AI
    const aiAgent = context.aiAgent;
    const reductionResult = await performContentReduction(
      analysisData,
      aiAgent,
      groupingStrategy,
      languageDetectionThreshold,
      aiModel
    );

    // Save content reduction results to storage
    const reducedFilename = `${documentId}-content-reduction.json`;
    const reducedPath = await storage.uploadPrivate({
      key: `documents/${documentId}/reduced/${reducedFilename}`,
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(reductionResult, null, 2))
    });

    // Update document in database
    const updateResult = await database.collection('documents').updateOne(
      { id: documentId },
      {
        $set: {
          status: 'reduced',
          processingStage: 'reduction',
          contentReduction: reductionResult,
          'storage.reducedJson': reducedFilename,
          'storage.reducedKey': reducedPath,
          'stats.languagesDetected': reductionResult.languagesDetected.length,
          'stats.textGroupsCount': reductionResult.totalGroups,
          availableLanguages: reductionResult.languagesDetected,
          processedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update document',
        timestamp: new Date()
      });
    }

    return res.json({
      success: true,
      data: reductionResult,
      message: 'Content reduction completed successfully',
      timestamp: new Date()
    });

  } catch (error) {
    next(error);
    return;
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

// Helper function to perform AI-powered content reduction
async function performContentReduction(
  analysisData: any,
  aiAgent: any,
  groupingStrategy: 'layout-based' | 'semantic' | 'mixed',
  languageThreshold: number,
  model: string
): Promise<ContentReductionResult> {
  const startTime = Date.now();

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
    metadata: {
      groupingMethod: groupingStrategy,
      aiModel: model,
      processingTime
    }
  };
}

// Extract text blocks from PDF analysis data
function extractTextBlocks(analysisData: any): any[] {
  const blocks = [];
  
  if (analysisData.content?.pages) {
    for (const page of analysisData.content.pages) {
      if (page.text_blocks) {
        for (const block of page.text_blocks) {
          if (block.block_type === 'text' && block.lines?.length > 0) {
            // Extract text from spans within lines
            const blockText = block.lines
              .flatMap((line: any) => line.spans || [])
              .map((span: any) => span.text || '')
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
  textBlocks: any[],
  aiAgent: any,
  strategy: string,
  model: string
): Promise<TextGroup[]> {
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
  groups: any[],
  aiAgent: any,
  threshold: number,
  model: string,
  allBlocks: any[]
): Promise<TextGroup[]> {
  const processedGroups: TextGroup[] = [];

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
function calculateOverallBbox(blocks: any[]): [number, number, number, number] {
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

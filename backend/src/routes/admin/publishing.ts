import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, getStorage, getAppContext } from '../../utils/context';
import { 
  PublishReadyDocument,
  PublishedDocument,
  PrepareDocumentRequest,
  PublishDocumentRequest,
  UnpublishDocumentRequest,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  Document,
  Product
} from '../../types/api';

export const publishingRouter = Router();

// Get all publish-ready documents
publishingRouter.get('/publish-ready-documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      language = '',
      status = ''
    } = req.query;

    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.documentName = { $regex: search, $options: 'i' };
    }
    
    if (language) {
      filter.language = language;
    }

    if (status) {
      filter.status = status;
    }

    // Get total count
    const totalCount = await db.collection('publishReadyDocuments').countDocuments(filter);
    
    // Get paginated documents
    const documents = await db.collection('publishReadyDocuments')
      .find(filter)
      .sort({ generatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .toArray();

    // Remove MongoDB's _id field
    const cleanDocuments = documents.map(doc => {
      const { _id, ...cleanDoc } = doc;
      return cleanDoc;
    });

    const response: PaginatedResponse<PublishReadyDocument> = {
      success: true,
      data: cleanDocuments as PublishReadyDocument[],
      timestamp: new Date(),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get all published documents
publishingRouter.get('/published-documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      language = '',
      productId = '',
      status = ''
    } = req.query;

    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { documentName: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (language) {
      filter.language = language;
    }

    if (productId) {
      filter.productId = productId;
    }

    if (status) {
      filter.status = status;
    }

    // Get total count
    const totalCount = await db.collection('publishedDocuments').countDocuments(filter);
    
    // Get paginated documents
    const documents = await db.collection('publishedDocuments')
      .find(filter)
      .sort({ publishedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .toArray();

    // Remove MongoDB's _id field
    const cleanDocuments = documents.map(doc => {
      const { _id, ...cleanDoc } = doc;
      return cleanDoc;
    });

    const response: PaginatedResponse<PublishedDocument> = {
      success: true,
      data: cleanDocuments as PublishedDocument[],
      timestamp: new Date(),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Prepare document for publishing
publishingRouter.post('/documents/:documentId/prepare-for-publishing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const storage = getStorage();
    const { documentId } = req.params;
    const { language, includeImages = true, compressionLevel = 'medium' }: PrepareDocumentRequest = req.body;

    // Check if document exists and is ready for preparation
    const document = await db.collection('documents').findOne({ id: documentId });
    if (!document) {
      throw new ApiError('Document not found', 404);
    }

    if (!['chunked', 'translated', 'published'].includes(document.status)) {
      throw new ApiError('Document must be chunked or translated before preparation', 400);
    }

    // Check if language is available
    if (language !== 'en' && !document.availableLanguages?.includes(language)) {
      throw new ApiError(`Language '${language}' is not available for this document`, 400);
    }

    // Check if already prepared
    const existingPrep = await db.collection('publishReadyDocuments').findOne({
      documentId,
      language
    });

    if (existingPrep) {
      throw new ApiError('Document is already prepared for this language', 409);
    }

    // Start preparation process
    const publishReadyId = uuidv4();
    let chunks = [];
    let imagesCount = 0;

    try {
      // Load chunks from storage based on document storage information
      if (language === 'en') {
        // Use original chunks - try to get from analysisKey
        if (document.storage?.analysisKey) {
          const analysisBuffer = await storage.downloadPrivate(document.storage.analysisKey);
          const analysisData = JSON.parse(analysisBuffer.toString());
          chunks = analysisData.chunks || [];
        } else {
          throw new ApiError('Original analysis data not found', 404);
        }
      } else {
        // Use translated chunks - look for translation artifacts
        const translations = document.translations || [];
        const targetTranslation = translations.find((t: any) => t.name.includes(language));
        
        if (targetTranslation && targetTranslation.uri) {
          const translationBuffer = await storage.downloadPrivate(targetTranslation.uri);
          const translationData = JSON.parse(translationBuffer.toString());
          chunks = translationData.chunks || [];
        } else {
          throw new ApiError(`Translation for language '${language}' not found`, 404);
        }
      }

      // Count images from storage
      if (includeImages && document.storage?.imagesPrefix) {
        // For now, use the stored image count or estimate
        imagesCount = document.stats?.imagesCount || 0;
      }

      // Create publish-ready document
      const publishReadyDoc: PublishReadyDocument = {
        id: publishReadyId,
        documentId,
        documentName: document.originalName,
        language,
        contentType: language === 'en' ? 'original' : 'translation',
        chunksCount: chunks.length,
        imagesCount,
        status: 'ready',
        generatedAt: new Date(),
        chunks: chunks.map((chunk: any, index: number) => ({
          id: chunk.id || `chunk-${index}`,
          content: chunk.content || chunk.text || chunk.markdown,
          pageNumbers: chunk.pageNumbers || chunk.pages || [chunk.page || 1],
          images: chunk.images || []
        })),
        metadata: {
          originalSize: document.size || 0,
          processedSize: JSON.stringify(chunks).length,
          compressionRatio: 0.8, // Estimated
          extractionMethod: language === 'en' ? 'original' : 'translation'
        }
      };

      await db.collection('publishReadyDocuments').insertOne(publishReadyDoc);

      // Remove MongoDB's _id field
      const { _id, ...cleanDoc } = publishReadyDoc as any;

      const response: ApiResponse<PublishReadyDocument> = {
        success: true,
        data: cleanDoc as PublishReadyDocument,
        message: 'Document prepared for publishing successfully',
        timestamp: new Date()
      };

      res.status(201).json(response);

    } catch (processingError) {
      // Create failed preparation record
      const failedDoc: PublishReadyDocument = {
        id: publishReadyId,
        documentId,
        documentName: document.originalName,
        language,
        contentType: language === 'en' ? 'original' : 'translation',
        chunksCount: 0,
        imagesCount: 0,
        status: 'failed',
        generatedAt: new Date(),
        chunks: []
      };

      await db.collection('publishReadyDocuments').insertOne(failedDoc);
      
      throw new ApiError('Failed to prepare document: ' + (processingError as Error).message, 500);
    }

  } catch (error) {
    next(error);
  }
});

// Publish document (link with product and create live URL)
publishingRouter.post('/publish-document', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const { publishReadyDocumentId, productId, version, metadata }: PublishDocumentRequest = req.body;

    // Validate required fields
    if (!publishReadyDocumentId || !productId || !version) {
      throw new ApiError('publishReadyDocumentId, productId, and version are required', 400);
    }

    // Check if publish-ready document exists
    const publishReadyDoc = await db.collection('publishReadyDocuments').findOne({ 
      id: publishReadyDocumentId 
    });
    
    if (!publishReadyDoc) {
      throw new ApiError('Publish-ready document not found', 404);
    }

    if (publishReadyDoc.status !== 'ready') {
      throw new ApiError('Document is not ready for publishing', 400);
    }

    // Check if product exists and is active
    const product = await db.collection('products').findOne({ id: productId });
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    if (product.status !== 'active') {
      throw new ApiError('Product must be active to publish documents', 400);
    }

    // Check if this combination already exists
    const existingPublication = await db.collection('publishedDocuments').findOne({
      publishReadyDocumentId,
      productId,
      version
    });

    if (existingPublication) {
      throw new ApiError('Document is already published with this product and version', 409);
    }

    // Generate URL
    const baseUrl = process.env.DOCS_BASE_URL || 'https://docs.dehn.com';
    const cleanProductCode = product.code.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const url = `${baseUrl}/products/${cleanProductCode}/${publishReadyDoc.language}/${version}`;

    // Create published document
    const publishedDoc: PublishedDocument = {
      id: uuidv4(),
      publishReadyDocumentId,
      productId,
      documentName: publishReadyDoc.documentName,
      productName: product.name,
      productCode: product.code,
      language: publishReadyDoc.language,
      version,
      url,
      publishedAt: new Date(),
      status: 'published',
      metadata: {
        fileSize: JSON.stringify(publishReadyDoc.chunks).length,
        downloadCount: 0,
        seoTags: metadata?.seoTags || []
      }
    };

    await db.collection('publishedDocuments').insertOne(publishedDoc);

    // Remove MongoDB's _id field
    const { _id, ...cleanDoc } = publishedDoc as any;

    const response: ApiResponse<PublishedDocument> = {
      success: true,
      data: cleanDoc as PublishedDocument,
      message: 'Document published successfully',
      timestamp: new Date()
    };

    res.status(201).json(response);

  } catch (error) {
    next(error);
  }
});

// Unpublish document
publishingRouter.post('/unpublish-document/:publishedDocumentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const { publishedDocumentId } = req.params;
    const { reason }: UnpublishDocumentRequest = req.body;

    // Check if published document exists
    const publishedDoc = await db.collection('publishedDocuments').findOne({ 
      id: publishedDocumentId 
    });
    
    if (!publishedDoc) {
      throw new ApiError('Published document not found', 404);
    }

    if (publishedDoc.status === 'unpublished') {
      throw new ApiError('Document is already unpublished', 400);
    }

    // Update status to unpublished
    await db.collection('publishedDocuments').updateOne(
      { id: publishedDocumentId },
      { 
        $set: { 
          status: 'unpublished',
          'metadata.unpublishedAt': new Date(),
          'metadata.unpublishReason': reason || 'Manual unpublish'
        }
      }
    );

    const response: ApiResponse = {
      success: true,
      message: 'Document unpublished successfully',
      timestamp: new Date()
    };

    res.json(response);

  } catch (error) {
    next(error);
  }
});

// Get publishing statistics
publishingRouter.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    
    const [
      publishReadyCount,
      publishedCount,
      unpublishedCount,
      languages,
      productsWithDocs,
      totalDownloads
    ] = await Promise.all([
      db.collection('publishReadyDocuments').countDocuments({ status: 'ready' }),
      db.collection('publishedDocuments').countDocuments({ status: 'published' }),
      db.collection('publishedDocuments').countDocuments({ status: 'unpublished' }),
      db.collection('publishReadyDocuments').distinct('language'),
      db.collection('publishedDocuments').distinct('productId'),
      db.collection('publishedDocuments').aggregate([
        { $group: { _id: null, total: { $sum: '$metadata.downloadCount' } } }
      ]).toArray()
    ]);

    const stats = {
      publishReady: publishReadyCount,
      published: publishedCount,
      unpublished: unpublishedCount,
      totalLanguages: languages.length,
      productsWithDocuments: productsWithDocs.length,
      totalDownloads: totalDownloads[0]?.total || 0,
      availableLanguages: languages
    };

    const response: ApiResponse = {
      success: true,
      data: stats,
      timestamp: new Date()
    };

    res.json(response);

  } catch (error) {
    next(error);
  }
});

// Delete publish-ready document
publishingRouter.delete('/publish-ready-documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const { id } = req.params;

    // Check if document exists
    const doc = await db.collection('publishReadyDocuments').findOne({ id });
    if (!doc) {
      throw new ApiError('Publish-ready document not found', 404);
    }

    // Check if it's already published
    const publishedDoc = await db.collection('publishedDocuments').findOne({ 
      publishReadyDocumentId: id,
      status: 'published'
    });

    if (publishedDoc) {
      throw new ApiError('Cannot delete document that is already published', 409);
    }

    await db.collection('publishReadyDocuments').deleteOne({ id });

    const response: ApiResponse = {
      success: true,
      message: 'Publish-ready document deleted successfully',
      timestamp: new Date()
    };

    res.json(response);

  } catch (error) {
    next(error);
  }
});

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import axios from 'axios';
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
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Mock document storage
const mockDocuments: Document[] = [];

// Get all documents
documentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    let filteredDocs = mockDocuments;
    
    if (search) {
      filteredDocs = mockDocuments.filter(doc => 
        doc.filename.toLowerCase().includes(search.toLowerCase()) ||
        doc.originalName.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = filteredDocs.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedDocs = filteredDocs.slice(startIndex, endIndex);

    const response: PaginatedResponse<Document> = {
      success: true,
      data: paginatedDocs,
      pagination: {
        page,
        limit,
        total,
        pages
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Upload document
documentsRouter.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        timestamp: new Date()
      } as ApiResponse);
    }

    const file = req.file;
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Create document record
    const document: Document = {
      id: documentId,
      filename: `${documentId}.pdf`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: '1', // Mock user ID
      uploadedAt: new Date(),
      status: 'uploaded'
    };

    // Process PDF with Python service
    try {
      const formData = new FormData();
      const blob = new Blob([file.buffer], { type: 'application/pdf' });
      formData.append('file', blob, file.originalname);

      // Note: This would normally use the PDF processor service
      // For now, we'll simulate the processing
      const pdfResult: PDFProcessingResult = {
        success: true,
        metadata: {
          title: 'Sample Document',
          author: '',
          subject: '',
          creator: '',
          producer: '',
          creation_date: '',
          modification_date: '',
          page_count: 1
        },
        content: {
          full_text: 'Sample extracted text from PDF',
          pages: [{
            page_number: 1,
            text: 'Sample extracted text from PDF',
            char_count: 32
          }],
          total_chars: 32,
          images_count: 0
        },
        images: []
      };

      document.status = 'processed';
      document.processedAt = new Date();
      document.metadata = pdfResult.metadata;
      document.content = pdfResult.content?.full_text;
      
    } catch (processingError) {
      console.error('PDF processing failed:', processingError);
      document.status = 'failed';
      document.error = 'PDF processing failed';
    }

    mockDocuments.push(document);

    const response: DocumentUploadResponse = {
      success: true,
      document,
      message: 'Document uploaded successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get document by ID
documentsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = mockDocuments.find(doc => doc.id === req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        timestamp: new Date()
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: document,
      timestamp: new Date()
    } as ApiResponse<Document>);
  } catch (error) {
    next(error);
  }
});

// Delete document
documentsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const index = mockDocuments.findIndex(doc => doc.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        timestamp: new Date()
      } as ApiResponse);
    }

    mockDocuments.splice(index, 1);

    res.json({
      success: true,
      message: 'Document deleted successfully',
      timestamp: new Date()
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

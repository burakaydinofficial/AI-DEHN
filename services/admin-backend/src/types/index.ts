// Common API types and interfaces

// User and Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

// Common API Response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  isActive?: boolean;
}

// Document types
export interface StoragePaths {
  originalPdf?: string; // private bucket path
  analysisJson?: string; // private bucket path
  zipBundle?: string; // private bucket path
  imagesPrefix?: string; // private bucket prefix for images/
}

export interface ExtractionStats {
  pageCount?: number;
  totalChars?: number;
  imagesCount?: number;
}

export interface TranslationArtifact {
  name: string;
  contentType: string;
  size: number;
  uri: string;
  uploadedAt: Date;
  language?: string;
  sourceLayoutLang?: string;
  sourceTextLang?: string;
}

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processedAt?: Date;
  error?: string;
  metadata?: PDFMetadata;
  extractedText?: string;
  storage?: StoragePaths;
  stats?: ExtractionStats;
  translations?: TranslationArtifact[];
}

export interface DocumentUploadResponse {
  success: boolean;
  document?: Document;
  documentId?: string;
  filename?: string;
  status: string;
  message?: string;
}

export interface PDFProcessingResult {
  success: boolean;
  metadata: PDFMetadata;
  content?: {
    full_text?: string;
    pages?: Array<{
      page_number: number;
      text: string;
      char_count: number;
      page_dimensions?: {
        width: number;
        height: number;
        rotation: number;
      }
    }>;
    total_chars?: number;
    images_count?: number;
  };
  images?: any[];
}

// PDF Processing types
export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creation_date: string;
  modification_date: string;
  page_count: number;
}

// AI Agent types
export interface AIPrompt {
  content: string;
  context?: string;
  language?: string;
}

export interface AIResponse {
  content: string;
  confidence?: number;
  tokens_used?: number;
  processing_time?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}

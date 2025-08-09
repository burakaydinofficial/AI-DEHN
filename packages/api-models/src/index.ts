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

// PDF Processing
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

export interface PDFPageContent {
  page_number: number;
  text: string;
  char_count: number;
}

export interface PDFImageInfo {
  page_number: number;
  image_index: number;
  width: number;
  height: number;
}

export interface PDFContent {
  full_text: string;
  pages: PDFPageContent[];
  total_chars: number;
  images_count: number;
}

export interface PDFProcessingResult {
  success: boolean;
  metadata?: PDFMetadata;
  content?: PDFContent;
  images?: PDFImageInfo[];
  error?: string;
}

// Document Management
export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  processedAt?: Date;
  metadata?: PDFMetadata;
  content?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  error?: string;
}

export interface DocumentUploadRequest {
  file: {
    name: string;
    size: number;
    type: string;
    data: Uint8Array | ArrayBuffer;
  };
  metadata?: Partial<PDFMetadata>;
}

export interface DocumentUploadResponse {
  success: boolean;
  document?: Document;
  message?: string;
}

// API Response Wrappers
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// AI Agent
export interface AIPrompt {
  id: string;
  text: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  id: string;
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
  statusCode: number;
}

// Database Models
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Types for specific endpoints
export interface LoginRequest extends AuthRequest {}
export interface RegisterRequest extends AuthRequest {
  name: string;
  confirmPassword: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  isActive?: boolean;
}

export interface DocumentListRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: Document['status'];
  sortBy?: 'uploadedAt' | 'filename' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface AIChatRequest {
  message: string;
  sessionId?: string;
  context?: string;
}

export interface AIAnalyzeDocumentRequest {
  documentId: string;
  prompt?: string;
  includeContent?: boolean;
}

// Environment and Configuration
export interface AppConfig {
  port: number;
  dbUrl: string;
  jwtSecret: string;
  aiApiKey: string;
  pdfProcessorUrl: string;
  corsOrigins: string[];
  environment: 'development' | 'staging' | 'production';
}

// Consolidated API types and interfaces for backend

// Error handling
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

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

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
}

// PDF Processing - Enhanced with layout information
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

export interface FontProperties {
  superscript: boolean;
  italic: boolean;
  serifed: boolean;
  monospaced: boolean;
  bold: boolean;
}

export interface TextSpan {
  bbox: [number, number, number, number]; // [x0, y0, x1, y1]
  text: string;
  font: string;
  size: number;
  flags: number; // Raw font flags
  font_properties: FontProperties;
  color: number; // Raw color value
  color_hex: string; // Hex color string
  ascender: number;
  descender: number;
  origin: [number, number]; // Text origin point
}

export interface TextLine {
  bbox: [number, number, number, number];
  wmode: number; // Writing mode
  dir: [number, number]; // Text direction
  spans: TextSpan[];
}

export interface TextBlock {
  bbox: [number, number, number, number];
  block_type: "text";
  lines: TextLine[];
}

export interface PageDimensions {
  width: number;
  height: number;
  rotation: number;
}

export interface PDFPageContent {
  page_number: number;
  text: string;
  char_count: number;
  page_dimensions: PageDimensions;
  text_blocks: TextBlock[];
}

export interface PDFImageInfo {
  page_number: number;
  image_index: number;
  xref: number; // Image reference number
  smask: number; // Soft mask reference  
  width: number;
  height: number;
  bpc: number; // Bits per component
  colorspace: string; // Color space
  alt: string; // Alternative text
  name: string; // Image name
  filter: string; // Compression filter
  bbox: [number, number, number, number]; // Position on page
  transform: number[] | null; // Transformation matrix
  size_bytes: number; // Image size in bytes
  actual_width: number; // Actual pixel width
  actual_height: number; // Actual pixel height
  colorspace_details: string; // Detailed colorspace info
}

export interface LayoutInfo {
  has_positioning_data: boolean;
  coordinate_system: string;
  bbox_format: string;
  font_flags_decoded: boolean;
  color_format: string;
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
  layout_info?: LayoutInfo;
  error?: string;
}

// Storage and processing artifacts
export interface StoragePaths {
  originalPdf?: string; // private bucket URI
  originalKey?: string; // private bucket key
  analysisJson?: string; // private bucket URI
  analysisKey?: string;  // private bucket key
  zipBundle?: string;    // private bucket URI
  zipKey?: string;       // private bucket key
  reducedJson?: string;  // private bucket URI
  reducedKey?: string;   // private bucket key
  chunksJson?: string;   // private bucket URI
  chunksKey?: string;    // private bucket key
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

export interface PublishedVariant {
  language: string;
  version: 'original' | 'generated' | string;
  url: string; // public URL
  publishedAt: Date;
  artifactKey: string;
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
  // Extended processing data
  storage?: StoragePaths;
  stats?: ExtractionStats;
  translations?: TranslationArtifact[];
  published?: PublishedVariant[];
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

// AI Agent types (moved from ai-agent package)
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

// AI Agent Configuration
export interface AIAgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

// Request/Response Types for specific endpoints
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

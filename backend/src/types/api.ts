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

export interface PDFContent {
  full_text: string;
  pages: PDFPageContent[];
  total_chars: number;
  images_count: number;
}

export interface PDFLayoutInfo {
  has_positioning_data: boolean;
  coordinate_system: string;
  bbox_format: string;
  font_flags_decoded: boolean;
  color_format: string;
}

export interface PDFImageInfo {
  image_index: number;
  width: number;
  height: number;
  colorspace: string;
  bpc: number; // Bits per component
  ext: string; // File extension
  filename: string;
}

export interface PDFAnalysisData {
  success: boolean;
  metadata: PDFMetadata;
  content: PDFContent;
  images: PDFImageInfo[];
  layout_info: PDFLayoutInfo;
  error?: string;
}

export interface ProcessedTextBlock {
  text: string;
  bbox: [number, number, number, number];
  pageNumber: number;
  lines: TextLine[];
}

export interface ContentReductionGroup {
  id: string;
  type: 'title' | 'paragraph' | 'list' | 'table' | 'other';
  originalTexts: LanguageText[];
  bbox: [number, number, number, number];
  pageNumber: number;
  order: number;
  _blockIndices?: number[]; // Temporary field for processing
  _confidence?: number; // AI confidence score
}

export interface ContentReductionResult {
  groups: ContentReductionGroup[];
  languagesDetected: string[];
  totalGroups: number;
  processedAt: Date;
  aiLogs: AILogEntry[];
}

export interface AILogEntry {
  timestamp: Date;
  phase: string;
  prompt?: string;
  response?: string;
  error?: string;
  model?: string;
  fallback?: string;
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
  analysisJson?: string; // private bucket URI for raw extraction JSON
  analysisKey?: string;  // private bucket key
  zipBundle?: string;    // private bucket URI for ZIP with images
  zipKey?: string;       // private bucket key
  reducedJson?: string;  // private bucket URI for content reduction JSON
  reducedKey?: string;   // private bucket key
  chunksJson?: string;   // private bucket URI for markdown chunks JSON
  chunksKey?: string;    // private bucket key
  imagesPrefix?: string; // private bucket prefix for images/
  translationsPrefix?: string; // private bucket prefix for translations/
}

// Content grouping and reduction types
export interface TextGroup {
  id: string;
  type: 'title' | 'paragraph' | 'list' | 'table' | 'other';
  originalTexts: LanguageText[];
  bbox?: [number, number, number, number]; // Overall bounding box
  pageNumber: number;
  order: number; // Order within page
}

export interface LanguageText {
  language: string; // ISO language code (e.g., 'en', 'tr', 'de')
  text: string;
  bbox: [number, number, number, number];
  confidence: number; // Language detection confidence
  isOriginal: boolean; // true for extracted, false for generated
}

// Markdown chunks for content
export interface MarkdownChunk {
  id: string;
  content: string; // Markdown content
  sourceGroups: string[]; // IDs of text groups this chunk represents
  language: string;
  pageNumbers: number[];
  metadata: {
    chunkType: 'page' | 'section' | 'merged';
    layoutReference: string; // Language used for layout reference
    mergedPages?: number[]; // If chunk spans multiple pages
    childChunks?: string[]; // Child chunk IDs for complex layouts
  };
}

export interface ChunksResult {
  chunks: MarkdownChunk[];
  totalChunks: number;
  languages: string[];
  processedAt: Date;
  metadata: {
    chunkingStrategy: string;
    aiModel: string;
    processingTime: number;
  };
}

// Translation generation types
export interface TranslationRequest {
  sourceLanguage: string;
  targetLanguage: string;
  layoutReferenceLanguage?: string; // Language to use for layout reference
  textReferenceLanguage?: string;   // Language to use for text reference
  includeContext: boolean; // Include other language versions as context
}

export interface TranslationResult {
  translatedGroups: TextGroup[];
  targetLanguage: string;
  sourceLanguage: string;
  layoutReference: string;
  textReference: string;
  generatedAt: Date;
  metadata: {
    aiModel: string;
    processingTime: number;
    contextLanguages: string[];
    qualityScore?: number;
  };
}

export interface ExtractionStats {
  pageCount?: number;
  totalChars?: number;
  imagesCount?: number;
  languagesDetected?: number;
  textGroupsCount?: number;
  chunksGenerated?: number;
}

export interface TranslationArtifact {
  id: string;
  name: string;
  contentType: string;
  size: number;
  uri: string;
  uploadedAt: Date;
  language: string;
  sourceLayoutLang: string;
  sourceTextLang: string;
  version: 'original' | 'generated';
  metadata?: any;
}

export interface PublishedVariant {
  id: string;
  language: string;
  version: 'original' | 'generated' | string;
  artifactId: string; // References TranslationArtifact.id
  url: string; // public URL
  publishedAt: Date;
  isActive: boolean;
  previewData?: any; // Layout data for preview
}

// Document workflow API types
export interface ContentReductionRequest {
  documentId: string;
  aiModel?: string;
  groupingStrategy?: 'layout-based' | 'semantic' | 'mixed';
  languageDetectionThreshold?: number;
}

export interface ChunksRequest {
  documentId: string;
  chunkSize?: number; // words per chunk
  preserveLayout?: boolean;
  includeImages?: boolean;
  markdownOptions?: MarkdownOptions;
}

export interface MarkdownOptions {
  includeHeaders?: boolean;
  includeFooters?: boolean;
  preserveFormatting?: boolean;
  imageHandling?: 'embed' | 'link' | 'caption';
}

export interface ChunkMetadata {
  totalChunks: number;
  totalWords: number;
  avgWordsPerChunk: number;
  languages: string[];
  hasImages: boolean;
}

export interface TranslationGenerationRequest {
  documentId: string;
  targetLanguages: string[];
  sourceLanguage?: string;
  layoutReferenceLanguage?: string;
  textReferenceLanguage?: string;
  includeImages?: boolean;
  preserveLayout?: boolean;
  customPrompt?: string;
  useContext?: boolean;
}

export interface TranslatedImage {
  originalPath: string;
  translatedPath: string;
  altText?: string;
  caption?: string;
}

export interface PublishRequest {
  documentId: string;
  languages?: string[];
  includeChunks?: boolean;
  includeTranslations?: boolean;
  format?: 'web' | 'mobile' | 'both';
  preview?: boolean;
}

export interface PublishResult {
  publishedAt: Date;
  formats: PublishedFormat[];
  previewUrl?: string;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface PublishedFormat {
  format: 'web' | 'mobile';
  languages: string[];
  url: string;
  size: number;
  checksum: string;
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
  status: 'uploaded' | 'processing' | 'processed' | 'reduced' | 'chunked' | 'translated' | 'published' | 'failed';
  error?: string;
  // Extended processing data
  storage?: StoragePaths;
  stats?: ExtractionStats;
  translations?: TranslationArtifact[];
  published?: PublishedVariant[];
  // New workflow support
  contentReduction?: ContentReductionResult;
  chunks?: ChunksResult;
  availableLanguages?: string[]; // Languages available for this document
  processingStage?: 'upload' | 'extraction' | 'reduction' | 'chunking' | 'translation' | 'publishing';
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

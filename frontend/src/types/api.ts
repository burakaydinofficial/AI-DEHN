// API types for frontend - consolidated from admin-frontend and mobile-frontend

// Core API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Document types - supporting both admin and mobile features
export interface Document {
  id: string;
  originalName: string;
  fileSize: number;
  size?: number; // Legacy field name for compatibility
  uploadedAt: Date;
  uploadedBy: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pages?: number;
  textContent?: string;
  processed?: ProcessedVariant[];
  published?: PublishedVariant[];
  translations?: any[];
  error?: string;
  // Admin-specific fields
  storage?: {
    analysisKey?: string;
    reducedKey?: string;
    chunksKey?: string;
    analysisJson?: any;
    reducedJson?: any;
    chunksJson?: any;
    imagesPrefix?: string;
  };
  // Mobile-specific fields
  title?: string;
  languages?: string[];
  publishedAt?: Date;
  thumbnail?: string;
}

export interface ProcessedVariant {
  id: string;
  type: 'summary' | 'qa' | 'insights' | 'simplified';
  language: string;
  content: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface PublishedVariant {
  id: string;
  type: 'summary' | 'qa' | 'insights' | 'simplified';
  language: string;
  version?: string; // Legacy field for compatibility
  title: string;
  description?: string;
  content: string;
  publishedAt: Date;
  isActive: boolean;
  downloadUrl?: string;
  url?: string; // Legacy field name for compatibility
  pageLayout?: PageLayout[];
}

export interface PageLayout {
  pageNumber: number;
  content: any[];
  images: string[];
  dimensions: {
    width: number;
    height: number;
  };
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse extends ApiResponse<{ user: User; token: string }> {}

// AI Chat types
export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Configuration types
export interface AIAgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

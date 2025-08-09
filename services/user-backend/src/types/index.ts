// Simple types for user backend

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: Date;
}

export interface Document {
  id: string;
  title: string;
  languages: string[];
  publishedAt: Date;
  thumbnail?: string;
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

// Shared constants for the frontend application
// These replace hardcoded string literals throughout the codebase

export const DOCUMENT_STATUS = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing', 
  PROCESSED: 'processed',
  REDUCING: 'reducing',
  REDUCED: 'reduced',
  CHUNKED: 'chunked',
  TRANSLATING: 'translating',
  TRANSLATED: 'translated',
  PUBLISHED: 'published',
  FAILED: 'failed',
  ANALYZED: 'analyzed'
} as const;

export const UPLOAD_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export const PRIORITY_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high', 
  CRITICAL: 'critical'
} as const;

export const PUBLISH_STATUS = {
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished'
} as const;

export const ACTIVITY_STATUS = {
  PROCESSING: 'processing',
  REDUCTION: 'reduction',
  TRANSLATION: 'translation',
  PUBLISHING: 'publishing',
  FAILED: 'failed',
  IN_PROGRESS: 'in-progress',
  ERROR: 'error'
} as const;

// Type exports for better TypeScript support
export type DocumentStatus = typeof DOCUMENT_STATUS[keyof typeof DOCUMENT_STATUS];
export type UploadStatus = typeof UPLOAD_STATUS[keyof typeof UPLOAD_STATUS];
export type PriorityLevel = typeof PRIORITY_LEVEL[keyof typeof PRIORITY_LEVEL];
export type PublishStatus = typeof PUBLISH_STATUS[keyof typeof PUBLISH_STATUS];
export type ActivityStatus = typeof ACTIVITY_STATUS[keyof typeof ACTIVITY_STATUS];

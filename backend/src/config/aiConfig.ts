/**
 * AI Configuration for different processing phases
 * Centralized configuration for temperature, tokens, and model settings
 */

export interface AIProcessingConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  timeout?: number;
}

export interface AIPromptConfig extends AIProcessingConfig {
  promptTemplate?: string;
  fallbackStrategy?: 'simple' | 'position-based' | 'layout-based';
  retryAttempts?: number;
}

/**
 * AI configuration for content reduction processing
 */
export const CONTENT_REDUCTION_CONFIG = {
  // Text grouping configuration
  textGrouping: {
    model: 'gemini-1.5-pro',
    temperature: 0.2,
    maxOutputTokens: 4000,
    timeout: 30000,
    retryAttempts: 2,
    fallbackStrategy: 'position-based' as const
  },

  // Language detection configuration
  languageDetection: {
    model: 'gemini-1.5-pro',
    temperature: 0.1,
    maxOutputTokens: 10,
    timeout: 10000,
    retryAttempts: 3,
    fallbackStrategy: 'simple' as const
  },

  // Markdown generation configuration
  markdownGeneration: {
    model: 'gemini-1.5-pro',
    temperature: 0.3,
    maxOutputTokens: 2000,
    timeout: 20000,
    retryAttempts: 1,
    fallbackStrategy: 'simple' as const
  }
} as const;

/**
 * Global AI processing settings
 */
export const AI_PROCESSING_SETTINGS = {
  // Confidence thresholds
  languageConfidenceThreshold: 0.8,
  groupingConfidenceThreshold: 0.5,
  
  // Performance settings
  maxTextBlocksPerRequest: 30,
  maxGroupsPerBatch: 20,
  maxChunkSize: 150,
  
  // Quality settings
  minTextLength: 10,
  minBlockLength: 3,
  
  // Model preferences
  primaryModel: 'gemini-1.5-pro',
  fallbackModel: 'gemini-1.5-flash',
  
  // Logging
  enableDetailedLogging: true,
  logPromptLength: 500,
  logResponseLength: 1000
} as const;

/**
 * Get AI configuration for a specific processing phase
 */
export function getAIConfig(phase: keyof typeof CONTENT_REDUCTION_CONFIG): AIPromptConfig {
  return { ...CONTENT_REDUCTION_CONFIG[phase] };
}

/**
 * Create custom AI configuration by merging with defaults
 */
export function createCustomAIConfig(
  basePhase: keyof typeof CONTENT_REDUCTION_CONFIG,
  overrides: Partial<AIPromptConfig>
): AIPromptConfig {
  const baseConfig = getAIConfig(basePhase);
  return { ...baseConfig, ...overrides };
}

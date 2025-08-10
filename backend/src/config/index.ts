/**
 * Centralized configuration management for the DEHN backend
 * Handles environment variables, validation, and provides typed configuration
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env files
config(); // Default .env file  
config({ path: '.env.local' }); // Local development overrides
config({ path: '../.env.local' }); // Root level .env.local

export interface DatabaseConfig {
  uri: string;
  name: string;
}

export interface StorageConfig {
  root: string;
  privateDir: string;
  publicDir: string;
}

export interface AIConfig {
  apiKey?: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
}

interface ServerConfig {
  port: number;
  jwtSecret: string;
  nodeEnv: string;
  corsOrigin: string;
  apiPrefix: string;
}

export interface ServiceConfig {
  pdfProcessorUrl: string;
}

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  storage: StorageConfig;
  ai: AIConfig;
  services: ServiceConfig;
}

/**
 * Get environment variable with optional default and validation
 */
function getEnvVar(name: string, defaultValue?: string, required: boolean = false): string {
  const value = process.env[name] || defaultValue;
  
  if (required && !value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  
  return value || '';
}

/**
 * Get environment variable as number
 */
function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid number for ${name}: ${value}. Using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return parsed;
}

/**
 * Get environment variable as float
 */
function getEnvFloat(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    console.warn(`Invalid float for ${name}: ${value}. Using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return parsed;
}

/**
 * Create and validate application configuration
 */
export function createAppConfig(): AppConfig {
  // Server Configuration
  const server: ServerConfig = {
    port: Number(getEnvVar('PORT', '3001')),
    jwtSecret: getEnvVar('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
    apiPrefix: getEnvVar('API_PREFIX', '/api')
  };

  // Database Configuration
  const database: DatabaseConfig = {
    uri: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017', true),
    name: getEnvVar('DB_NAME', 'dehn')
  };

  // Storage Configuration
  const storageRoot = getEnvVar('STORAGE_ROOT', './storage');
  const storage: StorageConfig = {
    root: path.resolve(storageRoot),
    privateDir: path.resolve(storageRoot, 'private'),
    publicDir: path.resolve(storageRoot, 'public')
  };

  // AI Configuration
  // AI Configuration - prioritize GEMINI_API_KEY
  const aiApiKey = getEnvVar('GEMINI_API_KEY') || getEnvVar('AI_API_KEY') || getEnvVar('GOOGLE_AI_API_KEY');
  const ai: AIConfig = {
    apiKey: aiApiKey,
    model: getEnvVar('AI_MODEL', 'gemini-1.5-flash'),
    temperature: getEnvFloat('AI_TEMPERATURE', 0.7),
    maxOutputTokens: getEnvNumber('AI_MAX_OUTPUT_TOKENS', 2048),
    topP: getEnvFloat('AI_TOP_P', 0.95),
    topK: getEnvNumber('AI_TOP_K', 40)
  };

  // Services Configuration
  const services: ServiceConfig = {
    pdfProcessorUrl: getEnvVar('PDF_PROCESSOR_URL', 'http://localhost:3002', true)
  };

  const config: AppConfig = {
    server,
    database,
    storage,
    ai,
    services
  };

  // Validate configuration
  validateConfig(config);

  return config;
}

/**
 * Validate configuration and warn about potential issues
 */
function validateConfig(config: AppConfig): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check AI configuration
  if (!config.ai.apiKey) {
    warnings.push('GEMINI_API_KEY not found. AI features will be disabled.');
  }

  // Check database URI
  if (!config.database.uri.includes('mongodb://') && !config.database.uri.includes('mongodb+srv://')) {
    errors.push('Invalid MongoDB URI format');
  }

  // Check temperature range
  if (config.ai.temperature < 0 || config.ai.temperature > 2) {
    warnings.push(`AI temperature ${config.ai.temperature} is outside recommended range (0-2)`);
  }

  // Check topP range
  if (config.ai.topP < 0 || config.ai.topP > 1) {
    warnings.push(`AI topP ${config.ai.topP} is outside valid range (0-1)`);
  }

  // Log warnings
  warnings.forEach(warning => {
    console.warn(`⚠️  Configuration Warning: ${warning}`);
  });

  // Throw errors
  if (errors.length > 0) {
    throw new Error(`Configuration Errors:\n${errors.join('\n')}`);
  }
}

/**
 * Log configuration summary (without sensitive data)
 */
export function logConfigSummary(config: AppConfig): void {
  console.log('📋 Configuration Summary:');
  console.log(`   Server: ${config.server.nodeEnv} mode on port ${config.server.port}`);
  console.log(`   Database: ${config.database.uri.replace(/\/\/.*@/, '//***@')}`);
  console.log(`   Storage: ${config.storage.root}`);
  console.log(`   AI Model: ${config.ai.model} ${config.ai.apiKey ? '✅' : '❌'}`);
  console.log(`   PDF Processor: ${config.services.pdfProcessorUrl}`);
}

// Create and export singleton configuration
export const appConfig = createAppConfig();

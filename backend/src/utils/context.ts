import type { Db } from 'mongodb';
import type { StorageProvider } from './index';
import { AIAgent } from './aiAgent';

let _db: Db | undefined;
let _storage: StorageProvider | undefined;
let _config: any | undefined;
let _aiAgent: AIAgent | undefined;

export function setDb(db: Db) {
  _db = db;
}
export function getDb(): Db {
  if (!_db) throw new Error('Database not initialized');
  return _db;
}

export function setStorage(storage: StorageProvider) {
  _storage = storage;
}
export function getStorage(): StorageProvider {
  if (!_storage) throw new Error('Storage not initialized');
  return _storage;
}

export function setConfig(cfg: any) {
  _config = cfg;
}
export function getConfig<T = any>(): T {
  if (!_config) throw new Error('Config not initialized');
  return _config as T;
}

export function setAIAgent(aiAgent: AIAgent) {
  _aiAgent = aiAgent;
}
export function getAIAgent(): AIAgent {
  if (!_aiAgent) throw new Error('AI Agent not initialized');
  return _aiAgent;
}

// Combined context getter for convenience
export function getAppContext() {
  return {
    database: getDb(),
    storage: getStorage(),
    config: getConfig(),
    aiAgent: getAIAgent()
  };
}

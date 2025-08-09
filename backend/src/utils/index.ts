/*
  Local File System Storage Provider
  - Simple local file storage for MVP
  - No cloud dependencies
*/
import * as fs from 'fs';
import * as path from 'path';

export interface StorageProviderConfig {
  storageRoot: string;
}

export interface StorageProvider {
  ensureBuckets(): Promise<void>;
  uploadPrivate(params: { key: string; contentType: string; body: Buffer | Uint8Array | string }): Promise<string>;
  uploadPublic(params: { key: string; contentType: string; body: Buffer | Uint8Array | string }): Promise<string>;
  downloadPrivate(key: string): Promise<Buffer>;
}

class LocalFileSystemProvider implements StorageProvider {
  private privateDir: string;
  private publicDir: string;

  constructor(private cfg: StorageProviderConfig) {
    this.privateDir = path.join(cfg.storageRoot, 'private');
    this.publicDir = path.join(cfg.storageRoot, 'public');
  }

  async ensureBuckets() {
    await fs.promises.mkdir(this.privateDir, { recursive: true });
    await fs.promises.mkdir(this.publicDir, { recursive: true });
  }

  async uploadPrivate({ key, contentType, body }: { key: string; contentType: string; body: Buffer | Uint8Array | string }): Promise<string> {
    const filePath = path.join(this.privateDir, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, body);
    return `file://private/${key}`;
  }

  async uploadPublic({ key, contentType, body }: { key: string; contentType: string; body: Buffer | Uint8Array | string }): Promise<string> {
    const filePath = path.join(this.publicDir, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, body);
    return `file://public/${key}`;
  }

  async downloadPrivate(key: string): Promise<Buffer> {
    const filePath = path.join(this.privateDir, key);
    return await fs.promises.readFile(filePath);
  }
}

export function createStorageProvider(cfg: StorageProviderConfig): StorageProvider {
  return new LocalFileSystemProvider(cfg);
}

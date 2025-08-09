// Storage provider interface and implementation

export interface UploadParams {
  key: string;
  contentType: string;
  body: Buffer;
}

export interface StorageProvider {
  uploadFile(key: string, buffer: Buffer, mimeType?: string): Promise<string>;
  downloadFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getFileUrl(key: string, expiresIn?: number): Promise<string>;
  uploadPrivate(params: UploadParams): Promise<string>;
  uploadPublic(params: UploadParams): Promise<string>;
  downloadPrivate(key: string): Promise<Buffer>;
}

// Mock storage implementation for development
export class MockStorageProvider implements StorageProvider {
  private files = new Map<string, Buffer>();

  async uploadFile(key: string, buffer: Buffer, mimeType?: string): Promise<string> {
    this.files.set(key, buffer);
    return `mock://storage/${key}`;
  }

  async uploadPrivate(params: UploadParams): Promise<string> {
    this.files.set(params.key, params.body);
    return `mock://private/${params.key}`;
  }

  async uploadPublic(params: UploadParams): Promise<string> {
    this.files.set(params.key, params.body);
    return `mock://public/${params.key}`;
  }

  async downloadFile(key: string): Promise<Buffer> {
    const file = this.files.get(key);
    if (!file) throw new Error(`File not found: ${key}`);
    return file;
  }

  async downloadPrivate(key: string): Promise<Buffer> {
    const file = this.files.get(key);
    if (!file) throw new Error(`Private file not found: ${key}`);
    return file;
  }

  async deleteFile(key: string): Promise<void> {
    this.files.delete(key);
  }

  async getFileUrl(key: string, expiresIn = 3600): Promise<string> {
    return `mock://storage/${key}?expires=${Date.now() + expiresIn * 1000}`;
  }
}

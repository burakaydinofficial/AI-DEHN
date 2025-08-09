/*
  Storage Provider Abstraction
  - Supports Google Cloud Storage (public/private buckets)
  - Supports S3-compatible (MinIO) storage
  Business logic for buckets stays here to keep routes clean.
*/
import { Storage } from '@google-cloud/storage';
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';

export interface StorageProviderConfig {
  googleCloudProjectId?: string;
  googleApplicationCredentials?: string;
  publicBucket: string;
  privateBucket: string;
  minio?: {
    endPoint: string;
    accessKey: string;
    secretKey: string;
    useSSL: boolean;
  };
}

export interface StorageProvider {
  ensureBuckets(): Promise<void>;
  uploadPrivate(params: { key: string; contentType: string; body: Buffer | Uint8Array | string }): Promise<string>;
  uploadPublic(params: { key: string; contentType: string; body: Buffer | Uint8Array | string }): Promise<string>;
  downloadPrivate(key: string): Promise<Buffer>;
}

class GCSProvider implements StorageProvider {
  private storage: Storage;
  constructor(private cfg: StorageProviderConfig) {
    this.storage = new Storage({
      projectId: cfg.googleCloudProjectId,
      keyFilename: cfg.googleApplicationCredentials,
    });
  }
  async ensureBuckets() {
    const buckets = [this.cfg.privateBucket, this.cfg.publicBucket];
    for (const b of buckets) {
      const [exists] = await this.storage.bucket(b).exists();
      if (!exists) {
        await this.storage.createBucket(b);
      }
    }
  }
  async uploadPrivate({ key, contentType, body }: { key: string; contentType: string; body: Buffer | Uint8Array | string }) {
    const bucket = this.storage.bucket(this.cfg.privateBucket);
    const file = bucket.file(key);
    await file.save(body as Buffer, { contentType });
    return `gs://${this.cfg.privateBucket}/${key}`;
  }
  async uploadPublic({ key, contentType, body }: { key: string; contentType: string; body: Buffer | Uint8Array | string }) {
    const bucket = this.storage.bucket(this.cfg.publicBucket);
    const file = bucket.file(key);
    await file.save(body as Buffer, { contentType });
    await file.makePublic();
    return `https://storage.googleapis.com/${this.cfg.publicBucket}/${encodeURIComponent(key)}`;
  }
  async downloadPrivate(key: string): Promise<Buffer> {
    const [buf] = await this.storage.bucket(this.cfg.privateBucket).file(key).download();
    return buf as Buffer;
  }
}

class S3CompatibleProvider implements StorageProvider {
  private s3: S3Client;
  private endpoint?: string;
  constructor(private cfg: StorageProviderConfig) {
    const { endPoint, accessKey, secretKey } = cfg.minio!;
    this.endpoint = endPoint.replace(/\/$/, '');
    this.s3 = new S3Client({
      region: 'us-east-1',
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      endpoint: this.endpoint,
      forcePathStyle: true,
    } as any);
  }
  async ensureBuckets() {
    for (const bucket of [this.cfg.privateBucket, this.cfg.publicBucket]) {
      try {
        await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
      }
    }
  }
  async uploadPrivate({ key, contentType, body }: { key: string; contentType: string; body: Buffer | Uint8Array | string }) {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.cfg.privateBucket,
      Key: key,
      Body: body as any,
      ContentType: contentType,
    }));
    return `${this.endpoint}/${this.cfg.privateBucket}/${key}`;
  }
  async uploadPublic({ key, contentType, body }: { key: string; contentType: string; body: Buffer | Uint8Array | string }) {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.cfg.publicBucket,
      Key: key,
      Body: body as any,
      ContentType: contentType,
      ACL: 'public-read',
    } as any));
    return `${this.endpoint}/${this.cfg.publicBucket}/${key}`;
  }
  async downloadPrivate(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const resp: any = await this.s3.send(new GetObjectCommand({ Bucket: this.cfg.privateBucket, Key: key }));
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      resp.Body.on('data', (c: Buffer) => chunks.push(c));
      resp.Body.on('end', () => resolve());
      resp.Body.on('error', reject);
    });
    return Buffer.concat(chunks);
  }
}

export function createStorageProvider(cfg: StorageProviderConfig): StorageProvider {
  // Prefer MinIO if env vars present; otherwise use GCS
  if (cfg.minio?.endPoint && cfg.minio?.accessKey && cfg.minio?.secretKey) {
    return new S3CompatibleProvider(cfg);
  }
  return new GCSProvider(cfg);
}

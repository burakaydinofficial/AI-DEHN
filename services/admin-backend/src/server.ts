import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
// Removed direct Storage import, using StorageProvider abstraction instead
import { authRouter } from './routes/auth';
import { documentsRouter } from './routes/documents';
import { usersRouter } from './routes/users';
import { aiRouter } from './routes/ai';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { setDb, setStorage, setConfig } from './utils/context';

// Load environment variables
dotenv.config();

const app = express();

// Configuration
const config = {
  port: parseInt(process.env.PORT || '3091'),
  mongoUrl: process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017',
  databaseName: process.env.DATABASE_NAME || 'dehn',
  jwtSecret: process.env.JWT_SECRET || 'admin-jwt-secret-change-in-production',
  aiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  pdfProcessorUrl: process.env.PDF_PROCESSOR_URL || 'http://localhost:3095',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8091'],
  environment: (process.env.NODE_ENV as any) || 'development',
  // Storage configuration
  googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  privateBucket: process.env.MINIO_BUCKET_PRIVATE || 'dehn-private',
  publicBucket: process.env.MINIO_BUCKET_PUBLIC || 'dehn-public',
  minioEndpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  minioAccessKey: process.env.MINIO_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
  minioSecretKey: process.env.MINIO_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  minioUseSSL: process.env.MINIO_USE_SSL === 'true' || false,
};

// Global database connection
let db: Db;
// Replace concrete GCS Storage type with our provider interface
let storageProvider: import('./utils/storage/index').StorageProvider;

// Initialize database connection
async function initializeDatabase() {
  try {
    const client = new MongoClient(config.mongoUrl);
    await client.connect();
    db = client.db(config.databaseName);
    console.log(`✅ Connected to MongoDB: ${config.databaseName}`);
    
    // Initialize collections and indexes
    await initializeCollections();
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    // In development, continue without database
    if (config.environment === 'development') {
      console.warn('⚠️  Continuing in development mode without database');
    } else {
      process.exit(1);
    }
  }
}

// Initialize storage client
async function initializeStorage() {
  try {
    const { createStorageProvider } = await import('./utils/storage/index');
    storageProvider = createStorageProvider({
      googleCloudProjectId: config.googleCloudProjectId,
      googleApplicationCredentials: config.googleApplicationCredentials,
      privateBucket: config.privateBucket,
      publicBucket: config.publicBucket,
      minio: {
        endPoint: config.minioEndpoint,
        accessKey: config.minioAccessKey,
        secretKey: config.minioSecretKey,
        useSSL: config.minioUseSSL,
      }
    });
    await storageProvider.ensureBuckets();
    console.log('✅ Storage provider initialized');
  } catch (error) {
    console.error('❌ Failed to initialize storage:', error);
  }
}

// Initialize database collections and indexes
async function initializeCollections() {
  if (!db) return;
  
  try {
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = ['users', 'documents', 'sessions'];
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      }
    }
    
    // Create indexes
    await db.collection('documents').createIndex({ 'filename': 1 });
    await db.collection('documents').createIndex({ 'status': 1 });
    await db.collection('documents').createIndex({ 'uploadedAt': -1 });
    await db.collection('users').createIndex({ 'email': 1 }, { unique: true });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ Failed to initialize collections:', error);
  }
}

// Make database and storage available globally
export { db, /* storage */ storageProvider as storage, config };

// Initialize connections
initializeDatabase().then(() => {
  if (db) setDb(db);
});
initializeStorage().then(() => {
  if (storageProvider) setStorage(storageProvider);
});
setConfig(config);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'admin-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/ai', aiRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Admin Backend Server running on port ${config.port}`);
  console.log(`📝 Environment: ${config.environment}`);
  console.log(`🔗 PDF Processor URL: ${config.pdfProcessorUrl}`);
  console.log(`🌐 CORS Origins: ${config.corsOrigins.join(', ')}`);
});

export default app;

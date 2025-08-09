import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';
import { createStorageProvider } from './utils';
import { setDb, setStorage, setConfig } from './utils/context';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
let db: Db;
let client: MongoClient;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', // Admin frontend
    'http://localhost:5174', // Mobile frontend
    'http://localhost:3000', // Alternative frontend port
    ...(process.env.FRONTEND_URLS?.split(',') || [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'dehn-backend',
    version: '1.0.0'
  });
});

// MongoDB connection setup
async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/dehn';
    console.log(`🔌 Connecting to MongoDB at ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    client = new MongoClient(mongoUri);
    await client.connect();
    
    const dbName = process.env.MONGO_DB_NAME || 'dehn';
    db = client.db(dbName);
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('✅ Successfully connected to MongoDB');
    
    // Initialize collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('documents')) {
      await db.createCollection('documents');
      console.log('✅ Created collection: documents');
    }
    
    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      console.log('✅ Created collection: users');
    }
    
    // Create indexes
    await db.collection('documents').createIndex({ uploadedAt: -1 });
    await db.collection('documents').createIndex({ status: 1 });
    await db.collection('documents').createIndex({ uploadedBy: 1 });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    console.log('✅ Database indexes created');
    
    // Initialize storage
    const storageRoot = process.env.STORAGE_ROOT || '/app/storage';
    const storage = createStorageProvider({ storageRoot });
    await storage.ensureBuckets();
    console.log('✅ Local file storage initialized');
    
    // Initialize context
    setDb(db);
    setStorage(storage);
    setConfig({
      jwtSecret: process.env.JWT_SECRET || 'dev-secret',
      aiApiKey: process.env.AI_API_KEY,
      storageRoot
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Import and use routes
import { authRouter } from './routes/auth';
import { documentsRouter as adminDocumentsRouter } from './routes/admin/documents';
import { documentsRouter as publicDocumentsRouter } from './routes/public/documents';
import { usersRouter } from './routes/admin/users';
import { aiRouter } from './routes/ai';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Make db available to routes
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).db = db;
  next();
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/admin/documents', adminDocumentsRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/admin/ai', aiRouter);
app.use('/api/documents', publicDocumentsRouter); // Public user routes
app.use('/api/ai', aiRouter); // AI routes available for both admin and users

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server after database connection
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 DEHN Backend server is running on port ${PORT}`);
    console.log(`🌐 API available at http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Received SIGINT, shutting down gracefully');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

export { db };

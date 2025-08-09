import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';

// Load environment variables
dotenv.config();

const app = express();

// Configuration
const config = {
  port: parseInt(process.env.PORT || '3090'),
  mongoUrl: process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017',
  databaseName: process.env.DATABASE_NAME || 'dehn',
  jwtSecret: process.env.JWT_SECRET || 'user-jwt-secret-change-in-production',
  aiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  pdfProcessorUrl: process.env.PDF_PROCESSOR_URL || 'http://localhost:3095',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8090'],
  environment: (process.env.NODE_ENV as any) || 'development'
};

// Global database connection
let db: Db;

// Initialize database connection
async function initializeDatabase() {
  try {
    const client = new MongoClient(config.mongoUrl);
    await client.connect();
    db = client.db(config.databaseName);
    console.log(`✅ Connected to MongoDB: ${config.databaseName}`);
    await initializeCollections();
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    if (config.environment === 'development') {
      console.warn('⚠️  Continuing in development mode without database');
    } else {
      process.exit(1);
    }
  }
}

async function initializeCollections() {
  if (!db) return;
  const collections = await db.listCollections().toArray();
  const names = collections.map(c => c.name);
  if (!names.includes('documents')) {
    await db.createCollection('documents');
    console.log('✅ Created collection: documents');
  }
  await db.collection('documents').createIndex({ uploadedAt: -1 });
  await db.collection('documents').createIndex({ status: 1 });
}

// Make database available globally
export { db, config };

// Initialize connections
initializeDatabase();

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
    service: 'user-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
import { documentsRouter } from './routes/documents';
app.use('/api/documents', documentsRouter);

app.use('/api/auth', (req, res) => {
  res.json({ message: 'User auth endpoints coming soon...' });
});

app.use('/api/ai', (req, res) => {
  res.json({ message: 'User AI endpoints coming soon...' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date()
  });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error occurred:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date()
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 User Backend Server running on port ${config.port}`);
  console.log(`📝 Environment: ${config.environment}`);
  console.log(`🌐 CORS Origins: ${config.corsOrigins.join(', ')}`);
});

export default app;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppConfig } from '@dehn/api-models';
import { authRouter } from './routes/auth';
import { documentsRouter } from './routes/documents';
import { usersRouter } from './routes/users';
import { aiRouter } from './routes/ai';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Load environment variables
dotenv.config();

const app = express();

// Configuration
const config: AppConfig = {
  port: parseInt(process.env.PORT || '3002'),
  dbUrl: process.env.DATABASE_URL || 'sqlite:./admin.db',
  jwtSecret: process.env.JWT_SECRET || 'admin-jwt-secret-change-in-production',
  aiApiKey: process.env.AI_API_KEY || '',
  pdfProcessorUrl: process.env.PDF_PROCESSOR_URL || 'http://localhost:3001',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  environment: (process.env.NODE_ENV as any) || 'development'
};

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

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppConfig } from '@dehn/api-models';

// Load environment variables
dotenv.config();

const app = express();

// Configuration
const config: AppConfig = {
  port: parseInt(process.env.PORT || '3002'),
  dbUrl: process.env.DATABASE_URL || 'sqlite:./user.db',
  jwtSecret: process.env.JWT_SECRET || 'user-jwt-secret-change-in-production',
  aiApiKey: process.env.AI_API_KEY || '',
  pdfProcessorUrl: process.env.PDF_PROCESSOR_URL || 'http://localhost:8080',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5174'],
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
    service: 'user-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes (basic structure for now)
app.use('/api/auth', (req, res) => {
  res.json({ message: 'User auth endpoints coming soon...' });
});

app.use('/api/documents', (req, res) => {
  res.json({ message: 'User document endpoints coming soon...' });
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

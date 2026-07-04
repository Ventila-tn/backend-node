import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import pool from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware - CORS configuration matching Spring Boot
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: corsOrigin !== '*'
}));

// Middleware pour vérifier la taille du payload AVANT traitement
app.use('/api/products', (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 2 * 1024 * 1024; // 2MB limite très sécurisée pour Vercel
  
  if (contentLength > maxSize) {
    console.log(`🚫 Payload trop gros: ${contentLength} bytes (max: ${maxSize})`);
    return res.status(413).json({ 
      error: 'Payload too large',
      message: 'Les images sont trop lourdes. Utilisez l\'endpoint /images ou compressez davantage.',
      maxSize: maxSize,
      receivedSize: contentLength,
      recommendation: 'Utilisez PUT /api/products/{id}/images pour les images'
    });
  }
  
  next();
});

app.use(express.json({ limit: '3mb' })); // Réduit de 10mb à 3mb
app.use(express.urlencoded({ extended: true, limit: '3mb' }));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'E-commerce Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api-docs'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (only in non-Vercel environment)
if (process.env.VERCEL !== '1') {
  const startServer = async () => {
    try {
      // Test database connection
      await pool.query('SELECT NOW()');
      console.log('✓ Database connected successfully');

      app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✓ API available at http://localhost:${PORT}/api`);
      });
    } catch (error) {
      console.error('✗ Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await pool.end();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing server...');
    await pool.end();
    process.exit(0);
  });
}

// Export for Vercel
export default app;


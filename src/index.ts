// src/index.ts
import express, { type Express, type Request, type Response } from "express";
import dotenv from 'dotenv';
import DatabaseConnection from './config/database.js';
import customerRoutes from './routes/customerRoutes.js';
import { 
  globalErrorHandler, 
  notFoundHandler, 
  requestLogger 
} from './middleware/errorHandler.js';
import { 
  securityMiddleware, 
  generalRateLimit, 
  createCustomerRateLimit 
} from './middleware/security.js';

// Cargar variables de entorno
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Conectar a la base de datos
const db = DatabaseConnection.getInstance();

async function startServer() {
  try {
    // Conectar a MongoDB
    await db.connect();
    
    // Middleware de logging
    app.use(requestLogger);
    
    // Middleware de seguridad
    app.use(securityMiddleware);
    
    // Rate limiting general
    app.use(generalRateLimit);
    
    // Middleware para parsing JSON
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Health check endpoint
    app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'MS1 - Customer Service',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        description: 'Customer onboarding, identity management, profile updates',
        endpoints: {
          health: '/api/customers/health',
          customers: '/api/customers',
          documentation: 'Coming soon'
        }
      });
    });
    
    // Rutas de la API con rate limiting específico para creación
    app.use('/api/customers', (req, res, next) => {
      if (req.method === 'POST' && req.path === '/') {
        return createCustomerRateLimit(req, res, next);
      }
      next();
    }, customerRoutes);
    
    // Middleware para rutas no encontradas
    app.use(notFoundHandler);
    
    // Middleware global de manejo de errores (debe ser el último)
    app.use(globalErrorHandler);
    
    // Iniciar servidor
    app.listen(port, () => {
      console.log('🚀 ================================');
      console.log(`🚀 MS1 - Customer Service`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 Server running on: http://localhost:${port}`);
      console.log(`🚀 API Base URL: http://localhost:${port}/api/customers`);
      console.log(`🚀 Health Check: http://localhost:${port}/api/customers/health`);
      console.log('🚀 ================================');
      
      console.log('\n📋 Available Endpoints:');
      console.log('  📍 GET    / - Service information');
      console.log('  📍 GET    /api/customers/health - Health check');
      console.log('  📍 GET    /api/customers - Search customers');
      console.log('  📍 POST   /api/customers - Create customer');
      console.log('  📍 GET    /api/customers/:id - Get customer');
      console.log('  📍 PUT    /api/customers/:id - Update customer');
      console.log('  📍 DELETE /api/customers/:id - Delete customer');
      console.log('  📍 GET    /api/customers/:id/accounts - Get customer accounts');
      console.log('  📍 POST   /api/customers/:id/documents - Add KYC document');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Manejo de señales del sistema para shutdown graceful
process.on('SIGTERM', async () => {
  console.log('📝 SIGTERM received. Shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n📝 SIGINT received. Shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error);
  process.exit(1);
});

// Iniciar el servidor
startServer();

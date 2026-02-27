import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import serviceRoutes from './routes/service.routes';
import productRoutes from './routes/product.routes';
import supplierRoutes from './routes/supplier.routes';
import bookingRoutes from './routes/booking.routes';
import quickServiceRoutes from './routes/quickService.routes';
import expenseRoutes from './routes/expense.routes';
import purchaseRoutes from './routes/purchase.routes';
import ledgerRoutes from './routes/ledger.routes';
import reportRoutes from './routes/report.routes';
import landingRoutes from './routes/landing.routes';
import uploadRoutes from './routes/upload.routes';
import proxyRoutes from './routes/proxy.routes';
import bookingPublicRoutes from './routes/bookingPublic.routes';
import { errorHandler } from './utils/errorHandler';
import { initFirebase } from './services/firebase.service';

// Load .env from backend directory (works regardless of cwd when running tsx/node)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
initFirebase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Omari Studio Management API',
      version: '1.0.0',
      description: 'API documentation for Photography Studio Management System',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Require MongoDB for /api routes (return 503 when DB is down)
// readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
app.use('/api', (req, res, next) => {
  const state = mongoose.connection.readyState;
  if (state !== 1 && state !== 2) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Ensure backend is running (cd backend && npm run dev) and MongoDB is connected (Atlas: add your IP to Network Access).',
    });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/bookings/request', bookingPublicRoutes); // Must be before /api/bookings (public, no auth)
app.use('/api/bookings', bookingRoutes);
app.use('/api/quick-services', quickServiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/proxy', proxyRoutes);

// Health check (does not require DB)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start HTTP server immediately so the API is reachable even while DB connects
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   To fix this, either:`);
    console.error(`   1. Kill the process using port ${PORT}: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`   2. Change the PORT in your .env file to a different port\n`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

// Connect to MongoDB in the background (server already listening)
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omari_studio')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.error('Server is still running. Add your IP to Atlas whitelist or set MONGODB_URI to a local instance (e.g. mongodb://localhost:27017/omari_studio).');
  });

export default app;

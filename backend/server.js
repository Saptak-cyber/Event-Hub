import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import configureCloudinary from './config/cloudinary.js';
import errorHandler from './middleware/errorHandler.js';
import initializeCronJobs from './utils/cronJobs.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';

// Load env vars
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Configure Cloudinary
configureCloudinary();

// Initialize cron jobs
initializeCronJobs();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Event Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      registrations: '/api/registrations',
      health: '/api/health'
    }
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎉 Event Management System API                             ║
║                                                               ║
║   Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}           ║
║                                                               ║
║   📍 Local:   http://localhost:${PORT}                         ║
║   🔗 Health:  http://localhost:${PORT}/api/health             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;


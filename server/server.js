const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const { getDBSource } = require('./config/db');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'Learnitics Mastery LMS API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    source: typeof getDBSource === 'function' ? getDBSource() : 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courseRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const quizRoutes = require('./routes/quizRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const syncRoutes = require('./routes/syncRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notifications', notificationRoutes);

// Favicon no-content handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root welcome endpoint
app.get('/', (req, res) => {
  res.send('Learnitics API server is running. Access /api/health for system status.');
});

const PORT = process.env.PORT || 5000;

// Connect to DB and start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Learnitics Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
    if (process.env.MONGO_URI) {
      connectDB();
    }
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
  }
};

startServer();

module.exports = app;

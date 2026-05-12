require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const eventsRouter = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/casualsale';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: '*', // Allow all origins for demo; restrict in production
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', eventsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[GlobalError]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Database & Server ─────────────────────────────────────────────────────────
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectWithRetry = async (retriesLeft = MAX_RETRIES) => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    if (retriesLeft > 0) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s… (${retriesLeft} attempts left)`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return connectWithRetry(retriesLeft - 1);
    }
    console.error('💥 Could not connect to MongoDB. Exiting.');
    process.exit(1);
  }
};

const startServer = async () => {
  await connectWithRetry();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📊 API endpoints: /api/events  /api/sessions  /api/heatmap  /api/stats  /api/pages');
  });
};

startServer();


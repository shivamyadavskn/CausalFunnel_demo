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
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB connected: ${MONGO_URI}`);

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 API docs:`);
      console.log(`   POST  http://localhost:${PORT}/api/events`);
      console.log(`   GET   http://localhost:${PORT}/api/sessions`);
      console.log(`   GET   http://localhost:${PORT}/api/sessions/:id`);
      console.log(`   GET   http://localhost:${PORT}/api/heatmap?page=<url>`);
      console.log(`   GET   http://localhost:${PORT}/api/stats`);
      console.log(`   GET   http://localhost:${PORT}/api/pages`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
};

startServer();

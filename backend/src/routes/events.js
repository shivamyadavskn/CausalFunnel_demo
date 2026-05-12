const express = require('express');
const router = express.Router();
const {
  ingestEvents,
  getSessions,
  getSessionEvents,
  getHeatmapData,
  getStats,
  getPages,
} = require('../controllers/events.controller');

// Ingest events (single or batch)
router.post('/events', ingestEvents);

// Session list with counts
router.get('/sessions', getSessions);

// Events for a specific session
router.get('/sessions/:sessionId', getSessionEvents);

// Heatmap click data for a page URL
router.get('/heatmap', getHeatmapData);

// Aggregate stats overview
router.get('/stats', getStats);

// List all tracked pages
router.get('/pages', getPages);

module.exports = router;

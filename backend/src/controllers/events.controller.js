const Event = require('../models/Event');

/**
 * POST /api/events
 * Accepts a single event object or an array of events
 */
const ingestEvents = async (req, res) => {
  try {
    const payload = req.body;
    const events = Array.isArray(payload) ? payload : [payload];

    if (!events.length) {
      return res.status(400).json({ error: 'No events provided' });
    }

    // Validate required fields
    for (const evt of events) {
      if (!evt.sessionId || !evt.type || !evt.pageUrl) {
        return res.status(400).json({
          error: 'Each event must have sessionId, type, and pageUrl',
        });
      }
      if (!['page_view', 'click'].includes(evt.type)) {
        return res.status(400).json({
          error: `Invalid event type: ${evt.type}. Must be page_view or click`,
        });
      }
    }

    const inserted = await Event.insertMany(
      events.map((evt) => ({
        sessionId: evt.sessionId,
        type: evt.type,
        pageUrl: evt.pageUrl,
        timestamp: evt.timestamp ? new Date(evt.timestamp) : new Date(),
        x: evt.x ?? null,
        y: evt.y ?? null,
        viewportWidth: evt.viewportWidth ?? null,
        viewportHeight: evt.viewportHeight ?? null,
        userAgent: evt.userAgent || '',
        referrer: evt.referrer || '',
        targetTag: evt.targetTag || '',
        targetText: evt.targetText || '',
      }))
    );

    res.status(201).json({
      success: true,
      count: inserted.length,
      ids: inserted.map((e) => e._id),
    });
  } catch (err) {
    console.error('[ingestEvents]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/sessions
 * Returns list of unique sessions with event counts and metadata
 */
const getSessions = async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] },
          },
          firstSeen: { $min: '$timestamp' },
          lastSeen: { $max: '$timestamp' },
          pages: { $addToSet: '$pageUrl' },
        },
      },
      {
        $project: {
          sessionId: '$_id',
          _id: 0,
          totalEvents: 1,
          pageViews: 1,
          clicks: 1,
          firstSeen: 1,
          lastSeen: 1,
          uniquePages: { $size: '$pages' },
          pages: 1,
        },
      },
      { $sort: { lastSeen: -1 } },
    ]);

    res.json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    console.error('[getSessions]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/sessions/:sessionId
 * Returns all events for a session ordered by timestamp
 */
const getSessionEvents = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const events = await Event.find({ sessionId })
      .sort({ timestamp: 1 })
      .select('-__v')
      .lean();

    if (!events.length) {
      return res.status(404).json({ error: 'Session not found or has no events' });
    }

    res.json({ success: true, sessionId, count: events.length, events });
  } catch (err) {
    console.error('[getSessionEvents]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/heatmap?page=<url>
 * Returns click coordinates for a given page URL
 */
const getHeatmapData = async (req, res) => {
  try {
    const { page } = req.query;

    if (!page) {
      return res.status(400).json({ error: 'Query param "page" is required' });
    }

    const clicks = await Event.find({ pageUrl: page, type: 'click' })
      .select('x y viewportWidth viewportHeight timestamp sessionId targetTag targetText -_id')
      .lean();

    res.json({
      success: true,
      page,
      count: clicks.length,
      clicks,
    });
  } catch (err) {
    console.error('[getHeatmapData]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/stats
 * Aggregate overview stats
 */
const getStats = async (req, res) => {
  try {
    const [totals] = await Event.aggregate([
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          totalPageViews: {
            $sum: { $cond: [{ $eq: ['$type', 'page_view'] }, 1, 0] },
          },
          totalClicks: {
            $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] },
          },
          uniqueSessions: { $addToSet: '$sessionId' },
          uniquePages: { $addToSet: '$pageUrl' },
        },
      },
      {
        $project: {
          _id: 0,
          totalEvents: 1,
          totalPageViews: 1,
          totalClicks: 1,
          totalSessions: { $size: '$uniqueSessions' },
          totalPages: { $size: '$uniquePages' },
        },
      },
    ]);

    res.json({
      success: true,
      stats: totals || {
        totalEvents: 0,
        totalPageViews: 0,
        totalClicks: 0,
        totalSessions: 0,
        totalPages: 0,
      },
    });
  } catch (err) {
    console.error('[getStats]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/pages
 * Returns list of all tracked page URLs
 */
const getPages = async (req, res) => {
  try {
    const pages = await Event.distinct('pageUrl');
    res.json({ success: true, pages });
  } catch (err) {
    console.error('[getPages]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  ingestEvents,
  getSessions,
  getSessionEvents,
  getHeatmapData,
  getStats,
  getPages,
};

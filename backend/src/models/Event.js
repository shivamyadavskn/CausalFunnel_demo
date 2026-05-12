const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['page_view', 'click'],
      required: true,
    },
    pageUrl: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Click coordinates (only for click events)
    x: {
      type: Number,
      default: null,
    },
    y: {
      type: Number,
      default: null,
    },
    // Viewport dimensions at time of click
    viewportWidth: {
      type: Number,
      default: null,
    },
    viewportHeight: {
      type: Number,
      default: null,
    },
    // Additional metadata
    userAgent: {
      type: String,
      default: '',
    },
    referrer: {
      type: String,
      default: '',
    },
    // Target element info for click events
    targetTag: {
      type: String,
      default: '',
    },
    targetText: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: false, // Using custom timestamp field
  }
);

// Compound index for heatmap queries
eventSchema.index({ pageUrl: 1, type: 1 });
// Compound index for session timeline queries
eventSchema.index({ sessionId: 1, timestamp: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;

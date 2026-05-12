/**
 * seed.js — Populate MongoDB with realistic sample analytics events
 * Run with: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./src/models/Event');

const MONGO_URI = process.env.MONGO_URI;

// ── Helpers ────────────────────────────────────────────────────────────────

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomId() {
  return Math.random().toString(36).slice(2, 18);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function addSeconds(date, secs) {
  return new Date(date.getTime() + secs * 1000);
}

// ── Config ─────────────────────────────────────────────────────────────────

const PAGES = [
  'http://localhost:5173/demo/index.html',
  'http://localhost:5173/demo/index.html#products',
  'http://localhost:5173/demo/index.html#cart',
  'http://localhost:5173/demo/index.html#checkout',
  'http://localhost:5173/demo/index.html#summer-collection',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

const REFERRERS = [
  '',
  'https://www.google.com/',
  'https://instagram.com/',
  'https://twitter.com/',
  'https://www.facebook.com/',
  'https://pinterest.com/',
];

const VIEWPORTS = [
  { w: 1920, h: 1080 },
  { w: 1440, h: 900 },
  { w: 1280, h: 800 },
  { w: 390, h: 844 },   // iPhone 14
  { w: 412, h: 915 },   // Pixel 8
];

const CLICK_TARGETS = [
  { tag: 'BUTTON', text: 'Add to Cart' },
  { tag: 'BUTTON', text: 'Buy Now' },
  { tag: 'A', text: 'View Product' },
  { tag: 'A', text: 'Shop Now' },
  { tag: 'IMG', text: '' },
  { tag: 'BUTTON', text: 'Checkout' },
  { tag: 'A', text: 'Home' },
  { tag: 'BUTTON', text: 'Filter' },
  { tag: 'INPUT', text: '' },
  { tag: 'BUTTON', text: 'Apply Coupon' },
];

// ── Session generator ──────────────────────────────────────────────────────

function generateSession(startDate) {
  const sessionId = randomId();
  const userAgent = randomFrom(USER_AGENTS);
  const referrer = randomFrom(REFERRERS);
  const vp = randomFrom(VIEWPORTS);
  const events = [];

  // Each session visits 1–5 pages
  const pageCount = randomBetween(1, 5);
  const visitedPages = [];

  // Always start at home or products
  let currentPage = randomFrom(PAGES.slice(0, 2));
  let cursor = new Date(startDate);

  for (let p = 0; p < pageCount; p++) {
    // page_view event
    events.push({
      sessionId,
      type: 'page_view',
      pageUrl: currentPage,
      timestamp: new Date(cursor),
      x: null,
      y: null,
      viewportWidth: vp.w,
      viewportHeight: vp.h,
      userAgent,
      referrer: p === 0 ? referrer : currentPage,
      targetTag: '',
      targetText: '',
    });

    visitedPages.push(currentPage);
    cursor = addSeconds(cursor, randomBetween(3, 15));

    // 1–6 clicks on this page
    const clickCount = randomBetween(1, 6);
    for (let c = 0; c < clickCount; c++) {
      const target = randomFrom(CLICK_TARGETS);
      events.push({
        sessionId,
        type: 'click',
        pageUrl: currentPage,
        timestamp: new Date(cursor),
        x: randomBetween(10, vp.w - 10),
        y: randomBetween(60, vp.h - 10),
        viewportWidth: vp.w,
        viewportHeight: vp.h,
        userAgent,
        referrer: '',
        targetTag: target.tag,
        targetText: target.text,
      });
      cursor = addSeconds(cursor, randomBetween(2, 20));
    }

    // Navigate to next page
    const nextOptions = PAGES.filter((pg) => pg !== currentPage);
    currentPage = randomFrom(nextOptions);
  }

  return events;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.');

  // Clear existing data
  const deleted = await Event.deleteMany({});
  console.log(`🗑️  Cleared ${deleted.deletedCount} existing events.`);

  const allEvents = [];

  // Generate ~40 sessions spread across the last 14 days
  for (let day = 13; day >= 0; day--) {
    const sessionsToday = randomBetween(2, 5);
    for (let s = 0; s < sessionsToday; s++) {
      const startHour = randomBetween(7, 23);
      const startMin = randomBetween(0, 59);
      const baseDate = daysAgo(day);
      baseDate.setHours(startHour, startMin, 0, 0);
      const sessionEvents = generateSession(baseDate);
      allEvents.push(...sessionEvents);
    }
  }

  await Event.insertMany(allEvents);
  console.log(`🌱 Seeded ${allEvents.length} events across the database.`);

  // Quick summary
  const sessions = await Event.distinct('sessionId');
  const pages = await Event.distinct('pageUrl');
  const clicks = await Event.countDocuments({ type: 'click' });
  const views = await Event.countDocuments({ type: 'page_view' });

  console.log('\n📊 Summary:');
  console.log(`   Sessions : ${sessions.length}`);
  console.log(`   Pages    : ${pages.length}`);
  console.log(`   Views    : ${views}`);
  console.log(`   Clicks   : ${clicks}`);
  console.log('\n✨ Done! Refresh your dashboard.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

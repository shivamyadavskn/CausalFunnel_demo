dashboard url: peaceful-starlight-64510b.netlify.app
mainwebsite: eclectic-selkie-7c0c23.netlify.app
api deployed: https://causalfunnel-demo.onrender.com

# CausalFunnel — User Analytics Application

A full-stack user analytics platform that tracks user interactions (page views, clicks) on a webpage and displays them in a rich analytics dashboard with session management and a visual heatmap.

---

## 📸 Features

- **Event Tracking**: Vanilla JS script that captures `page_view` and `click` events with coordinates, session ID, URL, and metadata
- **Sessions View**: Table of all user sessions with event counts, drill-down journey timeline
- **Heatmap View**: Canvas-based click density heatmap with color-coded intensity
- **Auto-Refresh**: Dashboard polls for new data every 15 seconds
- **Demo Store**: Realistic e-commerce page (ShopWave) to generate tracking data

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite, React Router v6, Canvas API |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose ODM |
| **Tracker** | Vanilla JavaScript (zero dependencies) |
| **Styling** | Vanilla CSS (dark theme, glassmorphism) |

---

## 📁 Project Structure

```
casualsale/
├── backend/
│   ├── src/
│   │   ├── models/Event.js          # Mongoose schema
│   │   ├── controllers/
│   │   │   └── events.controller.js # Business logic
│   │   ├── routes/events.js         # Express routes
│   │   └── app.js                   # Express app + MongoDB
│   ├── .env                         # MONGO_URI, PORT
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── EventTimeline.jsx
│   │   ├── pages/
│   │   │   ├── SessionsPage.jsx     # Session table + journey
│   │   │   └── HeatmapPage.jsx      # Heatmap visualization
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── demo/
│   ├── tracker.js                   # Client tracking script
│   └── index.html                   # Demo e-commerce page
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally on port 27017  
  *(Install from https://www.mongodb.com/try/download/community)*

### 1. Clone / Navigate to Project

```bash
cd casualsale
```

### 2. Start the Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at: **http://localhost:4000**

You can verify with:
```bash
curl http://localhost:4000/health
```

### 3. Start the Frontend Dashboard

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Dashboard runs at: **http://localhost:5173**

### 4. Open the Demo Page

Open `demo/index.html` directly in your browser (file:// protocol works fine since CORS is open).

Click around, navigate, add items to cart — events will be tracked and visible in the dashboard within seconds.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/events` | Ingest event(s). Accepts single object or array |
| `GET` | `/api/sessions` | List all sessions with event counts |
| `GET` | `/api/sessions/:sessionId` | All events for a session, ordered by time |
| `GET` | `/api/heatmap?page=URL` | Click coordinates for a specific page URL |
| `GET` | `/api/stats` | Aggregate overview stats |
| `GET` | `/api/pages` | List all tracked page URLs |
| `GET` | `/health` | Server + DB health check |

### Example: POST /api/events

```json
{
  "sessionId": "abc-123",
  "type": "click",
  "pageUrl": "http://localhost/demo",
  "timestamp": "2025-01-01T10:00:00Z",
  "x": 450,
  "y": 320,
  "viewportWidth": 1280,
  "viewportHeight": 800,
  "targetTag": "button",
  "targetText": "Add to Cart"
}
```

---

## 🔬 How Tracking Works

The `tracker.js` script:
1. **Generates a UUID** session ID and persists it in `localStorage` (`cf_session_id`)
2. **Fires a `page_view`** event on `DOMContentLoaded`
3. **Listens for all clicks** and records `clientX/Y` coordinates + target element info
4. **Sends events** via `navigator.sendBeacon()` (reliable even on page close), falling back to `fetch()`
5. Is **fully self-contained** — add it to any page with a single `<script src="tracker.js"></script>`

---

## 🗄 Database Schema

```js
{
  sessionId:     String,   // UUID (indexed)
  type:          String,   // "page_view" | "click"
  pageUrl:       String,   // Full URL (indexed)
  timestamp:     Date,     // Event time
  x:             Number,   // Click X coordinate
  y:             Number,   // Click Y coordinate
  viewportWidth: Number,   // Browser viewport width
  viewportHeight:Number,   // Browser viewport height
  userAgent:     String,   // Browser user agent
  referrer:      String,   // Referrer URL
  targetTag:     String,   // Clicked HTML element tag
  targetText:    String,   // Text content of clicked element
}
```

---

## ⚖️ Assumptions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| Session ID in `localStorage` | Simpler than cookies; persists across tabs in same browser |
| Heatmap uses relative coords normalized to viewport | Allows rendering across different screen sizes |
| No auth on dashboard | Internal analytics tool; auth is out of scope for this demo |
| Events stored individually (not batched in DB) | Simpler queries; negligible for demo scale |
| CORS open to all origins | Required for `file://` demo page to talk to backend |
| Auto-refresh every 15s | Keeps dashboard live without WebSocket complexity |

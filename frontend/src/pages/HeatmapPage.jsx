import { useState, useEffect, useRef, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';


// Normalize click coordinates to a fixed canvas size
const CANVAS_W = 1280;
const CANVAS_H = 520;

function normalizeCoords(click) {
  // If we have viewport info, normalize relative to it
  const srcW = click.viewportWidth || CANVAS_W;
  const srcH = click.viewportHeight || CANVAS_H;
  return {
    x: (click.x / srcW) * CANVAS_W,
    y: (click.y / srcH) * CANVAS_H,
  };
}

// Build a density grid and return intensity per click point
function computeIntensity(clicks, radius = 60) {
  const density = clicks.map(() => 0);
  for (let i = 0; i < clicks.length; i++) {
    const { x: xi, y: yi } = normalizeCoords(clicks[i]);
    for (let j = 0; j < clicks.length; j++) {
      const { x: xj, y: yj } = normalizeCoords(clicks[j]);
      const dist = Math.sqrt((xi - xj) ** 2 + (yi - yj) ** 2);
      if (dist < radius) {
        density[i] += 1 - dist / radius;
      }
    }
  }
  const maxDensity = Math.max(...density, 1);
  return density.map((d) => d / maxDensity);
}

function HeatmapCanvas({ clicks }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (!clicks || clicks.length === 0) return;

    // Normalize all coords
    const normalized = clicks.map(normalizeCoords);
    const intensities = computeIntensity(clicks);

    // Draw heat blobs (back to front, low intensity first)
    const sorted = normalized
      .map((pt, i) => ({ ...pt, intensity: intensities[i] }))
      .sort((a, b) => a.intensity - b.intensity);

    sorted.forEach(({ x, y, intensity }) => {
      const radius = 28 + intensity * 36;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

      if (intensity > 0.7) {
        // Hot: red-orange
        gradient.addColorStop(0, `rgba(239, 68, 68, ${0.6 + intensity * 0.4})`);
        gradient.addColorStop(0.4, `rgba(245, 158, 11, ${0.3 + intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else if (intensity > 0.35) {
        // Warm: amber-purple
        gradient.addColorStop(0, `rgba(245, 158, 11, ${0.5 + intensity * 0.4})`);
        gradient.addColorStop(0.4, `rgba(99, 102, 241, ${0.2 + intensity * 0.2})`);
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
      } else {
        // Cool: purple
        gradient.addColorStop(0, `rgba(99, 102, 241, ${0.4 + intensity * 0.3})`);
        gradient.addColorStop(0.5, `rgba(99, 102, 241, ${0.1 + intensity * 0.1})`);
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // Draw precise dot markers on top
    sorted.forEach(({ x, y, intensity }) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      const alpha = 0.5 + intensity * 0.5;
      if (intensity > 0.6) {
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      } else if (intensity > 0.3) {
        ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
      }
      ctx.fill();

      // White center dot
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + intensity * 0.5})`;
      ctx.fill();
    });
  }, [clicks]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

export default function HeatmapPage() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [error, setError] = useState('');

  // Load available pages
  useEffect(() => {
    const fetchPages = async () => {
      setPagesLoading(true);
      try {
        const res = await fetch(`${API}/pages`);
        const data = await res.json();
        setPages(data.pages || []);
        if (data.pages && data.pages.length > 0) {
          setSelectedPage(data.pages[0]);
        }
      } catch {
        setError('Cannot connect to backend. Make sure the server is running on port 4000.');
      } finally {
        setPagesLoading(false);
      }
    };
    fetchPages();
  }, []);

  // Load click data when page changes
  const fetchClicks = useCallback(async (page) => {
    if (!page) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/heatmap?page=${encodeURIComponent(page)}`);
      const data = await res.json();
      setClicks(data.clicks || []);
    } catch {
      setError('Failed to load heatmap data.');
      setClicks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPage) fetchClicks(selectedPage);
  }, [selectedPage, fetchClicks]);

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Click Heatmap</h1>
          <p className="page-subtitle">
            Visualize where users click most on each page
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-ghost"
            onClick={() => fetchClicks(selectedPage)}
            disabled={!selectedPage}
            title="Refresh"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Page selector */}
      <div className="heatmap-controls" style={{ padding: '24px 32px' }}>
        <div className="select-wrapper">
          {pagesLoading ? (
            <select className="page-select" disabled>
              <option>Loading pages…</option>
            </select>
          ) : pages.length === 0 ? (
            <select className="page-select" disabled>
              <option>No tracked pages yet</option>
            </select>
          ) : (
            <select
              id="page-select"
              className="page-select"
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
            >
              {pages.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>

        {clicks.length > 0 && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(99,102,241,0.7)', display: 'inline-block' }} />
              Low
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(245,158,11,0.8)', display: 'inline-block', marginLeft: 8 }} />
              Medium
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', display: 'inline-block', marginLeft: 8 }} />
              Hot
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Canvas */}
      <div className="heatmap-canvas-wrapper">
        <div className="heatmap-canvas-header">
          <span className="heatmap-canvas-title">
            Click Distribution
          </span>
          <span className="heatmap-canvas-meta">
            {loading
              ? 'Loading…'
              : `${clicks.length} click${clicks.length !== 1 ? 's' : ''} recorded`}
          </span>
        </div>

        <div className="heatmap-svg-container">
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <span className="loading-text">Rendering heatmap…</span>
            </div>
          ) : pages.length === 0 ? (
            <div className="heatmap-empty">
              <div className="heatmap-empty-icon">🗺</div>
              <div className="heatmap-empty-text">
                No pages tracked yet.<br />
                Visit the demo page and click around to generate data.
              </div>
            </div>
          ) : clicks.length === 0 ? (
            <div className="heatmap-empty">
              <div className="heatmap-empty-icon">🖱</div>
              <div className="heatmap-empty-text">
                No clicks recorded for this page yet.<br />
                Interact with the demo page to see click data here.
              </div>
            </div>
          ) : (
            <HeatmapCanvas clicks={clicks} />
          )}
        </div>
      </div>

      {/* Click data table */}
      {clicks.length > 0 && (
        <div className="section-container">
          <div className="section-header">
            <span className="section-title">Raw Click Data</span>
            <span className="badge badge-purple">{clicks.length} clicks</span>
          </div>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Session</th>
                  <th>X</th>
                  <th>Y</th>
                  <th>Element</th>
                  <th>Label</th>
                  <th>Viewport</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {clicks.map((click, idx) => (
                  <tr key={idx}>
                    <td className="tooltip-text">{idx + 1}</td>
                    <td className="session-id-cell">
                      {click.sessionId
                        ? click.sessionId.slice(0, 8) + '…'
                        : '—'}
                    </td>
                    <td className="tooltip-text">{Math.round(click.x)}</td>
                    <td className="tooltip-text">{Math.round(click.y)}</td>
                    <td>
                      {click.targetTag ? (
                        <span className="badge badge-cyan">&lt;{click.targetTag}&gt;</span>
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {click.targetText || '—'}
                    </td>
                    <td className="tooltip-text">
                      {click.viewportWidth && click.viewportHeight
                        ? `${click.viewportWidth}×${click.viewportHeight}`
                        : '—'}
                    </td>
                    <td className="tooltip-text">
                      {click.timestamp
                        ? new Date(click.timestamp).toLocaleTimeString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

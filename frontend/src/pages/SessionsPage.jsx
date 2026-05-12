import { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/StatCard';
import EventTimeline from '../components/EventTimeline';

const API = import.meta.env.VITE_API_URL || '/api';


function formatRelativeTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDuration(firstSeen, lastSeen) {
  if (!firstSeen || !lastSeen) return '—';
  const diff = new Date(lastSeen) - new Date(firstSeen);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  if (seconds < 60) return `${seconds}s`;
  return `${minutes}m ${seconds % 60}s`;
}

function shortenSessionId(id) {
  if (!id) return '—';
  return id.length > 20 ? id.slice(0, 8) + '…' + id.slice(-4) : id;
}

export default function SessionsPage() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [sortKey, setSortKey] = useState('lastSeen');
  const [sortDir, setSortDir] = useState('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        fetch(`${API}/stats`),
        fetch(`${API}/sessions`),
      ]);

      if (!statsRes.ok || !sessionsRes.ok) throw new Error('API error');

      const statsData = await statsRes.json();
      const sessionsData = await sessionsRes.json();

      setStats(statsData.stats);
      setSessions(sessionsData.sessions || []);
    } catch (e) {
      setError(
        'Cannot connect to backend. Make sure the server is running on port 4000.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSessionClick = async (session) => {
    if (selectedSession?.sessionId === session.sessionId) {
      setSelectedSession(null);
      setSessionEvents([]);
      return;
    }

    setSelectedSession(session);
    setEventsLoading(true);
    try {
      const res = await fetch(`${API}/sessions/${session.sessionId}`);
      const data = await res.json();
      setSessionEvents(data.events || []);
    } catch {
      setSessionEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (sortKey === 'lastSeen' || sortKey === 'firstSeen') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Sessions</h1>
          <p className="page-subtitle">
            Track and analyze individual user sessions in real-time
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={fetchData} title="Refresh">
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

      {/* Stats */}
      {loading && !stats ? (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">Loading analytics…</span>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total Sessions"
              value={stats?.totalSessions}
              icon="👤"
              iconBg="rgba(99,102,241,0.15)"
              meta="Unique visitors"
            />
            <StatCard
              label="Total Events"
              value={stats?.totalEvents}
              icon="⚡"
              iconBg="rgba(245,158,11,0.15)"
              meta="All interactions"
            />
            <StatCard
              label="Page Views"
              value={stats?.totalPageViews}
              icon="👁"
              iconBg="rgba(6,182,212,0.15)"
              meta="View events tracked"
            />
            <StatCard
              label="Total Clicks"
              value={stats?.totalClicks}
              icon="🖱"
              iconBg="rgba(16,185,129,0.15)"
              meta="Click events tracked"
            />
            <StatCard
              label="Tracked Pages"
              value={stats?.totalPages}
              icon="📄"
              iconBg="rgba(139,92,246,0.15)"
              meta="Unique URLs"
            />
          </div>

          {/* Sessions Table */}
          <div className="section-container">
            <div className="section-header">
              <span className="section-title">All Sessions</span>
              <span className="badge badge-purple">
                {sessions.length} sessions
              </span>
            </div>

            <div className="table-card">
              {sessions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No sessions yet</div>
                  <div className="empty-desc">
                    Open the demo page and interact with it to generate tracking events.
                  </div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('totalEvents')}
                      >
                        Events <SortIcon col="totalEvents" />
                      </th>
                      <th>Page Views</th>
                      <th>Clicks</th>
                      <th>Pages</th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('firstSeen')}
                      >
                        First Seen <SortIcon col="firstSeen" />
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('lastSeen')}
                      >
                        Last Active <SortIcon col="lastSeen" />
                      </th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSessions.map((session) => (
                      <tr
                        key={session.sessionId}
                        onClick={() => handleSessionClick(session)}
                        className={
                          selectedSession?.sessionId === session.sessionId
                            ? 'selected-row'
                            : ''
                        }
                      >
                        <td className="session-id-cell" title={session.sessionId}>
                          {shortenSessionId(session.sessionId)}
                        </td>
                        <td className="event-count-cell">{session.totalEvents}</td>
                        <td>
                          <span className="badge badge-cyan">{session.pageViews}</span>
                        </td>
                        <td>
                          <span className="badge badge-purple">{session.clicks}</span>
                        </td>
                        <td>{session.uniquePages}</td>
                        <td>{formatRelativeTime(session.firstSeen)}</td>
                        <td>{formatRelativeTime(session.lastSeen)}</td>
                        <td className="tooltip-text">
                          {formatDuration(session.firstSeen, session.lastSeen)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Event Timeline */}
            {selectedSession && (
              <>
                {eventsLoading ? (
                  <div className="loading-container" style={{ padding: '32px' }}>
                    <div className="spinner" />
                    <span className="loading-text">Loading journey…</span>
                  </div>
                ) : (
                  <EventTimeline
                    sessionId={selectedSession.sessionId}
                    events={sessionEvents}
                    onClose={() => {
                      setSelectedSession(null);
                      setSessionEvents([]);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

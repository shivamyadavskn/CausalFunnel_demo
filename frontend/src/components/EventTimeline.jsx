function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname + u.search || u.hostname;
  } catch {
    return url;
  }
}

export default function EventTimeline({ sessionId, events, onClose }) {
  if (!events || !events.length) return null;

  return (
    <div className="timeline-panel animate-fadeInUp">
      <div className="timeline-panel-header">
        <div className="timeline-panel-title">
          <span>🧭 User Journey</span>
          <span className="timeline-session-id">
            {sessionId ? sessionId.slice(0, 16) + '…' : ''}
          </span>
        </div>
        <button className="close-btn" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      <div className="timeline-scroll">
        {events.map((evt, idx) => (
          <div key={evt._id || idx} className="timeline-item">
            <div
              className={`timeline-icon ${
                evt.type === 'page_view' ? 'page-view' : 'click'
              }`}
            >
              {evt.type === 'page_view' ? '👁' : '🖱'}
            </div>
            <div className="timeline-content">
              <div
                className={`timeline-event-type ${
                  evt.type === 'page_view' ? 'page-view' : 'click'
                }`}
              >
                {evt.type === 'page_view' ? 'Page View' : 'Click'}
              </div>
              <div className="timeline-url" title={evt.pageUrl}>
                {shortenUrl(evt.pageUrl)}
              </div>
              <div className="timeline-meta">
                <span className="timeline-time">
                  {formatDate(evt.timestamp)} · {formatTime(evt.timestamp)}
                </span>
                {evt.type === 'click' && evt.x != null && (
                  <span className="timeline-coords">
                    x:{Math.round(evt.x)} y:{Math.round(evt.y)}
                  </span>
                )}
                {evt.targetText && (
                  <span className="timeline-coords" title="Clicked element">
                    "{evt.targetText.slice(0, 30)}"
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

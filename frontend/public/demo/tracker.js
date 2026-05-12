(function () {
  'use strict';

  // ── Configuration ────────────────────────────────────────────────────────────
  const ENDPOINT =
    window.CF_ENDPOINT || 'https://causalfunnel-demo.onrender.com/api/events';
  const SESSION_KEY = 'cf_session_id';

  // ── Session ID ───────────────────────────────────────────────────────────────
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getSessionId() {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = generateUUID();
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  const SESSION_ID = getSessionId();

  // ── Event Builder ────────────────────────────────────────────────────────────
  function buildBaseEvent(type) {
    return {
      sessionId: SESSION_ID,
      type: type,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || '',
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }

  // ── Send Event ───────────────────────────────────────────────────────────────
  function sendEvent(eventData, useBeacon) {
    const payload = JSON.stringify(eventData);

    // Use fetch as primary transport — fully CORS-compatible
    if (!useBeacon) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(function (err) {
        console.warn('[CausalFunnel] Failed to send event:', err);
      });
      return;
    }

    // On page unload, sendBeacon is more reliable but MUST use text/plain
    // to avoid CORS preflight (which sendBeacon cannot negotiate)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'text/plain' });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(function () {});
    }
  }

  // ── Track: Page View ──────────────────────────────────────────────────────────
  function trackPageView() {
    const event = buildBaseEvent('page_view');
    sendEvent(event);
    console.log('[CausalFunnel] page_view tracked', event.pageUrl);
  }

  // ── Track: Click ─────────────────────────────────────────────────────────────
  function trackClick(e) {
    const target = e.target;
    const event = Object.assign(buildBaseEvent('click'), {
      x: e.clientX,
      y: e.clientY,
      targetTag: target.tagName ? target.tagName.toLowerCase() : '',
      targetText: target.innerText
        ? target.innerText.trim().substring(0, 100)
        : '',
    });
    sendEvent(event);
    console.log('[CausalFunnel] click tracked', event.x, event.y);
  }

  // ── Initialize ───────────────────────────────────────────────────────────────
  function init() {
    // Track page view immediately on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
      trackPageView();
    }

    // Track all clicks on the document
    document.addEventListener('click', trackClick, { passive: true });

    console.log(
      '[CausalFunnel] Tracker initialized. Session ID:',
      SESSION_ID
    );
  }

  init();
})();

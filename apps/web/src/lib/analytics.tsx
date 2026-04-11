'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const BATCH_INTERVAL = 10000; // 10 seconds
const SESSION_KEY = '__kg_sid';

// Generate or retrieve session ID (persists per tab)
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

interface AnalyticsEvent {
  sessionId: string;
  eventType: string;
  page: string;
  referrer?: string;
  duration?: number;
  screenWidth?: number;
  screenHeight?: number;
  errorMessage?: string;
  errorStack?: string;
  metadata?: Record<string, unknown>;
}

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushEvents() {
  if (eventQueue.length === 0) return;
  const events = [...eventQueue];
  eventQueue = [];

  // Use sendBeacon for reliability (survives page close)
  const body = JSON.stringify({ events });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(`${API_URL}/api/v1/analytics/track/batch`, new Blob([body], { type: 'application/json' }));
  } else {
    fetch(`${API_URL}/api/v1/analytics/track/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

function queueEvent(event: AnalyticsEvent) {
  eventQueue.push(event);
  if (eventQueue.length >= 10) {
    flushEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushEvents();
    }, BATCH_INTERVAL);
  }
}

// ─── useAnalytics Hook ───

export function useAnalytics() {
  const pathname = usePathname();
  const pageEntryTime = useRef<number>(Date.now());
  const lastPage = useRef<string>('');

  // Track page exit duration for previous page
  const trackPageExit = useCallback(() => {
    if (!lastPage.current) return;
    const duration = Math.round((Date.now() - pageEntryTime.current) / 1000);
    if (duration > 0 && duration < 3600) { // sanity: max 1 hour
      queueEvent({
        sessionId: getSessionId(),
        eventType: 'page_exit',
        page: lastPage.current,
        duration,
      });
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!pathname) return;

    // Send page_exit for previous page
    trackPageExit();

    // Track new page view
    const sid = getSessionId();
    pageEntryTime.current = Date.now();
    lastPage.current = pathname;

    queueEvent({
      sessionId: sid,
      eventType: 'page_view',
      page: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      screenWidth: typeof window !== 'undefined' ? window.screen.width : undefined,
      screenHeight: typeof window !== 'undefined' ? window.screen.height : undefined,
    });
  }, [pathname, trackPageExit]);

  // Track errors, scroll depth, and CTA clicks
  useEffect(() => {
    const sid = getSessionId();

    // ─── Error tracking ───
    const handleError = (event: ErrorEvent) => {
      queueEvent({
        sessionId: sid,
        eventType: 'error',
        page: window.location.pathname,
        errorMessage: event.message || 'Unknown error',
        errorStack: event.error?.stack?.slice(0, 5000),
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      queueEvent({
        sessionId: sid,
        eventType: 'error',
        page: window.location.pathname,
        errorMessage: reason?.message || String(reason) || 'Unhandled Promise Rejection',
        errorStack: reason?.stack?.slice(0, 5000),
        metadata: { type: 'unhandledrejection' },
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // ─── Scroll depth tracking ───
    const scrollThresholds = new Set<number>();
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const pct = Math.round((scrollTop / docHeight) * 100);
      for (const threshold of [25, 50, 75, 100]) {
        if (pct >= threshold && !scrollThresholds.has(threshold)) {
          scrollThresholds.add(threshold);
          queueEvent({
            sessionId: sid,
            eventType: 'scroll_depth',
            page: window.location.pathname,
            metadata: { depth: threshold },
          });
        }
      }
    };
    // Throttle scroll handler (every 500ms)
    let scrollRaf: number | null = null;
    const throttledScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        handleScroll();
        scrollRaf = null;
      });
    };
    window.addEventListener('scroll', throttledScroll, { passive: true });

    // ─── CTA click tracking (only elements with data-cta attribute) ───
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const ctaEl = target.closest('[data-cta]') as HTMLElement | null;
      if (!ctaEl) return;

      const ctaLabel = ctaEl.getAttribute('data-cta') || '';
      queueEvent({
        sessionId: sid,
        eventType: 'cta_click',
        page: window.location.pathname,
        errorMessage: ctaLabel, // Store CTA label in errorMessage field
        metadata: {
          text: ctaEl.textContent?.trim()?.slice(0, 100),
          href: (ctaEl as HTMLAnchorElement).href || undefined,
          x: Math.round((event.clientX / window.innerWidth) * 100),
          y: Math.round((event.clientY / window.innerHeight) * 100),
        },
      });
    };
    document.addEventListener('click', handleClick);

    // ─── Page lifecycle ───
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackPageExit();
        flushEvents();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleBeforeUnload = () => {
      trackPageExit();
      flushEvents();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('scroll', throttledScroll);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
    };
  }, [trackPageExit]);
}

// ─── Custom event tracking ───

export function trackEvent(
  eventType: string,
  page: string,
  metadata?: Record<string, unknown>,
) {
  queueEvent({
    sessionId: getSessionId(),
    eventType,
    page,
    metadata,
  });
}

const GA_MEASUREMENT_ID = "G-90060JE72X";

type GtagArgs = unknown[];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void;
    __gaConfigured?: boolean;
  }
}

const queuedPaths: string[] = [];
let flushBound = false;

function isLocalHost(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function sendPageView(path: string): void {
  if (typeof window.gtag !== "function") return;
  const pagePath = path.startsWith("/") ? path : `/${path}`;
  window.gtag("event", "page_view", {
    send_to: GA_MEASUREMENT_ID,
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    page_title: document.title,
  });
}

function flushQueuedPageViews(): void {
  if (!window.__gaConfigured) return;
  const paths = queuedPaths.splice(0, queuedPaths.length);
  for (const path of paths) {
    sendPageView(path);
  }
}

/** Record an in-app route. Calls before gtag config are held until the tag is ready. */
export function trackGooglePageView(path: string): void {
  if (!path || isLocalHost()) return;
  if (!window.__gaConfigured) {
    queuedPaths.push(path);
    if (!flushBound) {
      flushBound = true;
      window.addEventListener("ga-configured", flushQueuedPageViews);
    }
    return;
  }
  sendPageView(path);
}

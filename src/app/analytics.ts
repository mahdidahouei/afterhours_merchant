/**
 * Google Analytics. The tag itself is loaded from index.html so it starts
 * fetching before the bundle parses; this only records route changes, which a
 * single-page app has to report by hand.
 */
export function trackPageView(path: string) {
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

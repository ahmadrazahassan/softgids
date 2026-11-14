"use client";

import * as React from "react";

/**
 * First-party affiliate click logging, as one delegated listener.
 *
 * Mounted once in the public layout. It watches for clicks on anything
 * AffiliateLink rendered (`a[data-affiliate]`) and posts a beacon to
 * /api/track-click so the admin analytics keep a click count of our own,
 * alongside Impact's.
 *
 * Why a beacon and not a redirect route: the anchor itself points straight at
 * the tracking URL, so the navigation never waits on us, never loses the
 * referrer and works with JavaScript off. This listener is pure bookkeeping —
 * if it throws, is blocked, or never loads, the click still reaches Impact and
 * still earns. That is the whole point of doing it this way round.
 *
 * `sendBeacon` is used because it survives the page being replaced or
 * backgrounded, and it cannot delay the click the way a fetch could.
 */
export function AffiliateClickBeacon() {
  React.useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[data-outbound]");
      const kind = anchor?.dataset.outbound;
      if (!kind) return;

      try {
        const body = new Blob(
          [
            JSON.stringify({
              kind,
              placement: anchor?.dataset.placement ?? null,
              slug: anchor?.dataset.slug ?? null,
              path: window.location.pathname,
            }),
          ],
          { type: "application/json" }
        );
        navigator.sendBeacon?.("/api/track-click", body);
      } catch {
        // Bookkeeping must never cost us the click. Swallow and move on.
      }
    }

    // Capture phase so the log is queued even if something downstream stops
    // propagation. It never calls preventDefault, so the navigation is intact.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

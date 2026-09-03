import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { cn } from "@/lib/cn";
import { env } from "@/lib/env";
import markerUrl from "@/assets/self-service/map-marker.png";
import "mapbox-gl/dist/mapbox-gl.css";

/** The brand styles, one per colour scheme. */
const STYLE = {
  light: "mapbox://styles/afterhoursbookings/cm4mlfetf004b01s8220sf7gr",
  dark: "mapbox://styles/afterhoursbookings/cm4mls6if005801s5cexocvqt",
} as const;

const ZOOM = 15.5;

type Props = {
  lat: number;
  lng: number;
  /** Read out for anyone who can't see the map. */
  label: string;
  /**
   * Shown instead of the map when it cannot be drawn — no WebGL, no token, a
   * refused style. The block keeps its place either way: a step that silently
   * loses a section depending on the browser is worse than one that says what
   * it can.
   */
  fallback?: React.ReactNode;
  className?: string;
};

/**
 * The listing's position, on the Afterhours map style.
 *
 * The pin is the same restaurant marker the mobile app drops, so a place looks
 * the same here as it does to a diner.
 *
 * Deliberately not interactive. The design invites the owner to drag the pin to
 * their entrance, but `PATCH /claim/place` accepts name, phone, websiteUri and
 * neighbourhood — there is nowhere to put a corrected latitude and longitude, so
 * a draggable pin would throw the correction away on the next render. It shows
 * what the directory has and says where that came from; when the contract grows
 * a location field, make the marker `draggable` and send `dragend`.
 *
 * Scroll-zoom is off for the same reason it always should be inside a scrolling
 * form: the page must not stop moving because the cursor crossed a map.
 */
export function LocationMap({ lat, lng, label, fallback, className }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!container.current || !env.mapboxToken) return;

    // Mapbox GL needs WebGL. Where it is unavailable — old browsers, hardened
    // configurations, headless — `new Map()` throws rather than degrading, so
    // this is checked before the map is ever constructed.
    if (!mapboxgl.supported?.()) {
      setFailed(true);
      return;
    }

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    mapboxgl.accessToken = env.mapboxToken;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: container.current,
        style: prefersDark ? STYLE.dark : STYLE.light,
        center: [lng, lat],
        zoom: ZOOM,
        interactive: false,
        attributionControl: false,
      });
    } catch {
      // A bad token or an unsupported browser must not take the step down with
      // it — the address above is the load-bearing part of this screen.
      setFailed(true);
      return;
    }

    map.on("error", () => setFailed(true));

    const pin = document.createElement("img");
    pin.src = markerUrl;
    pin.alt = "";
    pin.width = 35;
    pin.height = 43;
    pin.style.display = "block";

    // `bottom` so the point of the pin sits on the coordinate, not its middle.
    const marker = new mapboxgl.Marker({ element: pin, anchor: "bottom" })
      .setLngLat([lng, lat])
      .addTo(map);

    return () => {
      marker.remove();
      map.remove();
    };
  }, [lat, lng]);

  if (!env.mapboxToken || failed) {
    return fallback ? (
      <div className={cn("grid place-content-center px-6 text-center", className)}>
        {fallback}
      </div>
    ) : null;
  }

  return (
    <div
      ref={container}
      role="img"
      aria-label={`Map showing ${label}`}
      className={className}
    />
  );
}

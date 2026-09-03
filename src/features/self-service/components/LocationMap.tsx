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

const ZOOM = 16;

/** Long enough to read as movement, short enough not to feel like waiting. */
const GLIDE_MS = 400;

type Props = {
  lat: number;
  lng: number;
  /** Read out for anyone who can't see the map. */
  label: string;
  /** Set to make the map a picker: tapping anywhere moves the pin. */
  onPick?: (lat: number, lng: number) => void;
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
 * The listing's position, on the Afterhours map style, with the same pin the
 * mobile app drops on a restaurant.
 *
 * With `onPick` it is a location picker: tapping the map moves the pin there.
 * The pin glides rather than jumping — Mapbox rewrites the marker's `transform`
 * on every frame of the map's own movement, so a CSS transition on that
 * property animates the hop for free and costs nothing while panning.
 *
 * The map is created once. Later coordinate changes ease the camera and move the
 * marker instead of tearing the whole thing down, which would flash the tiles
 * white every time the owner adjusted the pin.
 */
export function LocationMap({ lat, lng, label, onPick, fallback, className }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  /** Kept in a ref so changing the handler doesn't rebuild the map. */
  const pick = useRef(onPick);
  pick.current = onPick;

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

    let created: mapboxgl.Map;
    try {
      created = new mapboxgl.Map({
        container: container.current,
        style: prefersDark ? STYLE.dark : STYLE.light,
        center: [lng, lat],
        zoom: ZOOM,
        attributionControl: false,
        // Panning and zooming are fine; the page must not stop scrolling
        // because the cursor crossed a map.
        scrollZoom: false,
      });
    } catch {
      // A bad token or an unsupported browser must not take the step down with
      // it — the address above is the load-bearing part of this screen.
      setFailed(true);
      return;
    }

    created.on("error", () => setFailed(true));
    created.on("click", (event) => pick.current?.(event.lngLat.lat, event.lngLat.lng));

    const pin = document.createElement("img");
    pin.src = markerUrl;
    pin.alt = "";
    pin.width = 38;
    pin.height = 38;
    pin.style.display = "block";
    pin.style.transition = `transform ${GLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;

    // `bottom` so the point of the pin sits on the coordinate, not its middle.
    marker.current = new mapboxgl.Marker({ element: pin, anchor: "bottom" })
      .setLngLat([lng, lat])
      .addTo(created);

    map.current = created;

    return () => {
      marker.current?.remove();
      created.remove();
      map.current = null;
      marker.current = null;
    };
    // Built once: the effect below follows later coordinate changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Follow the coordinate without rebuilding the map. */
  useEffect(() => {
    if (!map.current || !marker.current) return;

    marker.current.setLngLat([lng, lat]);
    map.current.easeTo({ center: [lng, lat], duration: GLIDE_MS });
  }, [lat, lng]);

  /* The cursor should say the map is clickable. */
  useEffect(() => {
    const canvas = map.current?.getCanvas();
    if (canvas) canvas.style.cursor = onPick ? "pointer" : "";
  }, [onPick]);

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

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { cn } from "@/lib/cn";
import { env } from "@/lib/env";
import markerUrl from "@/assets/self-service/map-marker.png";
import "mapbox-gl/dist/mapbox-gl.css";

/**
 * The brand styles.
 *
 * The app is light-only — there is no dark theme in `tokens.css` and no
 * `darkMode` in the Tailwind config — so the light style is the one that
 * matches it. Reading `prefers-color-scheme` here put a night map inside a
 * white page for anyone whose OS is set to dark. `DARK` is kept for the day the
 * app itself gains a theme; switch on that, not on the OS.
 */
const STYLE_LIGHT = "mapbox://styles/afterhoursbookings/cm4mlfetf004b01s8220sf7gr";
export const STYLE_DARK = "mapbox://styles/afterhoursbookings/cm4mls6if005801s5cexocvqt";

const ZOOM = 16;

/** Long enough to read as movement, short enough not to feel like waiting. */
const GLIDE_MS = 400;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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
 * With `onPick` it is a location picker: tapping the map moves the pin there,
 * gliding to the new coordinate. Panning and zooming are not animated — see the
 * effect below for why that distinction takes work.
 *
 * The map is created once. Later coordinate changes move the marker instead of
 * tearing the whole thing down, which would flash the tiles white every time the
 * owner adjusted the pin.
 */
export function LocationMap({ lat, lng, label, onPick, fallback, className }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  /** Where the pin actually is, which is not where it is being sent mid-glide. */
  const at = useRef<[number, number]>([lng, lat]);
  const glide = useRef<number | null>(null);
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

    mapboxgl.accessToken = env.mapboxToken;

    let created: mapboxgl.Map;
    try {
      created = new mapboxgl.Map({
        container: container.current,
        style: STYLE_LIGHT,
        center: [lng, lat],
        zoom: ZOOM,
        attributionControl: false,
        /*
         * Pinch and cmd/ctrl+scroll zoom the map; a plain two-finger scroll
         * still scrolls the page.
         *
         * `scrollZoom: false` disabled the lot, so a trackpad pinch over the
         * map zoomed the whole document instead. Turning scroll-zoom plainly
         * on has the opposite fault: the page stops moving whenever the cursor
         * happens to cross a map halfway down a form. Cooperative gestures is
         * the setting that separates the two, and it puts a hint on screen when
         * someone scrolls over the map so the behaviour is discoverable.
         */
        cooperativeGestures: true,
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
    // The asset is 88 x 102, so the height is not the width — drawing it
    // square would squash the pin.
    pin.width = 38;
    pin.height = 44;
    pin.style.display = "block";

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

  /*
   * Glide the pin to a newly chosen coordinate.
   *
   * The position is interpolated frame by frame rather than left to a CSS
   * transition on `transform`. Mapbox rewrites that transform on every frame of
   * a pan or a zoom, so a transition on it animates the map's own movement too
   * — the pin lagged behind the map whenever it was dragged. Animating the
   * coordinate instead means the pin only ever moves under its own steam, and
   * panning stays exactly as immediate as it should be.
   *
   * The map deliberately does not recentre: the owner tapped somewhere they
   * could already see, and moving the ground under them to follow is the same
   * unasked-for motion in a different guise.
   */
  useEffect(() => {
    if (!marker.current) return;

    const from = at.current;
    const to: [number, number] = [lng, lat];
    if (from[0] === to[0] && from[1] === to[1]) return;

    if (glide.current !== null) cancelAnimationFrame(glide.current);
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / GLIDE_MS);
      const eased = easeOutCubic(progress);

      const next: [number, number] = [
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
      ];
      at.current = next;
      marker.current?.setLngLat(next);

      if (progress < 1) {
        glide.current = requestAnimationFrame(step);
      } else {
        at.current = to;
        glide.current = null;
      }
    };

    glide.current = requestAnimationFrame(step);
  }, [lat, lng]);

  useEffect(
    () => () => {
      if (glide.current !== null) cancelAnimationFrame(glide.current);
    },
    [],
  );

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

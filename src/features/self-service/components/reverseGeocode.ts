import { env } from "@/lib/env";

/**
 * Turn a dropped pin back into a street address.
 *
 * Mapbox's own geocoder, not the owner API — the coordinate never reaches our
 * backend, so asking it for an address would be a round trip through a service
 * that doesn't have one. Same token as the map.
 *
 * Deliberately thin. The caller owns the address afterwards: this is a
 * suggestion to fill the field with, not a value the app treats as authoritative
 * — the owner can always type over it.
 */

const ENDPOINT = "https://api.mapbox.com/search/geocode/v6/reverse";

type GeocodeResponse = {
  features?: {
    properties?: {
      full_address?: string;
      place_formatted?: string;
      name?: string;
    };
  }[];
};

/**
 * The address at a coordinate, or null when there isn't one to give.
 *
 * `signal` matters here: a pin dropped three times in a row starts three
 * lookups, and without it the slowest could land last and overwrite the newest
 * address with an older one.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!env.mapboxToken) return null;

  const url = new URL(ENDPOINT);
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("access_token", env.mapboxToken);
  // Street level: a pin on a building should read as an address, not a city.
  url.searchParams.set("types", "address,street,place");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, { signal });
  if (!response.ok) return null;

  const body = (await response.json()) as GeocodeResponse;
  const properties = body.features?.[0]?.properties;
  if (!properties) return null;

  return (
    properties.full_address ??
    [properties.name, properties.place_formatted].filter(Boolean).join(", ") ??
    null
  );
}

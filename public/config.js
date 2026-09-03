// Runtime API configuration.
//
// This file ships inside the image pointed at dev, so `docker run` works
// standalone. In Kubernetes a per-environment ConfigMap is mounted over this
// exact path (subPath), making it the single source of per-env config — the
// image itself is built once and promoted unchanged.
//
// nginx serves it with no-store; see nginx.conf.
window.__ENV__ = {
  API_BASE_URL: "https://dev-api.afthr.com/api/v1/owner",
  // Mapbox token for the details map. Left empty here on purpose.
  //
  // A `pk.` token is public by design — scoped by URL restrictions at Mapbox,
  // not by being hidden — but GitHub's push protection rejects them all the
  // same, so it is supplied per environment instead of committed: the
  // ConfigMap in Kubernetes, MAPBOX_TOKEN in the Pages workflow, and
  // `.env.development.local` (gitignored) for `npm run dev`.
  //
  // With no token the map degrades to the address and a Google Maps link; the
  // step still works.
  MAPBOX_TOKEN: "",
};

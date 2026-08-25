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
};

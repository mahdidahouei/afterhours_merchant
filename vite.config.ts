import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

const ONE_YEAR = 60 * 60 * 24 * 365;
const ONE_WEEK = 60 * 60 * 24 * 7;

/**
 * Where the app will be served from.
 *
 * "/" for the nginx container. GitHub Pages serves a project site from a
 * subpath, so the workflow sets BASE_PATH="/afterhours_merchant/". Every
 * absolute asset reference in the app goes through `import.meta.env.BASE_URL`
 * so both work from one codebase.
 */
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,

  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },

  build: {
    // Vendor chunks are split by update cadence, not by size: react/router change
    // rarely, motion changes with animation work, the form stack only ships on
    // /connect and /contact-us. Splitting this way keeps the service worker from
    // re-downloading the whole vendor bundle when one library moves.
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-motion": ["motion"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Named so the service worker can skip it — see `globIgnores`. It is
          // also lazily imported, so this chunk is only ever fetched by the
          // details step.
          "mapbox-gl": ["mapbox-gl"],
        },
      },
    },
  },

  plugins: [
    react(),

    // One rule for SVGs, no exceptions:
    //   import Logo    from "./logo.svg?react"  -> React component
    //   import logoUrl from "./logo.svg"        -> URL string
    svgr(),

    VitePWA({
      // A new build installs and activates on its own — there is no "a new
      // version is available" bar, and nobody stays on a stale build because
      // they never pressed it. `skipWaiting` below is what makes that happen.
      //
      // "prompt" here does NOT mean the user is prompted; with no waiting
      // worker there is nothing to prompt about. It means *this app* decides
      // what to do on update, and what it decides is: nothing visible.
      // "autoUpdate" would reload the open tab the moment the worker activates,
      // which on /claim would throw away a half-filled form — measured, not
      // assumed. Instead the new build is simply what the next load gets.
      //
      // The one case that still needs handling is an old tab asking for a lazy
      // chunk the deploy deleted; see src/app/reloadOnStaleChunk.ts.
      registerType: "prompt",
      // Registration is ours (src/app/ServiceWorkerUpdater.tsx) rather than an
      // injected script, so the hourly update check has somewhere to live.
      injectRegister: null,

      devOptions: { enabled: false, type: "module" },

      workbox: {
        // Precache the shell only. Fonts, images and video are large, rarely
        // change, and are far better served by the runtime rules below — putting
        // them here would make every deploy re-download ~26 MB.
        globPatterns: ["**/*.{js,css,html,svg}"],
        // `config.js` must not be precached. It is `NetworkOnly` below for a
        // reason — a cached copy points the app at the wrong backend after a
        // redeploy — but a precache route is registered *before* the runtime
        // ones and wins, so listing it here is what actually enforces that.
        //
        // It is also the one file whose contents change after the build: the
        // Pages workflow injects MAPBOX_TOKEN into `dist/config.js`. Workbox
        // hashes it before that, so the manifest revision never changes and a
        // client keeps serving whatever it cached the first time — which is how
        // a browser that saw one deploy without the token kept an empty one.
        //
        // The map library is a ~1.9 MB chunk used on one step of one flow.
        // Precaching it would make every first visit pay for it, so it is
        // fetched from the network the first time that step is opened.
        globIgnores: [
          "**/node_modules/**",
          "media/**",
          "**/mapbox-*.js",
          "config.js",
        ],

        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/config\.js$/],

        cleanupOutdatedCaches: true,
        // Take over immediately rather than waiting for every tab to close.
        // Without skipWaiting a new build can sit dormant for days behind one
        // pinned tab, which is exactly the staleness this is meant to end.
        clientsClaim: true,
        skipWaiting: true,

        // 26 MB of hero video must never be pulled into the precache manifest.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

        // These match on a path *segment* rather than the string start: under a
        // base like /afterhours_merchant/ every asset URL is prefixed, and
        // root-anchored patterns would quietly never match.
        runtimeCaching: [
          {
            // Self-hosted Satoshi / Lora. Immutable in practice.
            urlPattern: ({ url }) => url.pathname.includes("/fonts/"),
            handler: "CacheFirst",
            options: {
              cacheName: "afterhours-fonts",
              expiration: { maxEntries: 16, maxAgeSeconds: ONE_YEAR },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Hero poster frames (.webp). Small, and they gate first paint.
            urlPattern: ({ url }) => /\/media\/.*\.webp$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "afterhours-posters",
              expiration: { maxEntries: 24, maxAgeSeconds: ONE_YEAR },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Bundled images that Vite emitted with a content hash.
            urlPattern: ({ url }) =>
              /\/assets\/.*\.(png|webp|jpe?g|gif|avif)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "afterhours-images",
              expiration: { maxEntries: 80, maxAgeSeconds: ONE_YEAR },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Legal markdown is fetched at runtime; serve instantly, refresh behind.
            urlPattern: ({ url }) => url.pathname.includes("/legal/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "afterhours-legal",
              expiration: { maxEntries: 8, maxAgeSeconds: ONE_WEEK },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Read-only Connect lookups (cities, restaurants, platforms, guides).
            // Network wins when it can; a 4s timeout keeps the wizard usable on
            // hotel wifi. Workbox never caches POSTs, so the actual connect call
            // and the contact form always hit the network.
            urlPattern: ({ url, request }) =>
              request.method === "GET" && /\/api\/v\d+\/owner\//.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "afterhours-api",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 40, maxAgeSeconds: ONE_WEEK },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Hero video: streamed, seekable, 26 MB total. Caching it would break
            // range requests in Safari and exhaust the origin's storage quota.
            urlPattern: ({ url }) => url.pathname.endsWith(".mp4"),
            handler: "NetworkOnly",
          },
          {
            // Runtime API config is regenerated per environment on container
            // start. A cached copy would point the app at the wrong backend.
            urlPattern: ({ url }) => url.pathname.endsWith("/config.js"),
            handler: "NetworkOnly",
          },
        ],
      },

      includeAssets: ["favicon.svg", "apple-icon.png", "offline.html"],

      manifest: {
        name: "Afterhours for Restaurants",
        short_name: "Afterhours",
        description:
          "Receive reservations from Gen Z & Millennial diners, without lifting a finger.",
        start_url: base,
        scope: base,
        display: "standalone",
        theme_color: "#321B15",
        background_color: "#ffffff",
        icons: [
          { src: `${base}app-icon.svg`, sizes: "any", type: "image/svg+xml" },
          {
            src: `${base}app-icon.svg`,
            sizes: "1024x1024",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});

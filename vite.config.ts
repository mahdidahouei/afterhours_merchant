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
      // "prompt" over "autoUpdate": a silent swap can replace lazy chunks
      // mid-session and blank a section the user is mid-scroll through. The
      // app shows an unobtrusive "new version" bar instead — see
      // src/app/ServiceWorkerPrompt.tsx.
      registerType: "prompt",
      injectRegister: null,

      devOptions: { enabled: false, type: "module" },

      workbox: {
        // Precache the shell only. Fonts, images and video are large, rarely
        // change, and are far better served by the runtime rules below — putting
        // them here would make every deploy re-download ~26 MB.
        globPatterns: ["**/*.{js,css,html,svg}"],
        globIgnores: ["**/node_modules/**", "media/**"],

        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/config\.js$/],

        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false, // the prompt decides when to activate

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

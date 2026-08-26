/**
 * Resolve a path in `public/` against wherever the app is deployed.
 *
 * `import.meta.env.BASE_URL` is "/" for the container and
 * "/afterhours_merchant/" on GitHub Pages. Anything fetched or referenced by
 * URL at runtime — hero clips, legal markdown — has to go through here, or it
 * breaks the moment the app is not at the domain root.
 */
export const assetUrl = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

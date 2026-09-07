import { defineConfig } from "vite";

// SLDS icon sprites and the profile avatar are served from `public/assets/`.
// Vite serves everything under public/ at the site root as-is, in both dev and
// the production build, which is more reliable than copying them out of
// node_modules per-request. See public/assets/ for the sprite symbols.svg files
// referenced by the markup (e.g. /assets/icons/utility-sprite/svg/symbols.svg).
// base: "./" emits relative asset URLs so the build works when served from a
// subpath (e.g. GitHub Pages at /embedded-ai-slds2/) as well as from a root.
// The app is a single page, so relative references resolve against the page URL.
export default defineConfig({
  base: "./",
  build: {
    // Target browsers that support the CSS `light-dark()` function natively, so
    // the (Lightning CSS) minifier leaves it intact. Without this it transpiled
    // the SLDS 2 `light-dark()` surface tokens into a broken helper-var polyfill,
    // collapsing every surface color to an invalid value (page/cards went
    // transparent → all white). These match the browsers the README requires.
    cssTarget: ["chrome123", "safari17.5", "firefox120", "edge123"],
  },
});

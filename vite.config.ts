import { defineConfig } from "vite";

// SLDS icon sprites and the profile avatar are served from `public/assets/`.
// Vite serves everything under public/ at the site root as-is, in both dev and
// the production build, which is more reliable than copying them out of
// node_modules per-request. See public/assets/ for the sprite symbols.svg files
// referenced by the markup (e.g. /assets/icons/utility-sprite/svg/symbols.svg).
export default defineConfig({});

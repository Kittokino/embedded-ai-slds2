import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

// SLDS ships its icon sprites and images as static files that the CSS/markup
// reference by URL (e.g. /assets/icons/utility-sprite/svg/symbols.svg#add).
// Rather than committing a copy of them, we serve them straight from the
// installed package at dev time and copy them into the build output.
const SLDS_ASSETS = "node_modules/@salesforce-ux/design-system/assets";

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: `${SLDS_ASSETS}/icons`, dest: "assets" },
        { src: `${SLDS_ASSETS}/images`, dest: "assets" },
      ],
    }),
  ],
});

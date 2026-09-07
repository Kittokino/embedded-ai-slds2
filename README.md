# Embedded AI with SLDS 2

A front-end prototype exploring embedded AI experiences, built on the
**Salesforce Lightning Design System 2** (global styling hooks, `--slds-g-*`).

> An independent, non-commercial UX concept exploration. See the disclaimer and
> third-party attribution at the bottom.

## Stack

- **Vite** + **TypeScript** (no framework runtime — builds to plain static HTML/CSS/JS).
- **SLDS 2** styling via [`@salesforce-ux/design-system-2`](https://www.npmjs.com/package/@salesforce-ux/design-system-2)
  — the `dist/css/bundled/slds2.cosmos.css` bundle (component structure + Cosmos theme tokens +
  `--slds-g-*` global styling hooks). Swappable with the `lightning-blue` theme, and modular
  base+theme files exist for runtime theme switching.
- SLDS **icon sprites** are vendored under `public/assets/icons/` (the `-2` package doesn't ship
  icon sprites; these come unmodified from `@salesforce-ux/design-system`, licensed CC BY-ND 4.0 —
  see [Third-party attribution](#third-party-attribution)). Vite serves `public/` at the site root
  as-is in dev and build, so no copy plugin is needed.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build locally
```

## Project structure

```
index.html            App entry
vite.config.ts        Vite config (SLDS asset copy)
src/
  main.ts             App bootstrap; imports SLDS 2 CSS
  styles/app.css      App styles (prefer SLDS utilities + --slds-g-* hooks)
```

## Conventions

- Prefer SLDS component classes and **SLDS 2 global styling hooks** (`--slds-g-*`) over
  hard-coded colors/spacing, so the UI stays theme- and dark-mode-ready.
- Reference icons via the sprite sheets under `/assets/icons/...#<name>`.

## Third-party attribution

This prototype uses assets and styles from the Salesforce Lightning Design System:

- **SLDS icon sprites** (`public/assets/icons/**`) — © Salesforce, Inc., licensed under
  [Creative Commons Attribution-NoDerivatives 4.0](https://creativecommons.org/licenses/by-nd/4.0/).
  Redistributed here **unmodified**.
- **SLDS 2 CSS** (`@salesforce-ux/design-system-2`, pulled via npm and bundled into `dist/` at build
  time) — © Salesforce, Inc., provided under the Salesforce Terms of Use in that package's
  `LICENSE.txt`. Anyone redistributing a build should include those terms.

All product/company names, records, and content shown in the UI (e.g. "Infiwave Wireless",
"Acme, Inc.") are **fictional** and for demonstration only. The profile avatar is drawn purely in
CSS (initials on a solid fill) — no image assets, so nothing here carries a third-party image
license.

---

Built by [@kittokino](https://github.com/kittokino). Application code is released under the MIT
License (see `LICENSE`); third-party assets remain under their respective licenses noted above.

**Disclaimer:** This project is an independent, non-commercial UX prototype and concept
exploration. It is not affiliated with, endorsed by, or sponsored by Salesforce, Inc.
"Salesforce" and "Lightning Design System" are trademarks of Salesforce, Inc. All UI is
simulated for demonstration purposes only.

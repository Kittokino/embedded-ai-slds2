# Embedded AI with SLDS 2

A front-end prototype exploring embedded AI experiences, built on the
**Salesforce Lightning Design System 2** (global styling hooks, `--slds-g-*`).

> Private work in progress — not yet ready to share.

## Stack

- **Vite** + **TypeScript** (no framework runtime).
- **SLDS 2** via [`@salesforce-ux/design-system`](https://www.npmjs.com/package/@salesforce-ux/design-system)
  — component CSS framework + SLDS 2 global styling hooks.
- SLDS icon sprites & images are served from the installed package at dev time and copied into
  the build via `vite-plugin-static-copy` (see `vite.config.ts`).

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

---

Built by [@kittokino](https://github.com/kittokino).

**Disclaimer:** This project is an independent, non-commercial UX prototype and concept
exploration. It is not affiliated with, endorsed by, or sponsored by Salesforce, Inc.
"Salesforce" and "Lightning Design System" are trademarks of Salesforce, Inc. All UI is
simulated for demonstration purposes only.

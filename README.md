# Quanta — SaaS landing page

A 3D, animated landing page for a fictional real-time analytics product, built with Vite and Three.js.

Designed and built by **Tayyaba Imtiaz**.

## Highlights

- **3D particle scene.** 16,000 GPU particles morph from an orb into a ring, a DNA helix and a wave as you scroll, and react to the cursor and to scroll speed.
- **Live product mockup.** The dashboard tilts into place as you scroll, with counting KPIs, a self-drawing revenue chart, a typing AI insight and a live event feed.
- **Every section of the brief.** Navbar, hero, product preview, features, how it works, three pricing plans with a monthly/yearly toggle and savings, testimonials, FAQ and footer.
- **Fully responsive.** Tuned for phones, tablets and wide screens, with a slide-down mobile menu.
- **Accessible.** Semantic landmarks, skip link, keyboard-friendly menu and FAQ, `aria-current` navigation, screen-reader announcements and `prefers-reduced-motion` support.
- **Fast.** Lighthouse 99 / 100 / 100 / 100. Three.js loads after first paint in its own chunk, fonts are self-hosted, and devices without GPU acceleration skip the 3D scene.

## Tech stack

Vite · Three.js with custom GLSL shaders · vanilla JavaScript · modern CSS · Vercel

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build and test

```bash
npm test           # production build + smoke test (all sections, 3 plans, bundle split)
npm run preview    # serve the production build at http://localhost:4173
```

## Deploy

Import the repository in Vercel. `vercel.json` already sets the Vite preset, the `dist` output, long-lived caching for hashed assets and security headers. No environment variables are needed.

## Project structure

```
index.html          page markup, structured data and icon sprite
src/main.js         interactions: navigation, reveals, counters, pricing, form
src/scene.js        three.js particle scene and shaders
src/style.css       design tokens, layout, animations and breakpoints
scripts/smoke.mjs   post-build smoke test
vercel.json         build preset, caching and security headers
```

## License

[MIT](LICENSE) © Tayyaba Imtiaz

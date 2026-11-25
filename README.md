# Quanta — SaaS landing page

A 3D, animated landing page for a fictional real-time analytics product, built with Vite and Three.js.

Designed and built by **Tayyaba Imtiaz**.

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

## Deploy to Vercel

Import the GitHub repo in Vercel. `vercel.json` already sets the Vite preset, the `dist` output, long-lived caching for hashed assets and security headers. No environment variables are needed.

## What's inside

- **Sections:** navbar, hero, product dashboard mockup, features bento, how it works, three pricing plans (monthly/yearly), testimonials, FAQ, CTA and footer.
- **3D:** one WebGL particle system (`src/scene.js`) morphs sphere → ring → DNA helix → wave → sphere as you scroll, and reacts to the cursor and scroll speed.
- **Performance:** Three.js loads after first paint in its own chunk, and the main JS is about 3 KB gzipped. Fonts are self-hosted. The 3D is skipped on devices without GPU acceleration. Lighthouse scores 99 / 100 / 100 / 100.
- **Accessibility:** semantic landmarks, skip link, keyboard-friendly menu and FAQ, visible focus styles, and `prefers-reduced-motion` support.

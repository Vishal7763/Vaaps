# VAAPS — Immersive 3D Agency Website

Premium single-page site for the fictional digital agency **VAAPS**.
No build step, no npm — plain HTML / CSS / JS. Just serve the folder.

## Run it

```bash
cd vaaps
python3 -m http.server 8000
# open http://localhost:8000
```

Or with Node: `npx serve .` — or drop the folder on Netlify / Vercel / GitHub Pages.

## What's inside

- `index.html` — semantic single-page markup: loader, nav, hero, stats, services,
  4 project case cards, about, 4-step process timeline, contact, footer, case-study modal
- `css/style.css` — dark-navy design system, glassmorphism, 3D tilt cards,
  pure-CSS device mockups, responsive breakpoints, `prefers-reduced-motion` support
- `js/hero-scene.js` — Three.js hero scene (pinned `three@0.160.0` via import map):
  floating torus knot, icosahedrons, glass rings, 520-particle field, mouse
  parallax + magnetic drift. DPR capped, pauses off-screen / tab-hidden.
- `js/main.js` — loader tied to real readiness milestones, custom cursor (desktop),
  magnetic buttons, tilt cards, scroll reveals, count-ups, ambient 2D particles,
  case-study modal (Esc + focus trap), validated contact form (front-end only).

## Notes

- Needs internet for the Three.js CDN and Google Fonts. If the CDN is blocked,
  the loader still dismisses and the hero falls back to a gradient background.
- The contact form is front-end only (validation + success state, nothing is sent).
- The "Book a Free Strategy Call" button points to a clearly-marked
  `calendly.com/vaaps` placeholder — swap in the real link before launch.
- Projects shown are fictional/illustrative (noted in the footer).

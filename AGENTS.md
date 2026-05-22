# Jap App Hub — Project Guide

## What this is
Static HTML/CSS/JS collection served as a GitHub Pages site. No build tools, no package manager, no framework — just plain `.html` files with Bootstrap 5 CDN.

## Key files
- `index.html` — Hub/entry page with search, categories, and app grid
- `jap.html`, `switchword.html` — Spiritual chanting tools (mantra counters)
- `game.html`, `mgame.html`, `sudoku.html` — Games
- `holiday.html`, `resume.html` — Utilities
- `laravel13.html`, `angular21.html`, `vue3.html`, `react19.html`, `cakephp.html`, `cakephp28.html` — Learning/guide pages
- `interview.html` — PHP & Laravel interview Q&A (100+ questions, accordion format)

## Deployment
- GitHub Pages via `.github/workflows/static.yml` — push to `master` auto-deploys
- No build step; full repo is deployed as-is

## Style conventions
- Bootstrap 5.3.x from CDN (`https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css`)
- Bootstrap Icons from CDN (`https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css`)
- Glass-morphism theme: `.glass-card`, `.hero-shell`, `.section-panel`
- Custom saffron/orange accent color (`--saffron: #ff9933`)
- Dark mode via `data-bs-theme` toggle (stored in localStorage)
- Learning pages: fixed dark sidebar (280px) + main content area with `margin-left: var(--sidebar-width)`
- Home link always in top-left with `← Home` text

## How to add a new page
1. Create `.html` following existing pattern (e.g., `laravel13.html`)
2. Add link to `index.html` in:
   - "Learning resources" section (quick-chip)
   - `APPS` array in the JS (for search + category system)

## Naming
- All pages are flat `.html` files in root — no subdirectories
- File names are kebab-case (e.g., `switchword.html`, `cakephp28.html`)

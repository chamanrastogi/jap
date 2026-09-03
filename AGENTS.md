# Jap App Hub — Project Guide

## What this is
Static HTML/CSS/JS collection served as a GitHub Pages site. No build tools, no package manager, no framework — just plain `.html` files with self-hosted vendor assets (no CDNs).

## Key files
- `index.html` — Hub/entry page with search, categories, and app grid (tools, games, utilities only — no learning content)
- `jap.html`, `switchword.html` — Spiritual chanting tools (mantra counters)
- `game.html`, `mgame.html`, `sudoku.html` — Games
- `holiday.html`, `resume.html` — Utilities
- `learning/` — Self-contained Learning library (separate from the hub):
  - `learning/index.html` — Learn Home hub for beginners (routes, search, 38 guide cards)
  - `learning/python.html`, `learning/laravel13.html`, … (38 guides) + `learning/questions.json` (quiz data)
  - Paths inside `learning/` are relative to that folder: `../assets/`, `../lib/`, home links `../index.html`
- `learning/graphql.html` — **reference pattern** for all learning/doc pages
- `laravel13.html`, `symfony.html`, `django.html`, `angular21.html`, `vue3.html`, `react19.html`, `cakephp.html`, `cakephp28.html`, `mysql.html`, `python.html` + ~30 more — Learning/guide pages (one shared template), all inside `learning/`
- `interview.html`, `laravel-interview.html`, `interview-quiz.html` — Dark-theme Q&A pages (separate template, Outfit font, `.sidebar` class — do not apply the light design system to them), all inside `learning/`

## Deployment
- GitHub Pages via `.github/workflows/static.yml` — push to `master` auto-deploys
- No build step; full repo is deployed as-is

## Style conventions
- All libraries self-hosted under `assets/vendor/` — never add CDN links to pages:
  - `assets/vendor/bootstrap/` — Bootstrap 5.3.3 `bootstrap.min.css` + `bootstrap.bundle.min.js` (all pages, incl. former 5.3.0/5.3.2 users)
  - `assets/vendor/bootstrap-icons/` — icons CSS + fonts
  - `assets/vendor/font-awesome/` — FA 6.4.0 CSS + webfonts
  - `assets/vendor/fonts/fonts.css` — all Google Fonts families (woff2 in `files/`); replaces every `fonts.googleapis.com/css2` link/@import
  - `assets/vendor/three/`, `htmx/`, `tailwind/`, `firebase/` — per-app libs
- Code-sample URLs inside tutorial pages (e.g. `learning/bootstrap.html` install snippets) intentionally still show CDN URLs — do not "fix" them
- Glass-morphism theme: `.glass-card`, `.hero-shell`, `.section-panel`
- Custom saffron/orange accent color (`--saffron: #ff9933`)
- Dark mode via `data-bs-theme` toggle (stored in localStorage)
- Home link always in top-left with `← Home` text

## Design system — learning/doc pages
`graphql.html` is the **reference pattern** for every learning page. Its look is applied to each
doc page via an **injected override layer**: a `<style>` block (plus Google Fonts links) placed
right before `</head>`, AFTER the page's own styles, so it wins the cascade without removing any
page-specific classes (`.vs-card`, `.diagram-box`, `.badge-diet`, etc. stay working).

- **Layout**: fixed dark gradient sidebar (`#sidebar`, 280px, uses `--sidebar-width`) + `#main`
  (flex child, `max-width: 1120px`, `padding: 2rem 2.5rem 4rem`).
- **Fonts**: `Space Grotesk` (UI/headings) + `JetBrains Mono` (code), served locally from `assets/vendor/fonts/fonts.css`.
- **Per-page tokens** set in the injected `:root` — never reuse `--ink`/`--surface` for page vars
  (they collide; `node-express.html`, `codeigniter-versions.html` already own them and are already
  graphql-style — leave them alone):
  - `--acc` — brand accent (e.g. Laravel `#f9322c`, Symfony `#2d8f5c`, Django `#44b78b`)
  - `--acc2` — secondary accent for gradients
  - `--ink-deep` — brand dark for the hero band + sidebar gradient
  - Everything else (`--acc-soft`, `--bg`, `--border`, `--muted`, `--ink`, `--surface`, `--code`)
    is derived with `color-mix(...)` from `--acc`, so each page gets a tinted identity for free.
- **Signature elements**: dark hero band (`#main > div:first-child.d-flex` — the standard
  `<div class="d-flex align-items-center gap-3 mb-4 flex-wrap">` hero), h2 with a short
  `--acc → --acc2` gradient underline (`h2::after`, 58px), tinted `.card-header`, dark `pre`
  blocks with syntax spans `.kw/.fn/.str/.cm/.num/.tp`, accent inline `code` chips, `.highlight-box`,
  `.cmd-table` accent on first column, uppercase Space Grotesk table headers, pill badges.
- **Two hero variants need no band transform** (selector won't match, they keep their own header):
  `.hero`-class heroes (`node-express`, `react-native`, `codeigniter-versions`) and compact headers
  (`laravel-tips` `.page-header`, `problems` bare h1, `ai-roadmap` `.learn-main`).
- Tail JS (sidebar toggle + active-link close) is shared by the template — already present everywhere.

## How to add a new page
1. Hub page: create flat `.html` in root following existing pattern, add to `APPS` array in `index.html` JS (for search + category system)
2. Learning guide: create it inside `learning/` (copy head/style/sidebar structure from a sibling, keep `../assets/` + `../lib/` + `../index.html` relative paths, inject the design-system override block before `</head>`), then add its card to the `GUIDES` array in `learning/index.html`

## Naming
- Root hub pages are flat `.html` files in root; all learning/guide pages live in `learning/`
- File names are kebab-case (e.g., `switchword.html`, `cakephp28.html`)

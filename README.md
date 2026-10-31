# Curriculum planner — TypeScript edition

All application logic runs in the browser: React/TypeScript interface, degree validation, prerequisites, GPA, import and export. There is no Python, database, API or production server. HTML, CSS and JSON remain ordinary web assets; TypeScript is compiled to JavaScript for browsers.

## Keep your current plan

Export your plan from the old app before migrating. Open this version and choose **Importer** to select that JSON file. Version-1 exports remain compatible, including course placements, grades, notes and prerequisite equivalents. This download contains no personal planner data.

The last plan is automatically restored from localStorage in the same browser and site directory. Clearing browser data removes that copy; it does not sync across devices or between localhost and GitHub Pages. Use **Exporter** for durable, portable backups. The app remains usable if browser storage is blocked, but shows a warning to export. Avoid editing the same site in multiple tabs simultaneously. A new browser starts with empty placements and the original Hiver 2025–Hiver 2029 semester grid.

## Deploy on GitHub Pages

Create a public GitHub repository for free Pages hosting. Put the **contents** of this folder at the repository root: `package.json`, `src/`, and especially `.github/workflows/deploy.yml` must be at the root. Do not commit `node_modules` or personal plan exports.

In GitHub, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. Push to `main`, or run **Deploy planner to GitHub Pages** manually from the Actions tab. The included workflow installs dependencies, runs tests, builds and publishes `dist/`. When it finishes, GitHub displays the site address in Settings → Pages. Subsequent pushes to `main` redeploy automatically. If your default branch has another name, update the workflow's `branches` field.

The build uses relative asset paths, so no repository name needs to be hardcoded. Both `/repository/` project sites and account-root sites work. The deployment workflow is provided; no repository has been created or deployed on your behalf.

Reference: https://vite.dev/guide/static-deploy#github-pages

## Run locally

Use Node.js 24 LTS (no Python environment needed):

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. Alternatively, `bash start.sh` installs dependencies if necessary and opens the browser. The development server must keep running while using the local URL; the hosted GitHub Pages version needs no local process.

## Build and check

```bash
npm test
npm run build
npm run preview
```

Or run `bash build.sh`. The included `dist/` is already built and can be served by any static HTTP server. Do not open `index.html` directly via `file://`. Node is needed only for local tooling/building, not by visitors to the hosted site.

## Source layout

`src/core.ts` contains pure plan validation and GPA logic. `src/storage.ts` handles browser persistence. `src/main.tsx` contains the interface, and `src/style.css` the permanent dark theme. `src/curriculum.json` is the full 82-course catalogue, including 32 maths choices. `tests/` contains regression tests. The catalogue retains the October 2026 data; it is not refreshed from Polytechnique automatically.

All previous rules are preserved: 96 mandatory credits, 6 technical credits, 12 maths credits and PHS8972's 6 credits; independent language versions; exact catalogue membership for corequisites; explicit prerequisite aliases; and a two-term final project. GPA uses actual course credits and excludes pass-only, ungraded and credited courses. F counts as zero without awarding credits. One result is retained per course code.

The top banner and logo are removed. Import, Export, Undo, Help and the browser-save indicator are beside GPA/credits. Overall completion/conflict status is the fifth requirement card, with details expanding below it. The layout wraps on narrow screens.

## Validation performed

Production build and 22 regression tests pass. The TypeScript validator also matched the previous Python validator on 300 deterministic randomized plans. DOM smoke checks covered course placement, grade/GPA updates and colour endpoints, undo, help, expanded status, browser restoration, and removal/relocation of the banner controls. Full rendered-browser and drag-and-drop checks could not run in the build environment because Chromium launch was blocked. The GitHub workflow has not been run against a live repository.

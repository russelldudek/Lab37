# Artifact Manifest

The campaign source is committed directly to `main`. The materialization workflow fetches the two official Lab37 product assets, pins Three.js 0.170.0, renders the four PDF downloads from the committed HTML print layouts, verifies the 2 / 1 / 4 / 3 page-count contracts, removes temporary build dependencies, and commits the generated files back to `main`.

## Candidate routes

- `index.html`
- `resume.html`
- `cover-letter.html`
- `interview-brief.html`
- `90-day-plan.html`

## Shared source

- `styles.css`
- `brand-tokens.css`
- `app.js`
- `brand-intelligence.md`
- `sources.md`
- `campaign-audit.md`
- `README.md`
- `.nojekyll`

## Materialized assets

- `assets/brand/bowl-builder-software.webp`
- `assets/brand/bowl-builder-blueprint.svg`
- `assets/vendor/three.module.js`
- `assets/vendor/THREE-LICENSE.txt`
- `docs/Russell-Dudek-Lab37-Robotics-Product-Manager-Resume.pdf`
- `docs/Russell-Dudek-Lab37-Robotics-Product-Manager-Cover-Letter.pdf`
- `docs/Russell-Dudek-Lab37-Robotics-Product-Manager-Interview-Brief.pdf`
- `docs/Russell-Dudek-Lab37-Robotics-Product-Manager-90-Day-Plan.pdf`

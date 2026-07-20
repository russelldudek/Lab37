# Cody Share Copy and Layout Refinement Design

## Purpose

Refine the already-published Lab37 candidate campaign after direct visual review. Preserve the campaign thesis, visual system, animation behavior, document contracts, and evidence integrity while making selected language more specific, more confident, and less repetitive.

## Scope

This revision changes only candidate-facing copy, one question-grid composition, one first-90-days call to action, and the résumé publication section. It does not redesign the hero, alter the simulator, change the animation timing, modify the evidence basis, or merge directly to `main`.

## Approved copy changes

### Recipe-to-Release caption

Replace the literal animation narration with:

> **The Recipe-to-Release Assembly**  
> Each bowl accumulates evidence across food behavior, machine performance, order truth, operator flow, and economics before it advances.

### Mandate headline

Replace the word `promising` and use:

> Make Bowl Builder deployments repeatable across recipes, sites, operators, food-safety controls, and economics.

### Evidence labels

Remove `· Direct` from the Vape-Jet, Amazon, Compunetics, and DudeWorth evidence labels. The evidence text itself carries the claim strength.

### Questions grid

Add a seventh question to occupy the empty white grid cell:

> What evidence would give a customer confidence to expand from a successful pilot to a multi-site deployment—and where does the PM own that decision?

Keep the twelve-month question as the full-width dark closing question.

### First 90 days call to action

Add a green button directly beneath the three first-90-days cards:

> Explore the full first 90 days →

The button links to `90-day-plan.html`, remains keyboard accessible, and preserves mobile stacking.

### Amazon Flex bullet

Replace the current line with:

> Contributed to Prime Air research and Amazon Flex geolocation concepts—an early “last-mile Uber” model for distributed delivery.

This is a framing reference only. It must not imply an undisclosed relationship between Amazon Flex and Lab37, Atoms, CloudKitchens, or Uber.

### DudeWorth bullet

Replace the JD-like artifact list with:

> Turn ambiguous operating problems into agentic workflows that combine structured context, AI assistance, human judgment, escalation, evaluation, and governance.

Use the same underlying framing wherever the campaign currently repeats the older product-artifact list as proof.

### Publications

Under the résumé Credentials block, add:

> **Publications**  
> scholar.google.com/citations?user=yHQSVd8AAAAJ&hl=en

The complete Google Scholar URL must remain visible and clickable. Do not invent publication titles, citation counts, impact metrics, or research claims.

### Cover-letter transferability

Replace `unusual transferability profile` with `unique transferability profile`.

## Layout behavior

- The question grid must contain an even six white questions plus one full-width dark closing question, eliminating the visible empty grey rectangle.
- The new first-90-days button must sit below the three-card rail with clear spacing and use the existing signal-lime action style.
- The résumé must remain exactly two pages after adding Publications.
- The cover letter must remain exactly one page.
- The interview brief and 90-day plan page counts must not change.
- Screen previews must not clip or overlap footers at desktop, tablet, or mobile widths.

## Files expected to change

- `index.html`
- `resume.html`
- `cover-letter.html`
- `interview-brief.html` only where the older DudeWorth artifact list repeats
- `styles.css` or the smallest existing refinement stylesheet needed for the new CTA and question-grid behavior
- `tests/candidate-alignment.test.mjs`
- `tests/document-evidence.test.mjs`
- document-render workflow only when a new assertion is required
- regenerated PDFs under `docs/`

## Verification contract

The revision is complete only when:

1. all approved phrases appear exactly where intended;
2. `promising`, `· Direct`, the old Amazon Flex sentence, the old DudeWorth sentence, and `unusual transferability profile` no longer appear in candidate-facing HTML or PDFs;
3. the Google Scholar URL appears visibly in the résumé HTML and two-page PDF;
4. the question grid renders without an empty cell;
5. the first-90-days CTA resolves to `90-day-plan.html`;
6. résumé, cover letter, interview brief, and 90-day plan remain 2 / 1 / 4 / 3 pages;
7. desktop and mobile screenshots show no clipping, overflow, or footer collision;
8. the branch remains isolated for Russell’s review before merge to `main`.

# Cody Share Copy and Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved copy, question-grid, first-90-days CTA, Amazon Flex, DudeWorth, Publications, and transferability refinements while preserving the campaign’s exact document page counts and current visual system.

**Architecture:** Keep the existing static HTML/CSS architecture. Encode the approved copy and geometry expectations in regression tests first, then make the smallest HTML and CSS changes needed. Regenerate every affected PDF from the existing Playwright renderer and review desktop/mobile site captures plus all PDF pages before opening a draft PR.

**Tech Stack:** HTML5, CSS, Node.js assertion tests, Playwright/Chromium PDF rendering, GitHub Actions, Poppler PDF verification.

## Global Constraints

- Work only on `refine/cody-copy-layout-2026-07-20`; do not change `main`.
- Preserve the existing animation, simulator, brand system, source links, and candidate thesis.
- Do not imply a relationship between Amazon Flex and Lab37, Atoms, CloudKitchens, or Uber.
- Display the complete Google Scholar URL visibly and make it clickable.
- Do not invent publication titles, citation counts, impact metrics, or research ownership.
- Preserve exact PDF pagination: résumé 2, cover letter 1, interview brief 4, 90-day plan 3.
- Preserve candidate-facing confidentiality and the complete live candidate-vision URL.

---

### Task 1: Add the approved refinement contract

**Files:**
- Modify: `tests/candidate-alignment.test.mjs`
- Modify: `tests/document-evidence.test.mjs`

**Interfaces:**
- Consumes: existing candidate-facing HTML files.
- Produces: assertions that define the approved phrases, removed phrases, Google Scholar URL, question count, and CTA destination.

- [ ] **Step 1: Add failing site-copy and layout assertions**

Add these assertions to `tests/candidate-alignment.test.mjs`:

```js
const approvedSiteCopy = [
  'Each bowl accumulates evidence across food behavior, machine performance, order truth, operator flow, and economics before it advances.',
  'Make Bowl Builder deployments repeatable across recipes, sites, operators, food-safety controls, and economics.',
  'What evidence would give a customer confidence to expand from a successful pilot to a multi-site deployment—and where does the PM own that decision?',
  'Explore the full first 90 days',
];
for (const phrase of approvedSiteCopy) {
  assert.ok(files.site.includes(phrase), `Site missing approved refinement: ${phrase}`);
}
assert.match(files.site, /href="90-day-plan\.html"[^>]*>Explore the full first 90 days/);
assert.equal((files.site.match(/<div class="questions-list">[\s\S]*?<\/div><\/section>/)?.[0].match(/<p>/g) || []).length, 7);
```

Add these forbidden fragments:

```js
for (const forbidden of [
  'promising robotic makeline',
  'Vape-Jet · Direct',
  'Amazon · Direct',
  'Compunetics · Direct',
  'DudeWorth · Direct',
]) {
  assert.ok(!files.site.includes(forbidden), `Site retains rejected wording: ${forbidden}`);
}
```

- [ ] **Step 2: Add failing document assertions**

Add to `tests/document-evidence.test.mjs`:

```js
const scholarUrl = 'https://scholar.google.com/citations?user=yHQSVd8AAAAJ&hl=en';
assert.ok(resume.includes('Publications'), 'Resume needs a Publications heading');
assert.ok(resume.includes(scholarUrl), 'Resume needs the complete Google Scholar URL');
assert.ok(resume.includes('last-mile Uber'), 'Resume needs the approved Amazon Flex framing');
assert.ok(resume.includes('Turn ambiguous operating problems into agentic workflows'), 'Resume needs the approved DudeWorth evidence framing');
assert.ok(cover.includes('unique transferability profile'), 'Cover letter needs the approved transferability wording');

for (const forbidden of [
  'Contributed to logistics innovation through Prime Air research and Amazon Flex geolocation concepts.',
  'Create product briefs, PRDs, user stories, acceptance criteria, review mechanisms, prototypes, and measurable operating models.',
  'unusual transferability profile',
]) {
  assert.ok(!combined.includes(forbidden), `Documents retain rejected wording: ${forbidden}`);
}
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run:

```bash
node tests/candidate-alignment.test.mjs
node tests/document-evidence.test.mjs
```

Expected: both commands fail on the newly approved phrases because the HTML has not yet been revised.

- [ ] **Step 4: Commit the failing contract**

```bash
git add tests/candidate-alignment.test.mjs tests/document-evidence.test.mjs
git commit -m "test: define approved Lab37 copy refinement"
```

---

### Task 2: Refine the site copy and question/CTA composition

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: existing section structure and `.action-link`, `.questions-list`, `.plan-rail` classes.
- Produces: approved caption, mandate headline, evidence labels, seven-question grid, and first-90-days CTA.

- [ ] **Step 1: Replace the hero-stage caption**

Use:

```html
<p class="stage-caption"><strong>The Recipe-to-Release Assembly</strong>Each bowl accumulates evidence across food behavior, machine performance, order truth, operator flow, and economics before it advances.</p>
```

- [ ] **Step 2: Replace the mandate headline**

Use:

```html
<h2>Make Bowl Builder deployments <em>repeatable across recipes, sites, operators, food-safety controls, and economics.</em></h2>
```

- [ ] **Step 3: Remove claim-strength suffixes and revise DudeWorth proof**

Use employer-only labels and this DudeWorth proof:

```html
<article><span>DudeWorth</span><h3>Agentic operating workflows</h3><p>Turn ambiguous operating problems into agentic workflows that combine structured context, AI assistance, human judgment, escalation, evaluation, and governance.</p></article>
```

- [ ] **Step 4: Add the missing customer-expansion question before the closing question**

Insert:

```html
<p>What evidence would give a customer confidence to expand from a successful pilot to a multi-site deployment—and where does the PM own that decision?</p>
```

Keep the twelve-month question last so the existing `p:last-child` dark full-width treatment remains correct.

- [ ] **Step 5: Add the first-90-days CTA**

Immediately after `.plan-rail`, add:

```html
<div class="plan-action"><a class="action-link primary" href="90-day-plan.html">Explore the full first 90 days →</a></div>
```

- [ ] **Step 6: Add the minimum CTA layout CSS**

Add:

```css
.plan-action{max-width:var(--page-max);margin:24px auto 0;display:flex;justify-content:flex-start}
@media(max-width:800px){.plan-action .action-link{width:100%}}
```

Do not change the questions-grid selector; seven paragraphs naturally render as six paired white cells plus the final full-width dark cell.

- [ ] **Step 7: Run the site contract**

```bash
node tests/candidate-alignment.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit the site refinement**

```bash
git add index.html styles.css
git commit -m "refine: sharpen Lab37 site copy and navigation"
```

---

### Task 3: Refine the résumé, cover letter, and interview brief

**Files:**
- Modify: `resume.html`
- Modify: `cover-letter.html`
- Modify: `interview-brief.html`
- Modify: `document-revision.css` only if the Publications block requires spacing correction.

**Interfaces:**
- Consumes: existing two-column contribution/toolkit block and print layout.
- Produces: approved Amazon Flex wording, agentic workflow evidence, Publications link, and unique-transferability wording.

- [ ] **Step 1: Replace the Amazon Flex bullet**

Use:

```html
<li>Contributed to Prime Air research and Amazon Flex geolocation concepts—an early “last-mile Uber” model for distributed delivery.</li>
```

- [ ] **Step 2: Replace the DudeWorth bullet**

Use:

```html
<li>Turn ambiguous operating problems into agentic workflows that combine structured context, AI assistance, human judgment, escalation, evaluation, and governance.</li>
```

Retain the other DudeWorth bullets because they provide complementary evidence.

- [ ] **Step 3: Add Publications beneath Credentials**

Use:

```html
<h2 class="doc-section-title">Publications</h2>
<p class="tag-line"><a href="https://scholar.google.com/citations?user=yHQSVd8AAAAJ&amp;hl=en">scholar.google.com/citations?user=yHQSVd8AAAAJ&amp;hl=en</a></p>
```

- [ ] **Step 4: Replace the cover-letter phrase**

Change `unusual transferability profile` to `unique transferability profile` without altering the rest of the paragraph.

- [ ] **Step 5: Remove the older DudeWorth artifact-list phrasing from the interview brief**

Replace the DudeWorth evidence mechanism with:

```html
<td>Turns ambiguous operating problems into agentic workflows combining structured context, AI assistance, human judgment, escalation, evaluation, and governance.</td>
```

Keep the Lab37 transfer column unchanged unless grammar requires a direct adjustment.

- [ ] **Step 6: Run the document evidence contract**

```bash
node tests/document-evidence.test.mjs
node tests/candidate-alignment.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit the document-source refinement**

```bash
git add resume.html cover-letter.html interview-brief.html document-revision.css
git commit -m "refine: strengthen Lab37 evidence and publications"
```

---

### Task 4: Regenerate and visually verify the complete candidate package

**Files:**
- Regenerate: `docs/Russell-Dudek-Lab37-Robotics-Product-Manager-Resume.pdf`
- Regenerate: `docs/Russell-Dudek-Lab37-Robotics-Product-Manager-Cover-Letter.pdf`
- Regenerate: `docs/Russell-Dudek-Lab37-Robotics-Product-Manager-Interview-Brief.pdf`
- Regenerate: `docs/Russell-Dudek-Lab37-Robotics-Product-Manager-90-Day-Plan.pdf`
- Modify: `.github/workflows/document-review.yml` only when new PDF text assertions are needed.

**Interfaces:**
- Consumes: final HTML/CSS source.
- Produces: exact-page-count PDFs and review screenshots.

- [ ] **Step 1: Extend PDF text verification**

Add normalized-text checks for:

```bash
grep -F "last-mile Uber" /tmp/lab37-pdf-text/resume.txt
grep -F "Publications" /tmp/lab37-pdf-text/resume.txt
grep -F "scholar.google.com/citations?user=yHQSVd8AAAAJ&hl=en" /tmp/lab37-pdf-text/resume.txt
grep -F "unique transferability profile" /tmp/lab37-pdf-text/cover.txt
! grep -F "unusual transferability profile" /tmp/lab37-pdf-text/cover.txt
```

- [ ] **Step 2: Run the existing document-review workflow**

Expected outputs:

```text
resume pages: actual=2 expected=2
cover pages: actual=1 expected=1
brief pages: actual=4 expected=4
plan pages: actual=3 expected=3
```

- [ ] **Step 3: Inspect rendered evidence**

Review:

- desktop full-page site screenshot;
- mobile full-page site screenshot;
- résumé pages 1 and 2;
- cover-letter page 1;
- interview-brief pages 1–4;
- 90-day-plan pages 1–3.

Confirm:

- no empty grey question-grid cell;
- first-90-days CTA appears below the cards and does not resemble a fourth card;
- Publications fits without footer collision;
- all pages remain balanced and readable;
- no candidate-facing forbidden repository or private-system text appears.

- [ ] **Step 4: Commit regenerated PDFs**

```bash
git add docs/*.pdf .github/workflows/document-review.yml
git commit -m "docs: regenerate refined Lab37 candidate package"
```

- [ ] **Step 5: Open a draft PR to main**

Title:

```text
Refine recruiter-facing copy and 90-day navigation
```

Body must list the approved language changes, exact PDF page counts, and screenshot-review result. Keep the PR draft and unmerged for Russell’s approval.

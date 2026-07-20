import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = {
  site: readFileSync('index.html', 'utf8'),
  resume: readFileSync('resume.html', 'utf8'),
  cover: readFileSync('cover-letter.html', 'utf8'),
  brief: readFileSync('interview-brief.html', 'utf8'),
  plan: readFileSync('90-day-plan.html', 'utf8'),
};

const combined = Object.values(files).join('\n');

const requiredCompanyMoment = [
  'LinkedIn-reported July 2026',
  '30 employees',
  '73% engineering',
  '200% engineering growth',
  '0.5-year median tenure',
  'estimates, not internal company data',
  'without slowing invention',
];
for (const fragment of requiredCompanyMoment) {
  assert.ok(files.site.includes(fragment) || files.brief.includes(fragment), `Missing company-moment evidence or caveat: ${fragment}`);
}

const requiredRoleCoverage = [
  'multi-year roadmap',
  'market research',
  'competitive analysis',
  'PRDs',
  'user stories',
  'acceptance criteria',
  'release readiness',
  'primary customer interface',
  'mechanical',
  'electrical',
  'firmware',
  'cloud',
  'UX',
  'culinary',
  'manufacturing',
  'commercial',
  'KPIs',
  'business case',
  'pricing',
  'executives',
  'investors',
  'partners',
  'live demos',
];
for (const fragment of requiredRoleCoverage) {
  assert.ok(combined.toLowerCase().includes(fragment.toLowerCase()), `Missing JD coverage across campaign: ${fragment}`);
}

for (const [name, text] of Object.entries({ site: files.site, resume: files.resume, cover: files.cover, brief: files.brief })) {
  assert.ok(text.includes('Prime Now'), `${name} must include Prime Now evidence`);
  assert.ok(text.includes('Whole Foods'), `${name} must include Whole Foods evidence`);
  assert.ok(text.includes('Food Safety Management'), `${name} must include Food Safety Management evidence`);
}

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

for (const forbidden of [
  'promising robotic makeline',
  'Vape-Jet · Direct',
  'Amazon · Direct',
  'Compunetics · Direct',
  'DudeWorth · Direct',
]) {
  assert.ok(!files.site.includes(forbidden), `Site retains rejected wording: ${forbidden}`);
}

assert.ok(files.resume.includes('How I Would Contribute'), 'Resume contribution section must be explicitly future-facing');
assert.ok(!files.resume.includes('Lab37 contribution'), 'Resume must not imply prior Lab37 employment');
assert.ok(files.brief.includes('Invention velocity vs. product continuity'), 'Interview brief must surface the hypergrowth operating tension');
assert.ok(files.brief.includes('first dedicated product manager'), 'Interview questions must test the product-management ownership hypothesis');
assert.ok(files.plan.includes('NSF / UL'), 'Entry plan must address the desirable certification landscape as a discovery workstream');
assert.ok(files.plan.includes('market and competitive evidence'), 'Entry plan must include market and competitive inputs to the roadmap');

for (const forbidden of ['710 employees', '0% Product Management', 'roleforge', 'russelldudek/Lab37', 'Public repository']) {
  assert.ok(!combined.toLowerCase().includes(forbidden.toLowerCase()), `Forbidden or ambiguous candidate-facing claim: ${forbidden}`);
}

console.log('Pre-send candidate alignment contract passed.');

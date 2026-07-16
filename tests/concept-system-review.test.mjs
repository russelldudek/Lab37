import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('concept-system.css', 'utf8');
const animation = readFileSync('animation-v4.js', 'utf8');
const vendorRuntime = readFileSync('assets/vendor/three.module.js', 'utf8');

const requiredHtml = [
  'href="concept-system.css"',
  'id="system"',
  'The Order-to-Outcome Trace',
  'Discovery hypothesis—not an asserted internal architecture.',
  'Lab37’s exact organizational relationship, reporting line, and product integrations are not fully documented in public sources.',
  'Served on the Amazon Prime Now launch team with Whole Foods',
  'earned a Food Safety Management certification while at Amazon',
  'Food fulfillment and safety under a customer promise',
  'Relevant system-level PM advantage',
  'Reuters · Atoms',
  'CloudKitchens',
  'Otter',
  'Picnic reporting',
  '10 · Application and interview materials',
];

for (const fragment of requiredHtml) {
  assert.ok(html.includes(fragment), `Missing required concept fragment: ${fragment}`);
}

for (const number of ['01','02','03','04','05','06','07','08','09','10']) {
  assert.ok(html.includes(`${number} ·`), `Missing section number ${number}`);
}

assert.ok(html.includes('data-status="hypothesis"><b>Lab37</b>'), 'Lab37 ecosystem relationship must remain labeled as a hypothesis');
assert.ok(html.includes('not fully documented in public sources'), 'Public uncertainty must be explicit');
assert.ok(!/Lab37 (is|operates as|belongs to|is owned by) (Atoms|City Storage Systems|CloudKitchens)/i.test(html), 'Do not state an unverified ownership or reporting relationship');

const requiredCss = [
  '.system-context-section',
  '.ecosystem-context',
  '.system-trace',
  '.system-decision',
  '.evidence-intersection',
  '@media(max-width:1100px)',
  '@media(max-width:800px)',
];

for (const fragment of requiredCss) {
  assert.ok(css.includes(fragment), `Missing responsive concept styling: ${fragment}`);
}

const combined = `${html}\n${css}`;
for (const forbidden of ['roleforge', 'russelldudek/Lab37', 'Public repository']) {
  assert.ok(!combined.toLowerCase().includes(forbidden.toLowerCase()), `Forbidden candidate-facing source reference: ${forbidden}`);
}

const externalSources = [...html.matchAll(/<a href="https:\/\/[^\"]+"[^>]*>/g)].map(match => match[0]);
assert.ok(externalSources.length >= 7, 'Expected public source and company links');
assert.ok(externalSources.filter(link => link.includes('target="_blank"')).every(link => link.includes('rel="noopener noreferrer"')), 'New-tab source links must use noopener noreferrer');

assert.ok(!/https?:\/\//.test(vendorRuntime), 'The local Three.js runtime must not delegate to a remote CDN');
const fallbackStart = animation.indexOf('startFallback(stage, reduceMotion, schedule)');
const runtimeAwait = animation.indexOf('await loadThree()');
assert.ok(fallbackStart >= 0 && runtimeAwait >= 0 && fallbackStart < runtimeAwait, 'The animated fallback must start before waiting for WebGL runtime loading');
assert.ok(animation.includes('stopFallback?.()'), 'The fallback loop must be stopped after WebGL becomes ready');

console.log('Concept-system review checks passed.');
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const resume = readFileSync('resume.html', 'utf8');
const cover = readFileSync('cover-letter.html', 'utf8');
const combined = `${resume}\n${cover}`;

for (const phrase of [
  'Prime Now launch team with Whole Foods',
  'Food Safety Management certification',
  'russelldudek.github.io/Lab37/',
]) {
  assert.ok(resume.includes(phrase), `Resume missing verified evidence: ${phrase}`);
  assert.ok(cover.includes(phrase), `Cover letter missing verified evidence: ${phrase}`);
}

assert.ok(resume.includes('How I Would Contribute'), 'Resume needs an explicitly prospective contribution heading');
assert.ok(!/Lab37\s+contributions?/i.test(combined), 'Documents must not imply Russell has already contributed to Lab37');
assert.ok(cover.includes('hypotheses for discovery—not claims about undisclosed Lab37 processes'), 'Cover letter must preserve the discovery-hypothesis boundary');

const credentialOrder = [
  'Google AI Essentials',
  'Food Safety Management Certification',
  'IBM Enterprise Design Thinking Practitioner',
  'Six Sigma Certification',
  'OSHA 10',
];
let previous = -1;
for (const credential of credentialOrder) {
  const index = resume.indexOf(credential);
  assert.ok(index > previous, `Credential order is incorrect at ${credential}`);
  previous = index;
}

for (const forbidden of ['roleforge', 'Public repository']) {
  assert.ok(!combined.toLowerCase().includes(forbidden.toLowerCase()), `Forbidden candidate-facing reference: ${forbidden}`);
}

console.log('Document evidence contract passed.');

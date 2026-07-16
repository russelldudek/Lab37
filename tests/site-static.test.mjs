import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../desktop-v3.css', import.meta.url), 'utf8');

assert.match(html, /desktop-v3\.css/, 'desktop correction stylesheet loads statically');
assert.match(html, /app-v3\.js/, 'decoupled controls bootstrap is active');
for (const layer of ['food', 'mechanics', 'software', 'operator', 'economics']) {
  assert.match(html, new RegExp(`data-layer="${layer}"`), `legend identifies ${layer}`);
}
for (const color of ['#ffb84d', '#f4f4f1', '#72d7ff', '#ff6b58', '#caff38']) {
  assert.ok(css.includes(color), `missing exact gate/legend color ${color}`);
}
for (const number of ['01', '02', '03', '04', '05']) {
  assert.match(html, new RegExp(`class="pilot-number"[^>]*>${number}<`), `missing explicit pilot number ${number}`);
}
assert.match(css, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/, 'desktop pilot cards use five columns');
assert.match(css, /object-position:center 78%/, 'blueprint crop favors the machine drawing');
assert.match(css, /pointer-events:auto/, 'desktop controls explicitly accept pointer input');
console.log('static site contract passed');

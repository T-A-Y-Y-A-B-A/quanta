// Post-build smoke test: every required section ships, and three.js stays out of the main bundle.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'

const html = readFileSync('dist/index.html', 'utf8')
for (const id of ['hero', 'product', 'features', 'how', 'pricing', 'testimonials', 'faq']) {
  assert.match(html, new RegExp(`id="${id}"`), `missing section #${id}`)
}
assert.match(html, /<header class="nav"/, 'missing navbar')
assert.match(html, /<footer class="footer"/, 'missing footer')
assert.equal(html.match(/<article class="plan[ "]/g)?.length, 3, 'expected exactly 3 pricing plans')
assert.equal(html.match(/<details name="faq"/g)?.length, 6, 'expected 6 FAQ items')

const js = readdirSync('dist/assets').filter((f) => f.endsWith('.js'))
const entry = html.match(/assets\/(index-[^"]+\.js)/)?.[1]
assert.ok(entry, 'entry script not found')
const kb = (f) => (statSync(`dist/assets/${f}`).size / 1024).toFixed(1)
assert.ok(js.length >= 2, 'three.js scene should be split into a lazy chunk')
assert.ok(statSync(`dist/assets/${entry}`).size < 30 * 1024, 'entry bundle should stay under 30 KB')
console.log('smoke ok →', js.map((f) => `${f} (${kb(f)} KB)`).join(', '))

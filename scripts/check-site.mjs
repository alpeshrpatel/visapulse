// @ts-check
/** Checks the built site: every page has the basics and every internal link resolves. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(import.meta.dirname, '..', 'dist')
if (!existsSync(OUT)) { console.error('dist/ not found; run the build first'); process.exit(1) }

/** @param {string} dir @returns {string[]} */
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? walk(path) : [path]
})
/** @param {string} href */
const resolves = (href) => {
  const path = decodeURI(href.split('#')[0].split('?')[0])
  if (!path) return true
  const target = join(OUT, path)
  return path.endsWith('/') ? existsSync(join(target, 'index.html')) : existsSync(target)
}

const errors = []
const htmlFiles = walk(OUT).filter((file) => file.endsWith('.html'))
let links = 0
for (const file of htmlFiles) {
  const page = file.slice(OUT.length)
  const html = readFileSync(file, 'utf8')
  if (!/<title>[^<]{10,}<\/title>/.test(html)) errors.push(`${page}: missing or very short <title>`)
  if (!/<meta name="description" content="[^"]{20,}">/.test(html)) errors.push(`${page}: missing meta description`)
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) errors.push(`${page}: expected exactly one <h1>`)
  if (!html.includes('Not legal advice')) errors.push(`${page}: disclaimer missing`)
  for (const bad of ['undefined', 'NaN', '[object Object]', 'null']) {
    if (new RegExp(`>[^<]*\\b${bad.replace(/[[\]]/g, '\\$&')}\\b[^<]*<`).test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) {
      errors.push(`${page}: suspicious text "${bad}"`)
    }
  }
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    links += 1
    if (!resolves(match[1])) errors.push(`${page}: broken link ${match[1]}`)
  }
}
if (errors.length) {
  console.error(`Site check failed (${errors.length}):\n  ${errors.slice(0, 40).join('\n  ')}`)
  process.exit(1)
}
console.log(`Site check passed: ${htmlFiles.length} pages, ${links} internal links.`)

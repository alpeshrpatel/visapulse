// @ts-check
/** Local preview: build, serve dist/ on http://localhost:4321, rebuild when sources change. */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, statSync, watch } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const OUT = join(ROOT, 'dist')
const PORT = Number(process.env.PORT) || 4321
/** @type {Record<string, string>} */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.csv': 'text/csv; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
}

let building = false
let queued = false
function rebuild() {
  if (building) { queued = true; return }
  building = true
  spawn(process.execPath, [join(ROOT, 'scripts', 'build-site.mjs')], { stdio: 'inherit' }).on('exit', () => {
    building = false
    if (queued) { queued = false; rebuild() }
  })
}
rebuild()
/** @type {NodeJS.Timeout | undefined} */
let timer
for (const dir of ['src', 'data/bulletins', 'public']) {
  if (existsSync(join(ROOT, dir))) {
    watch(join(ROOT, dir), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 150) })
  }
}

createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname))
  let file = join(OUT, path)
  if (!file.startsWith(OUT)) { response.writeHead(403).end(); return }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) {
    const notFound = join(OUT, '404.html')
    response.writeHead(404, { 'Content-Type': TYPES['.html'] }).end(existsSync(notFound) ? readFileSync(notFound) : 'Not found')
    return
  }
  response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }).end(readFileSync(file))
}).listen(PORT, () => console.log(`Preview: http://localhost:${PORT}`))

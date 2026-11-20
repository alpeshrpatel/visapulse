// @ts-check
/**
 * Minimal, dependency-free HTML table extractor.
 * It only understands table/tr/td/th tags, which is all a Visa Bulletin page
 * needs; everything else is treated as text. Nested tables are returned as
 * their own tables and do not leak text into the cell that contains them.
 */

/** @type {Record<string, string>} */
const NAMED_ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ndash: '–', mdash: '—' }

/** @param {string} text */
export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
    if (body[0] === '#') {
      const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole
  })
}

/** Strip tags, decode entities, collapse whitespace. @param {string} fragment */
export function toText(fragment) {
  return decodeEntities(fragment.replace(/<[^>]*>/g, ' '))
    .replace(/[\s ]+/g, ' ')
    .trim()
}

/**
 * @typedef {{ rows: string[][], before: string, index: number, depth: number }} ExtractedTable
 * `before` is the text between the previous top-level table and this one.
 */

/**
 * @param {string} html
 * @returns {ExtractedTable[]} tables in document order
 */
export function extractTables(html) {
  const source = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
  const tagPattern = /<(\/?)(table|tr|td|th)\b[^>]*>/gi
  /** @type {ExtractedTable[]} */
  const tables = []
  /** @type {{ rows: string[][], row: string[] | null, cell: { raw: string } | null, before: string, index: number, depth: number }[]} */
  const stack = []
  let cursor = 0
  let lastTopLevelEnd = 0

  /** @param {(typeof stack)[number]} table */
  const closeCell = (table) => {
    if (!table.cell) return
    ;(table.row ??= []).push(toText(table.cell.raw))
    table.cell = null
  }
  /** @param {(typeof stack)[number]} table */
  const closeRow = (table) => {
    if (table.row && table.row.length) table.rows.push(table.row)
    table.row = null
  }

  let match
  while ((match = tagPattern.exec(source))) {
    const top = stack.at(-1)
    if (top?.cell) top.cell.raw += source.slice(cursor, match.index)
    cursor = match.index + match[0].length
    const closing = match[1] === '/'
    const tag = match[2].toLowerCase()

    if (tag === 'table' && !closing) {
      stack.push({
        rows: [],
        row: null,
        cell: null,
        before: stack.length ? '' : toText(source.slice(lastTopLevelEnd, match.index)),
        index: match.index,
        depth: stack.length,
      })
      continue
    }
    if (!top) continue
    if (tag === 'table') {
      closeCell(top)
      closeRow(top)
      stack.pop()
      tables.push({ rows: top.rows, before: top.before, index: top.index, depth: top.depth })
      if (!stack.length) lastTopLevelEnd = cursor
    } else if (tag === 'tr') {
      closeCell(top)
      closeRow(top)
      if (!closing) top.row = []
    } else {
      closeCell(top)
      if (!closing) top.cell = { raw: '' }
    }
  }
  return tables.sort((a, b) => a.index - b.index)
}

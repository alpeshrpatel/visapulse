// @ts-check
/**
 * Tiny HTML templating: `html` escapes every interpolated value unless it is
 * already SafeHtml (the result of another `html` call or an explicit `raw`).
 */
export class SafeHtml {
  /** @param {string} value */
  constructor(value) { this.value = value }
  toString() { return this.value }
}

/** @param {unknown} value */
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** Mark trusted markup. Use only for strings this code base produced. @param {unknown} value */
export const raw = (value) => new SafeHtml(String(value))

/** @param {unknown} value @returns {string} */
function render(value) {
  if (value === null || value === undefined || value === false || value === true) return ''
  if (value instanceof SafeHtml) return value.value
  if (Array.isArray(value)) return value.map(render).join('')
  return escapeHtml(value)
}

/** @param {TemplateStringsArray} strings @param {...unknown} values */
export function html(strings, ...values) {
  let out = strings[0]
  for (let index = 0; index < values.length; index += 1) out += render(values[index]) + strings[index + 1]
  return new SafeHtml(out)
}

/** Serialise data for an inline <script type="application/json"> block. @param {unknown} data */
export function jsonForScript(data) {
  return raw(JSON.stringify(data).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029'))
}

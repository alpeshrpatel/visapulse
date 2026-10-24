import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const months = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]
const countryColumns = {
  allChargeabilityAreasExceptThoseListed: 'All Chargeability Areas Except Those Listed',
  chinaMainlandBorn: 'China-mainland born',
  india: 'India',
  mexico: 'Mexico',
  philippines: 'Philippines',
}
const countryKeysByName = Object.fromEntries(
  Object.entries(countryColumns).map(([key, value]) => [value.toLowerCase(), key]),
)
const monthNumbers = Object.fromEntries(months.map((month, index) => [month, index + 1]))

function normalizeDate(value, source) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (/^current$/i.test(normalized)) return 'Current'
  if (/^unavailable$/i.test(normalized)) return 'Unavailable'

  const cutoff = normalized.match(/^CUTOFF\s+([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/i)
  if (!cutoff) throw new Error(`Unrecognized visa date "${value}" in ${source}`)

  const date = new Date(`${cutoff[1]} ${cutoff[2]}, ${cutoff[3]} UTC`)
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid visa date "${value}" in ${source}`)
  return date.toISOString().slice(0, 10)
}

function parseCategory(raw) {
  const parts = raw.trim().split(/\s+/)
  const code = parts[0]
  const subcategory = parts[1]?.startsWith(`${code}_`) ? parts[1] : null
  const name = parts.slice(subcategory ? 3 : 2).join(' ')
  let key = code

  if (subcategory === 'EB3_OTHER') key = 'otherWorkers'
  else if (subcategory === 'EB4_RELIGIOUS') key = 'certainReligiousWorkers'
  else if (subcategory === 'EB5_C5_T5') key = 'EB5Unreserved'
  else if (subcategory === 'EB5_HIGH_UNEMPLOYMENT') key = 'EB5HighUnemployment'
  else if (subcategory === 'EB5_INFRASTRUCTURE') key = 'EB5Infrastructure'
  else if (subcategory === 'EB5_RURAL') key = 'EB5Rural'

  if (!/^(F1|F2A|F2B|F3|F4|EB[1-5])$/.test(code) || !name) {
    throw new Error(`Unrecognized visa category row: ${raw}`)
  }

  return { group: code.startsWith('F') ? 'familySponsored' : 'employmentBased', key, name }
}

function extractTableRows(markdown) {
  const rows = []
  let current = ''

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.startsWith('|')) {
      if (current) rows.push(current)
      current = line
    } else if (current && line) {
      current += ` ${line}`
    }

    if (current.endsWith('|') && (current.match(/\|/g) ?? []).length >= 5) {
      rows.push(current)
      current = ''
    }
  }
  if (current) rows.push(current)

  return rows
    .map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim().replace(/\s+/g, ' ')))
    .filter((cells) => cells.length === 4 && cells[0] && !/^Category$/i.test(cells[0]) && !/^---+$/.test(cells[0]))
}

function parseBulletin(markdown, year, month) {
  const monthName = month[0].toUpperCase() + month.slice(1)
  const sourceUrl = `https://www.visabulletin.ai/bulletins/${year}/${month}`
  const rows = extractTableRows(markdown)
  if (rows.length < 70 || rows.length > 75) {
    throw new Error(`${year}-${month}: expected 70-75 category-country rows, found ${rows.length}`)
  }

  const categories = { familySponsored: {}, employmentBased: {} }
  for (const [categoryText, countryName, finalAction, filing] of rows) {
    const countryKey = countryKeysByName[countryName.toLowerCase()]
    if (!countryKey) throw new Error(`${year}-${month}: unknown country column "${countryName}"`)

    const category = parseCategory(categoryText)
    const group = categories[category.group]
    const item = group[category.key] ??= {
      name: category.name,
      finalActionDates: {},
      datesForFiling: {},
    }
    if (item.name !== category.name) {
      throw new Error(`${year}-${month}: conflicting names for ${category.key}`)
    }
    if (item.finalActionDates[countryKey] || item.datesForFiling[countryKey]) {
      throw new Error(`${year}-${month}: duplicate ${category.key} / ${countryName} row`)
    }
    item.finalActionDates[countryKey] = normalizeDate(finalAction, sourceUrl)
    item.datesForFiling[countryKey] = normalizeDate(filing, sourceUrl)
  }

  const familyCodes = ['F1', 'F2A', 'F2B', 'F3', 'F4']
  for (const code of familyCodes) {
    if (!categories.familySponsored[code]) throw new Error(`${year}-${month}: missing family category ${code}`)
  }
  for (const group of Object.values(categories)) {
    for (const [code, item] of Object.entries(group)) {
      for (const countryKey of Object.keys(countryColumns)) {
        if (!(countryKey in item.finalActionDates) || !(countryKey in item.datesForFiling)) {
          throw new Error(`${year}-${month}: incomplete country data for ${code}`)
        }
      }
    }
  }

  const officialPathYear = year === 2026 && month === 'october' ? 2027 : year
  return {
    bulletin: {
      month: monthName,
      year,
      fiscalYear: monthNumbers[month] >= 10 ? year + 1 : year,
      officialSourceUrl: `https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/${officialPathYear}/visa-bulletin-for-${month}-${year}.html`,
      dataReferenceUrl: sourceUrl,
    },
    countryColumns,
    categories,
  }
}

async function delay(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function fetchBulletin(year, month) {
  const url = `https://r.jina.ai/http://www.visabulletin.ai/bulletins/${year}/${month}`
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, { headers: { Accept: 'text/plain' } })
    if (response.ok) return response.text()
    if (response.status !== 429 || attempt === 4) {
      throw new Error(`Failed to fetch ${year}-${month}: HTTP ${response.status}`)
    }
    await delay(15000 * attempt)
  }
  throw new Error(`Failed to fetch ${year}-${month}`)
}

const root = join(import.meta.dirname, '..', 'data', 'visa-bulletins')
let downloaded = 0
let skipped = 0

for (const year of [2025, 2026]) {
  const lastMonth = year === 2025 ? 12 : 11
  for (const month of months.slice(0, lastMonth)) {
    const monthNumber = String(monthNumbers[month]).padStart(2, '0')
    const filePath = join(root, String(year), `${year}-${monthNumber}.json`)
    if (existsSync(filePath)) {
      console.log(`Skipped existing ${year}-${monthNumber}.json`)
      skipped += 1
      continue
    }

    let bulletin
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const markdown = await fetchBulletin(year, month)
        bulletin = parseBulletin(markdown, year, month)
        break
      } catch (error) {
        if (attempt === 4) throw error
        console.warn(`${year}-${month}: ${error.message}; retrying (${attempt}/3)`)
        await delay(5000 * attempt)
      }
    }
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, `${JSON.stringify(bulletin, null, 2)}\n`)
    const categoryCount = Object.values(bulletin.categories).reduce((total, group) => total + Object.keys(group).length, 0)
    console.log(`Saved ${year}-${monthNumber}.json (${categoryCount} categories)`)
    downloaded += 1
    await delay(3200)
  }
}

console.log(`Complete: ${downloaded} downloaded, ${skipped} existing files preserved.`)

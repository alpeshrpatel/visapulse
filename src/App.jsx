import { lazy, Suspense, useEffect, useState } from 'react'
import {
  ArrowDownRight,
  ArrowDownToLine,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Globe2,
  Moon,
  Minus,
  Search,
  UsersRound,
  Sun,
} from 'lucide-react'
const bulletinModules = import.meta.glob('../data/visa-bulletins/**/*.json', {
  eager: true,
  import: 'default',
})
const bulletinsByPeriod = Object.fromEntries(
  Object.entries(bulletinModules)
    .map(([path, bulletin]) => [path.match(/(\d{4}-\d{2})\.json$/)?.[1], bulletin])
    .filter(([period]) => period),
)
const availablePeriods = Object.keys(bulletinsByPeriod).sort()
const today = new Date()
const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
const defaultPeriod = bulletinsByPeriod[currentPeriod]
  ? currentPeriod
  : availablePeriods.filter((period) => period <= currentPeriod).at(-1) ?? availablePeriods.at(-1)
const themeStorageKey = 'visa-visapulse-theme'
const legacyThemeStorageKey = 'visa-datebook-theme'
const HistoricalCutoffChart = lazy(() => import('./HistoricalCutoffChart.jsx'))

const countryKeys = Object.keys(bulletinsByPeriod[defaultPeriod].countryColumns)
const countryShortNames = {
  allChargeabilityAreasExceptThoseListed: 'All chargeability',
  chinaMainlandBorn: 'China',
  india: 'India',
  mexico: 'Mexico',
  philippines: 'Philippines',
}
const categoryLabels = {
  otherWorkers: 'EB3-OW',
  certainReligiousWorkers: 'SR',
  EB5: 'EB5-U',
  EB5Unreserved: 'EB5-U',
  EB5HighUnemployment: 'EB5-HU',
  EB5Infrastructure: 'EB5-I',
  EB5Rural: 'EB5-R',
}

function formatDate(value) {
  if (value === 'Current' || value === 'Unavailable') return value
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function formatPeriodLabel(period) {
  const [year, month] = period.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function getComparisonPeriod(period, mode) {
  if (mode === 'none') return null
  const [year, month] = period.split('-').map(Number)
  if (mode === 'year') return `${year - 1}-${String(month).padStart(2, '0')}`
  const previous = new Date(Date.UTC(year, month - 2, 1))
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`
}

function getComparableCategory(group, code) {
  if (!group) return undefined
  if (group[code]) return group[code]
  if (code === 'EB5Unreserved') return group.EB5
  if (code === 'EB5') return group.EB5Unreserved
  return undefined
}

function getDateChange(current, previous) {
  if (current === previous) return { label: 'No change', type: 'unchanged' }
  if (current === 'Current') return { label: 'Became current', type: 'advance' }
  if (current === 'Unavailable') return { label: 'Became unavailable', type: 'retrogression' }
  if (previous === 'Current') return { label: 'Cutoff introduced', type: 'retrogression' }
  if (previous === 'Unavailable') return { label: 'Now available', type: 'advance' }

  const days = Math.round((Date.parse(current) - Date.parse(previous)) / 86400000)
  if (days === 0) return { label: 'No change', type: 'unchanged' }
  return {
    label: `${days > 0 ? '+' : ''}${days}d`,
    type: days > 0 ? 'advance' : 'retrogression',
  }
}

function getNumericDateDelta(current, previous) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(current) || !/^\d{4}-\d{2}-\d{2}$/.test(previous)) return null
  return Math.round((Date.parse(current) - Date.parse(previous)) / 86400000)
}

function getBulletinMovements(current, previous) {
  if (!previous) return []
  return Object.entries(current.categories).flatMap(([group, categories]) =>
    Object.entries(categories).flatMap(([code, item]) => {
      const previousItem = getComparableCategory(previous.categories[group], code)
      if (!previousItem) return []
      return Object.entries(item.finalActionDates).flatMap(([country, value]) => {
        const previousValue = previousItem.finalActionDates[country]
        if (previousValue === undefined) return []
        return [{
          group,
          groupLabel: group === 'employmentBased' ? 'Employment-based' : 'Family-sponsored',
          code,
          categoryName: item.name,
          country,
          countryName: countryShortNames[country] ?? current.countryColumns[country],
          value,
          previousValue,
          movement: getDateChange(value, previousValue),
          days: getNumericDateDelta(value, previousValue),
        }]
      })
    }),
  )
}

function getHistoricalFlags(period, movements) {
  const periodIndex = availablePeriods.indexOf(period)
  const numericFlags = movements.flatMap((item) => {
    if (item.days === null || periodIndex < 3) return []
    const history = []
    for (let offset = 1; offset <= 3; offset += 1) {
      const historyIndex = periodIndex - offset
      const currentPeriod = bulletinsByPeriod[availablePeriods[historyIndex]]
      const previousPeriod = bulletinsByPeriod[availablePeriods[historyIndex - 1]]
      const currentValue = currentPeriod?.categories[item.group]?.[item.code]?.finalActionDates?.[item.country]
      const previousValue = previousPeriod?.categories[item.group]?.[item.code]?.finalActionDates?.[item.country]
      const delta = getNumericDateDelta(currentValue, previousValue)
      if (delta !== null) history.push(delta)
    }
    if (history.length < 2) return []
    const stableHistory = history.every((delta) => Math.abs(delta) <= 30)
    const sameDirection = history.every((delta) => Math.sign(delta) === Math.sign(history[0]))
    const isSpike = Math.abs(item.days) >= 90 && stableHistory
    const isReversal = Math.abs(item.days) >= 30 && sameDirection && Math.sign(item.days) !== Math.sign(history[0])
    if (!isSpike && !isReversal) return []
    return [{
      ...item,
      reason: isSpike
        ? `Shifted ${item.movement.label} after ${history.length} stable monthly changes`
        : `Reversed after ${history.length} consecutive ${history[0] > 0 ? 'advances' : 'retrogressions'}`,
      priority: isSpike ? Math.abs(item.days) : Math.abs(item.days) / Math.max(1, ...history.map(Math.abs)),
    }]
  })
  return numericFlags
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
}

function buildMonthlyInsights(period, bulletin) {
  const previousPeriod = getComparisonPeriod(period, 'month')
  const previousBulletin = bulletinsByPeriod[previousPeriod]
  const movements = getBulletinMovements(bulletin, previousBulletin)
  const sortByMagnitude = (a, b) => {
    if (a.days === null) return b.days === null ? 0 : -1
    if (b.days === null) return 1
    return Math.abs(b.days) - Math.abs(a.days)
  }
  const advances = movements.filter((item) => item.movement.type === 'advance').sort(sortByMagnitude)
  const retrogressions = movements.filter((item) => item.movement.type === 'retrogression').sort(sortByMagnitude)
  const countryStats = Object.keys(bulletin.countryColumns).map((country) => ({
    country,
    name: countryShortNames[country] ?? bulletin.countryColumns[country],
    advances: movements.filter((item) => item.country === country && item.movement.type === 'advance').length,
    retrogressions: movements.filter((item) => item.country === country && item.movement.type === 'retrogression').length,
    unchanged: movements.filter((item) => item.country === country && item.movement.type === 'unchanged').length,
  }))
  const unchangedCategories = Object.entries(bulletin.categories).flatMap(([group, categories]) =>
    Object.entries(categories).flatMap(([code, item]) => {
      const previousItem = getComparableCategory(previousBulletin?.categories[group], code)
      const unchanged = previousItem && Object.keys(item.finalActionDates).every(
        (country) => item.finalActionDates[country] === previousItem.finalActionDates[country],
      )
      return unchanged ? [{ group, code, name: categoryLabels[code] ?? code }] : []
    }),
  )
  const historicalFlags = getHistoricalFlags(period, movements)
  return {
    previousPeriod,
    movements,
    advances,
    retrogressions,
    unchangedCount: movements.filter((item) => item.movement.type === 'unchanged').length,
    unchangedCategories,
    countryStats,
    historicalFlags,
  }
}

function createExecutiveSummary(period, insights) {
  if (!insights.movements.length) {
    return `No prior monthly bulletin is available for ${formatPeriodLabel(period)}, so month-over-month movement is not shown.`
  }
  const advanceCount = insights.advances.length
  const retrogressionCount = insights.retrogressions.length
  const countriesByAdvances = [...insights.countryStats].sort((a, b) => b.advances - a.advances)
  const leader = countriesByAdvances[0]
  const lead = `${formatPeriodLabel(period)} recorded ${advanceCount} advancing, ${retrogressionCount} retrogressing, and ${insights.unchangedCount} unchanged Final Action cutoffs across ${insights.movements.length} country-category pairs.`
  const stillness = insights.unchangedCategories.length
    ? `${insights.unchangedCategories.length} categories were unchanged across all chargeability areas.`
    : ''
  const country = leader?.advances
    ? `${leader.name} led with ${leader.advances} advances.`
    : ''
  const exception = insights.historicalFlags[0]
    ? `Historical outlier: ${insights.historicalFlags[0].code} for ${insights.historicalFlags[0].countryName} ${insights.historicalFlags[0].reason.toLowerCase()}.`
    : ''
  return [lead, stillness, country, exception].filter(Boolean).join(' ')
}

function buildHistoricalCutoffData(period, group, code, chart, countries) {
  const endIndex = availablePeriods.indexOf(period)
  const periods = availablePeriods.slice(Math.max(0, endIndex - 23), endIndex + 1)
  return periods.map((bulletinPeriod) => {
    const bulletin = bulletinsByPeriod[bulletinPeriod]
    const item = getComparableCategory(bulletin.categories[group], code)
    const values = {}
    const statuses = {}
    for (const country of countries) {
      const value = item?.[chart]?.[country]
      values[country] = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? Date.parse(`${value}T00:00:00Z`)
        : null
      statuses[country] = value ?? 'Unavailable'
    }
    return { period: bulletinPeriod, values, statuses }
  })
}

function App() {
  const [period, setPeriod] = useState(defaultPeriod)
  const [preference, setPreference] = useState('employmentBased')
  const [chart, setChart] = useState('finalActionDates')
  const [trendChart, setTrendChart] = useState('finalActionDates')
  const [trendCategory, setTrendCategory] = useState('EB2')
  const [comparison, setComparison] = useState('month')
  const [country, setCountry] = useState('all')
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState(() =>
    localStorage.getItem(themeStorageKey) ?? localStorage.getItem(legacyThemeStorageKey) ?? 'dark',
  )
  const bulletinData = bulletinsByPeriod[period]
  const monthlyInsights = buildMonthlyInsights(period, bulletinData)
  const executiveSummary = createExecutiveSummary(period, monthlyInsights)
  const comparisonPeriod = getComparisonPeriod(period, comparison)
  const comparisonData = comparisonPeriod ? bulletinsByPeriod[comparisonPeriod] : null
  const categories = Object.entries(bulletinData.categories[preference])
  const selectedTrendCategory = categories.some(([code]) => code === trendCategory)
    ? trendCategory
    : categories[0]?.[0]
  const trendData = buildHistoricalCutoffData(period, preference, selectedTrendCategory, trendChart, countryKeys)
  const visibleCategories = categories.filter(([code, item]) =>
    `${code} ${item.name}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const allCategories = Object.values(bulletinData.categories).flatMap((group) => Object.values(group))
  const chartValues = allCategories.flatMap((item) => Object.values(item[chart]))
  const currentCount = chartValues.filter((value) => value === 'Current').length
  const dateCount = chartValues.length
  const isFamily = preference === 'familySponsored'
  const chartTitle = chart === 'finalActionDates' ? 'Final Action Dates' : 'Dates for Filing'
  const monthIndex = Number(period.slice(5, 7))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(themeStorageKey, theme)
    localStorage.removeItem(legacyThemeStorageKey)
  }, [theme])

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="visapulse home">
          <span className="brand-mark"><Globe2 size={18} strokeWidth={2.2} /></span>
          <span>visapulse<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-right">
          <span className="edition-label">IMMIGRATION DATA, MADE CLEAR</span>
          <a className="source-link" href={bulletinData.bulletin.officialSourceUrl} target="_blank" rel="noreferrer">
            Official bulletin <ArrowUpRight size={14} />
          </a>
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> MONTHLY VISA BULLETIN <span className="eyebrow-separator">/</span> FY {bulletinData.bulletin.fiscalYear}</div>
            <h1 id="page-title">{bulletinData.bulletin.month} <span>{bulletinData.bulletin.year}</span></h1>
            <p className="intro-subtitle">Priority dates, without the fine print.</p>
            <div className="intro-meta">
              <span><CalendarDays size={15} /> Published for {formatPeriodLabel(period)}</span>
              <span className="meta-divider" />
              <span><Globe2 size={15} /> 5 chargeability areas</span>
            </div>
          </div>
          <div className="intro-image" role="img" aria-label="Travel documents and luggage arranged for a journey">
            <div className="image-caption"><span>THE VISA BULLETIN</span><span>NO. {String(monthIndex).padStart(2, '0')} <i>—</i> {bulletinData.bulletin.year}</span></div>
            <div className="image-stamp">{bulletinData.bulletin.month.slice(0, 3).toUpperCase()}<br /><b>{String(bulletinData.bulletin.year).slice(-2)}</b></div>
            <div className="image-bottomline"><span>UNITED STATES</span><span>FISCAL YEAR {bulletinData.bulletin.fiscalYear}</span></div>
          </div>
        </section>

        <section className="overview" aria-label="Bulletin overview">
          <div className="overview-heading">
            <span className="section-kicker">THIS ISSUE</span>
            <span className="overview-note">One month. Every preference lane.</span>
          </div>
          <div className="metrics">
            <div className="metric metric-featured">
              <span className="metric-label">PREFERENCE CATEGORIES</span>
              <span className="metric-number">{allCategories.length.toString().padStart(2, '0')}</span>
              <span className="metric-foot">Family + employment</span>
            </div>
            <div className="metric">
              <span className="metric-label">DATES MARKED CURRENT</span>
              <span className="metric-number">{currentCount}<small> / {dateCount}</small></span>
              <span className="metric-foot">In the selected date chart</span>
            </div>
            <div className="metric metric-note">
              <span className="metric-icon"><CircleHelp size={17} /></span>
              <span className="metric-label">READING THE DATES</span>
              <span className="metric-foot">A date earlier than the cutoff may be eligible. “Current” means no cutoff date is listed.</span>
            </div>
          </div>
        </section>

        <section className="insights-section" aria-labelledby="insights-title">
          <div className="insights-heading">
            <div>
              <span className="section-kicker">THE MONTH IN CONTEXT</span>
              <h2 id="insights-title">Bulletin insights<span>.</span></h2>
            </div>
            <span className="insights-period">
              {monthlyInsights.previousPeriod
                ? `VS ${formatPeriodLabel(monthlyInsights.previousPeriod).toUpperCase()}`
                : 'NO PRIOR BULLETIN'}
            </span>
          </div>

          <article className="executive-summary" aria-labelledby="executive-summary-title">
            <div className="executive-summary-heading">
              <div>
                <span className="section-kicker">MONTHLY EXECUTIVE SUMMARY</span>
                <h3 id="executive-summary-title">Executive summary</h3>
              </div>
              <span className="summary-period">{formatPeriodLabel(period)}</span>
            </div>
            <p>{executiveSummary}</p>
            <span className="summary-method">Based on published Final Action cutoffs. Informational only, not legal advice.</span>
          </article>

          <div className="insights-grid">
            <article className="insight-panel mover-panel" aria-labelledby="movers-title">
              <div className="insight-panel-heading">
                <div>
                  <span className="section-kicker">MONTH OVER MONTH</span>
                  <h3 id="movers-title">Biggest advances and retrogressions</h3>
                </div>
                <span className="insight-count">{monthlyInsights.movements.length} cutoffs</span>
              </div>
              <div className="mover-columns">
                {[
                  ['ADVANCES', monthlyInsights.advances, 'advance'],
                  ['RETROGRESSIONS', monthlyInsights.retrogressions, 'retrogression'],
                ].map(([heading, items, direction]) => (
                  <section className="mover-list" key={heading} aria-label={heading}>
                    <h4>{heading}</h4>
                    {items.length ? (
                      <ul>
                        {items.slice(0, 4).map((item) => (
                          <li key={`${item.group}-${item.code}-${item.country}`}>
                            <span className="mover-category">{categoryLabels[item.code] ?? item.code}</span>
                            <span className="mover-country">{item.countryName}</span>
                            <span className={`mover-value change-${direction}`}>{item.movement.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="insight-empty">No {heading.toLowerCase()} this month.</p>}
                  </section>
                ))}
              </div>
            </article>

            <article className="insight-panel country-panel" aria-labelledby="country-insights-title">
              <div className="insight-panel-heading">
                <div>
                  <span className="section-kicker">FIVE CHARGEABILITY AREAS</span>
                  <h3 id="country-insights-title">Country-wise cutoff movement</h3>
                </div>
              </div>
              <div className="country-table-scroll">
                <table className="country-insight-table">
                  <thead><tr><th scope="col">AREA</th><th scope="col">ADV.</th><th scope="col">RETRO.</th><th scope="col">NO MOVE</th></tr></thead>
                  <tbody>
                    {monthlyInsights.countryStats.map((item) => (
                      <tr key={item.country}>
                        <th scope="row">{item.name}</th>
                        <td className="country-advance-count">{item.advances}</td>
                        <td className="country-retrogression-count">{item.retrogressions}</td>
                        <td>{item.unchanged}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="panel-footnote">Counts out of 15 preference categories per area.</p>
            </article>

            <article className="insight-panel unchanged-panel" aria-labelledby="unchanged-title">
              <div className="insight-panel-heading">
                <div>
                  <span className="section-kicker">ALL FIVE AREAS</span>
                  <h3 id="unchanged-title">Categories with no movement</h3>
                </div>
                <span className="insight-count">{monthlyInsights.unchangedCategories.length}</span>
              </div>
              {monthlyInsights.unchangedCategories.length ? (
                <ul className="unchanged-list">
                  {monthlyInsights.unchangedCategories.map((item) => (
                    <li key={`${item.group}-${item.code}`}>
                      <span className="mover-category">{item.name}</span>
                      <span>{item.group === 'employmentBased' ? 'Employment' : 'Family'}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="insight-empty">No category held steady across all five areas.</p>}
            </article>

            <article className="insight-panel history-panel" aria-labelledby="history-title">
              <div className="insight-panel-heading">
                <div>
                  <span className="section-kicker">VS. RECENT HISTORY</span>
                  <h3 id="history-title">Unexpected trend changes</h3>
                </div>
                <span className="insight-count">{monthlyInsights.historicalFlags.length}</span>
              </div>
              <p className="panel-footnote">Large cutoff jumps after stable months, or reversals after consecutive moves.</p>
              {monthlyInsights.historicalFlags.length ? (
                <ul className="history-list">
                  {monthlyInsights.historicalFlags.map((item) => (
                    <li key={`${item.group}-${item.code}-${item.country}`}>
                      <div><span className="mover-category">{categoryLabels[item.code] ?? item.code}</span><span>{item.countryName}</span></div>
                      <strong className={item.days > 0 ? 'country-advance-count' : 'country-retrogression-count'}>{item.movement.label}</strong>
                      <p>{item.reason}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="insight-empty">No cutoff changes met the historical outlier rules this month.</p>}
            </article>
          </div>
        </section>

        <section className="trend-section" aria-labelledby="trend-heading">
          <div className="trend-heading">
            <div>
              <span className="section-kicker">HISTORICAL CUTOFFS</span>
              <h2 id="trend-heading">Two years of movement<span>.</span></h2>
            </div>
            <span className="trend-window">
              {trendData.length > 1
                ? `${formatPeriodLabel(trendData[0].period)} to ${formatPeriodLabel(trendData.at(-1).period)}`
                : 'More monthly data needed'}
            </span>
          </div>

          <div className="trend-controls">
            <label className="trend-category-picker">
              <span className="section-kicker">CATEGORY</span>
              <select
                aria-label="Historical chart category"
                value={selectedTrendCategory}
                onChange={(event) => setTrendCategory(event.target.value)}
              >
                {categories.map(([code]) => (
                  <option key={code} value={code}>{categoryLabels[code] ?? code}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
            <div className="chart-switch" role="group" aria-label="Historical chart dates">
              <button
                className={trendChart === 'finalActionDates' ? 'is-selected' : ''}
                type="button"
                aria-pressed={trendChart === 'finalActionDates'}
                onClick={() => setTrendChart('finalActionDates')}
              >Final Action</button>
              <button
                className={trendChart === 'datesForFiling' ? 'is-selected' : ''}
                type="button"
                aria-pressed={trendChart === 'datesForFiling'}
                onClick={() => setTrendChart('datesForFiling')}
              >Dates for Filing</button>
            </div>
          </div>

          <div className="trend-chart" aria-label="Historical cutoff dates by chargeability area">
            {trendData.length > 1 ? (
              <Suspense fallback={<p className="trend-empty">Loading historical chart...</p>}>
                <HistoricalCutoffChart data={trendData} countries={countryKeys} countryNames={countryShortNames} />
              </Suspense>
            ) : (
              <p className="trend-empty">Choose a later bulletin month to see historical cutoff movement.</p>
            )}
          </div>
          <p className="trend-note">
            {preference === 'employmentBased' ? 'Employment-based' : 'Family-sponsored'} {categoryLabels[selectedTrendCategory] ?? selectedTrendCategory} across all five chargeability areas. Cutoff values are dates; “Current” and “Unavailable” appear as gaps and are identified in the tooltip.
          </p>
        </section>

        <section className="data-section" aria-labelledby="data-heading">
          <div className="data-heading-row">
            <div>
              <span className="section-kicker">THE DATES</span>
              <h2 id="data-heading">Find your category<span>.</span></h2>
            </div>
            <div className="data-actions">
              <label className="period-picker">
                <CalendarDays size={15} />
                <span className="sr-only">Select bulletin month</span>
                <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                  {availablePeriods.map((availablePeriod) => (
                    <option key={availablePeriod} value={availablePeriod}>{formatPeriodLabel(availablePeriod)}</option>
                  ))}
                </select>
                <ChevronDown className="select-chevron" size={14} />
              </label>
              <a className="download-button" href={`/data/visa-bulletins/${bulletinData.bulletin.year}/${period}.json`} download={`${period}-visa-bulletin.json`}>
              <ArrowDownToLine size={16} /> <span>Download data</span>
              </a>
            </div>
          </div>
          <div className="trend-legend" aria-label="Chargeability area chart legend">
            {countryKeys.map((key, index) => (
              <span className="trend-legend-item" key={key}>
                <span className="trend-legend-line" style={{ '--series-color': `var(--chart-series-${index + 1})` }} />
                {countryShortNames[key]}
              </span>
            ))}
          </div>

          <div className="control-bar">
            <div className="preference-tabs" role="tablist" aria-label="Preference type">
              <button
                id="employment-tab"
                className={`preference-tab ${!isFamily ? 'is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={!isFamily}
                aria-controls="category-panel"
                onClick={() => setPreference('employmentBased')}
              >
                <BriefcaseBusiness size={16} /> Employment-based <span className="tab-count">10</span>
              </button>
              <button
                id="family-tab"
                className={`preference-tab ${isFamily ? 'is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={isFamily}
                aria-controls="category-panel"
                onClick={() => setPreference('familySponsored')}
              >
                <UsersRound size={16} /> Family-sponsored <span className="tab-count">05</span>
              </button>
            </div>
            <div className="control-tools">
              <div className="chart-switch" role="group" aria-label="Date chart">
                <button className={chart === 'finalActionDates' ? 'is-selected' : ''} type="button" aria-pressed={chart === 'finalActionDates'} onClick={() => setChart('finalActionDates')}>Final Action</button>
                <button className={chart === 'datesForFiling' ? 'is-selected' : ''} type="button" aria-pressed={chart === 'datesForFiling'} onClick={() => setChart('datesForFiling')}>Dates for Filing</button>
              </div>
              <label className="country-select-wrap">
                <span className="sr-only">Filter by country or chargeability</span>
                <select value={country} onChange={(event) => setCountry(event.target.value)}>
                  <option value="all">All countries</option>
                  {countryKeys.map((key) => <option key={key} value={key}>{bulletinData.countryColumns[key]}</option>)}
                </select>
                <ChevronDown className="select-chevron" size={14} />
              </label>
              <label className="country-select-wrap comparison-select-wrap">
                <span className="sr-only">Compare dates</span>
                <select value={comparison} onChange={(event) => setComparison(event.target.value)}>
                  <option value="none">No comparison</option>
                  <option value="month">Month over month</option>
                  <option value="year">Year over year</option>
                </select>
                <ChevronDown className="select-chevron" size={14} />
              </label>
            </div>
          </div>

          <div className="table-toolbar">
            <div className="table-context">
              <span className="context-dot" />
              <span>{isFamily ? 'FAMILY-SPONSORED' : 'EMPLOYMENT-BASED'}</span>
              <span className="context-divider">/</span>
              <span>{chartTitle.toUpperCase()}</span>
              {comparison !== 'none' && <><span className="context-divider">/</span><span>{comparisonData ? `VS ${formatPeriodLabel(comparisonPeriod).toUpperCase()}` : 'NO PRIOR BULLETIN'}</span></>}
            </div>
            <div className="search-box">
              <Search size={15} />
              <input aria-label="Search preference categories" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search categories" />
              {query && <button type="button" className="clear-search" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
            </div>
          </div>

          <div className="table-scroll" id="category-panel" role="tabpanel" aria-labelledby={isFamily ? 'family-tab' : 'employment-tab'}>
            <table className="date-table">
              <thead>
                <tr>
                  <th className="category-heading">PREFERENCE CATEGORY</th>
                  {(country === 'all' ? countryKeys : [country]).map((key) => (
                    <th key={key} title={bulletinData.countryColumns[key]}>{countryShortNames[key]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleCategories.map(([code, item], index) => (
                  <tr key={code} style={{ '--row-index': index }}>
                    <th scope="row" className="category-cell">
                      <span className={`category-code ${isFamily ? 'family-code' : 'employment-code'}`}>{categoryLabels[code] ?? code}</span>
                      <span className="category-name">{item.name}</span>
                    </th>
                    {(country === 'all' ? countryKeys : [country]).map((key) => {
                      const value = item[chart][key]
                      const previousItem = getComparableCategory(comparisonData?.categories[preference], code)
                      const previousValue = previousItem?.[chart]?.[key]
                      const change = previousValue === undefined ? null : getDateChange(value, previousValue)
                      return (
                        <td key={key}>
                          <div className="date-cell">
                            {value === 'Current' ? (
                              <span className="current-date"><Check size={13} strokeWidth={2.4} /> Current</span>
                            ) : (
                              <span className={value === 'Unavailable' ? 'unavailable-date' : 'cutoff-date'}>{formatDate(value)}</span>
                            )}
                            {change && (
                              <span
                                className={`date-change change-${change.type}`}
                                title={`${change.label}${comparisonData ? ` vs ${formatDate(previousValue)}` : ''}`}
                              >
                                {change.type === 'advance' ? <ArrowUpRight size={11} /> : change.type === 'retrogression' ? <ArrowDownRight size={11} /> : <Minus size={11} />}
                                {change.label}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {visibleCategories.length === 0 && (
                  <tr><td className="empty-state" colSpan={(country === 'all' ? countryKeys.length : 1) + 1}>No categories match “{query}”. Try another search.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Showing {visibleCategories.length} of {categories.length} categories</span>
            <a href={bulletinData.bulletin.officialSourceUrl} target="_blank" rel="noreferrer">View source bulletin <ArrowUpRight size={13} /></a>
          </div>
        </section>

        <details className="archive-reference">
          <summary>
            <span className="archive-reference-title">Official bulletin references</span>
            <span className="archive-reference-count">{availablePeriods.length} MONTHLY LINKS <ChevronDown size={15} /></span>
          </summary>
          <div className="archive-reference-years">
            {[...new Set(availablePeriods.map((availablePeriod) => availablePeriod.slice(0, 4)))].reverse().map((year) => (
              <section className="archive-reference-year" key={year} aria-labelledby={`archive-year-${year}`}>
                <h3 id={`archive-year-${year}`}>{year}</h3>
                <nav aria-label={`${year} official visa bulletins`}>
                  {[...availablePeriods].reverse().filter((availablePeriod) => availablePeriod.startsWith(year)).map((availablePeriod) => {
                    const source = bulletinsByPeriod[availablePeriod].bulletin.officialSourceUrl
                    return (
                      <a key={availablePeriod} href={source} target="_blank" rel="noreferrer" aria-current={availablePeriod === period ? 'page' : undefined}>
                        {formatPeriodLabel(availablePeriod)} <ArrowUpRight size={12} />
                      </a>
                    )
                  })}
                </nav>
              </section>
            ))}
          </div>
        </details>

        <footer className="page-footer">
          <span className="footer-brand">visapulse<span>.</span></span>
          <span>Dates are shown as published for {formatPeriodLabel(period)}. Always confirm with the official bulletin.</span>
          <span className="footer-edition">FY {bulletinData.bulletin.fiscalYear} <i>•</i> ISSUE {String(monthIndex).padStart(2, '0')}</span>
        </footer>
      </main>
    </div>
  )
}

export default App

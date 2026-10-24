import { useEffect, useState } from 'react'
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
const defaultPeriod = bulletinsByPeriod['2026-10'] ? '2026-10' : availablePeriods.at(-1)
const themeStorageKey = 'visa-visapulse-theme'
const legacyThemeStorageKey = 'visa-datebook-theme'

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

function App() {
  const [period, setPeriod] = useState(defaultPeriod)
  const [preference, setPreference] = useState('employmentBased')
  const [chart, setChart] = useState('finalActionDates')
  const [comparison, setComparison] = useState('month')
  const [country, setCountry] = useState('all')
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState(() =>
    localStorage.getItem(themeStorageKey) ?? localStorage.getItem(legacyThemeStorageKey) ?? 'dark',
  )
  const bulletinData = bulletinsByPeriod[period]
  const comparisonPeriod = getComparisonPeriod(period, comparison)
  const comparisonData = comparisonPeriod ? bulletinsByPeriod[comparisonPeriod] : null
  const categories = Object.entries(bulletinData.categories[preference])
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

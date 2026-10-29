import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatPeriodLabel(period) {
  const [year, month] = period.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function CutoffTrendTooltip({ active, label, trendData, countries, countryNames }) {
  if (!active || !label) return null
  const point = trendData.find((item) => item.period === label)
  if (!point) return null
  return (
    <div className="trend-tooltip">
      <strong>{formatPeriodLabel(point.period)}</strong>
      <ul>
        {countries.map((country, index) => (
          <li key={country}>
            <span className="trend-tooltip-dot" style={{ '--series-color': `var(--chart-series-${index + 1})` }} />
            <span>{countryNames[country]}</span>
            <b>{point.statuses[country] === 'Current' || point.statuses[country] === 'Unavailable'
              ? point.statuses[country]
              : formatDate(point.statuses[country])}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatAxisDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export default function HistoricalCutoffChart({ data, countries, countryNames }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 12, left: 4, bottom: 3 }} accessibilityLayer>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="period"
          tickFormatter={(value) => formatAxisDate(Date.parse(`${value}-01T00:00:00Z`))}
          interval="preserveStartEnd"
          padding={{ left: 6, right: 30 }}
          tickLine={false}
          axisLine={false}
          stroke="var(--chart-axis)"
          tick={{ fill: 'var(--text-caption)', fontSize: 12 }}
          minTickGap={24}
        />
        <YAxis
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatAxisDate}
          tickLine={false}
          axisLine={false}
          stroke="var(--chart-axis)"
          tick={{ fill: 'var(--text-caption)', fontSize: 12 }}
          width={66}
        />
        <Tooltip
          cursor={{ stroke: 'var(--chart-grid)', strokeDasharray: '3 3' }}
          content={({ active, label }) => (
            <CutoffTrendTooltip
              active={active}
              label={label}
              trendData={data}
              countries={countries}
              countryNames={countryNames}
            />
          )}
        />
        {countries.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={(point) => point.values[key]}
            name={countryNames[key]}
            stroke={`var(--chart-series-${index + 1})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
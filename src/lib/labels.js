// @ts-check
/**
 * Display vocabulary: the chargeability areas and preference "lines" the site
 * has pages for, and how each line is found in records from different eras.
 */

/** @typedef {'familySponsored' | 'employmentBased'} Group */
/** @typedef {'finalActionDates' | 'datesForFiling'} Chart */

export const CHARTS = /** @type {const} */ ([
  { key: 'finalActionDates', name: 'Final Action Dates', short: 'Final Action', slug: 'final-action' },
  { key: 'datesForFiling', name: 'Dates for Filing', short: 'Dates for Filing', slug: 'dates-for-filing' },
])

export const GROUPS = /** @type {const} */ ([
  { key: 'employmentBased', name: 'Employment-based', slug: 'employment' },
  { key: 'familySponsored', name: 'Family-sponsored', slug: 'family' },
])

export const AREAS = Object.freeze([
  { key: 'all', slug: 'all-chargeability', name: 'All Chargeability', longName: 'All Chargeability Areas Except Those Listed' },
  { key: 'china', slug: 'china', name: 'China', longName: 'China (mainland-born)' },
  { key: 'india', slug: 'india', name: 'India', longName: 'India' },
  { key: 'mexico', slug: 'mexico', name: 'Mexico', longName: 'Mexico' },
  { key: 'philippines', slug: 'philippines', name: 'Philippines', longName: 'Philippines' },
])

/**
 * `candidates` lists record keys that carry this line, newest naming first.
 * EB-5 was one line until 2015, split by regional center until 2022, and has
 * had an unreserved line plus three set-asides since; the unreserved page
 * follows that lineage and says so.
 * @type {readonly { key: string, group: Group, slug: string, code: string, name: string, candidates: string[], note?: string }[]}
 */
export const LINES = Object.freeze([
  { key: 'EB1', group: 'employmentBased', slug: 'eb1', code: 'EB-1', name: 'Priority workers', candidates: ['EB1'] },
  { key: 'EB2', group: 'employmentBased', slug: 'eb2', code: 'EB-2', name: 'Advanced-degree professionals and persons of exceptional ability', candidates: ['EB2'] },
  { key: 'EB3', group: 'employmentBased', slug: 'eb3', code: 'EB-3', name: 'Skilled workers and professionals', candidates: ['EB3'] },
  { key: 'EB3OW', group: 'employmentBased', slug: 'eb3-other-workers', code: 'EB-3 Other Workers', name: 'Other (unskilled) workers', candidates: ['EB3OW'] },
  { key: 'EB4', group: 'employmentBased', slug: 'eb4', code: 'EB-4', name: 'Certain special immigrants', candidates: ['EB4'] },
  { key: 'EB4SR', group: 'employmentBased', slug: 'eb4-religious-workers', code: 'EB-4 Religious Workers', name: 'Certain religious workers', candidates: ['EB4SR'] },
  {
    key: 'EB5Unreserved', group: 'employmentBased', slug: 'eb5-unreserved', code: 'EB-5 Unreserved', name: 'Investors, unreserved',
    candidates: ['EB5Unreserved', 'EB5NRC', 'EB5'],
    note: 'History before May 2022 follows the non-regional-center line, and before October 2015 the single fifth-preference line.',
  },
  { key: 'EB5Rural', group: 'employmentBased', slug: 'eb5-rural', code: 'EB-5 Rural', name: 'Investors, rural set-aside', candidates: ['EB5Rural'] },
  { key: 'EB5HighUnemployment', group: 'employmentBased', slug: 'eb5-high-unemployment', code: 'EB-5 High Unemployment', name: 'Investors, high-unemployment set-aside', candidates: ['EB5HighUnemployment'] },
  { key: 'EB5Infrastructure', group: 'employmentBased', slug: 'eb5-infrastructure', code: 'EB-5 Infrastructure', name: 'Investors, infrastructure set-aside', candidates: ['EB5Infrastructure'] },
  { key: 'F1', group: 'familySponsored', slug: 'f1', code: 'F1', name: 'Unmarried sons and daughters of U.S. citizens', candidates: ['F1'] },
  { key: 'F2A', group: 'familySponsored', slug: 'f2a', code: 'F2A', name: 'Spouses and children of permanent residents', candidates: ['F2A'] },
  { key: 'F2B', group: 'familySponsored', slug: 'f2b', code: 'F2B', name: 'Unmarried sons and daughters (21 or older) of permanent residents', candidates: ['F2B'] },
  { key: 'F3', group: 'familySponsored', slug: 'f3', code: 'F3', name: 'Married sons and daughters of U.S. citizens', candidates: ['F3'] },
  { key: 'F4', group: 'familySponsored', slug: 'f4', code: 'F4', name: 'Brothers and sisters of adult U.S. citizens', candidates: ['F4'] },
])

/** @param {string} key */
export const lineByKey = (key) => LINES.find((line) => line.key === key)
/** @param {string} slug */
export const lineBySlug = (slug) => LINES.find((line) => line.slug === slug)
/** @param {string} key */
export const areaByKey = (key) => AREAS.find((area) => area.key === key)
/** @param {string} slug */
export const areaBySlug = (slug) => AREAS.find((area) => area.slug === slug)
/** @param {Group} group */
export const linesInGroup = (group) => LINES.filter((line) => line.group === group)

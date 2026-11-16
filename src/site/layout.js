// @ts-check
import { OFFICIAL_LINKS, urls } from './format.js'
import { html, jsonForScript, raw } from './html.js'

/**
 * @typedef {{
 *   siteUrl: string | null, assets: { css: string, js: string, plannerJs?: string, plannerCss?: string },
 *   feedbackEndpoint: string | null, hasFeed: boolean, buildDate: string,
 * }} SiteContext
 */

const NAV = [
  { href: urls.home, label: 'Latest bulletin', key: 'home' },
  { href: urls.lines, label: 'Priority dates', key: 'lines' },
  { href: urls.planner, label: 'Planner', key: 'planner' },
  { href: urls.archive, label: 'Archive', key: 'archive' },
  { href: urls.about, label: 'About', key: 'about' },
]

// Runs before first paint so the saved theme never flashes.
const THEME_SCRIPT = "(function(){try{var t=localStorage.getItem('visa-visapulse-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}})()"

/**
 * @param {{
 *   site: SiteContext, path: string, title: string, description: string, nav?: string,
 *   body: import('./html.js').SafeHtml, head?: import('./html.js').SafeHtml, jsonLd?: object, noindex?: boolean,
 * }} page
 */
export function layout({ site, path, title, description, nav, body, head, jsonLd, noindex }) {
  const canonical = site.siteUrl ? `${site.siteUrl}${path}` : null
  const fullTitle = path === urls.home ? title : `${title} | VisaPulse`
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${description}">
${noindex ? raw('<meta name="robots" content="noindex">') : ''}
${canonical ? html`<link rel="canonical" href="${canonical}">
<meta property="og:url" content="${canonical}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="VisaPulse">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#f4f8f9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#10161d" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${site.hasFeed ? html`<link rel="alternate" type="application/atom+xml" title="VisaPulse: new Visa Bulletins" href="${urls.feed}">` : ''}
<script>${raw(THEME_SCRIPT)}</script>
<link rel="stylesheet" href="${site.assets.css}">
${head ?? ''}
${jsonLd ? html`<script type="application/ld+json">${jsonForScript(jsonLd)}</script>` : ''}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${urls.home}" aria-label="VisaPulse home"><span class="brand-mark" aria-hidden="true"></span>visapulse<span class="brand-dot">.</span></a>
    <nav class="site-nav" aria-label="Main">
      ${NAV.map((item) => html`<a href="${item.href}"${item.key === nav ? raw(' aria-current="page"') : ''}>${item.label}</a>`)}
    </nav>
    <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch between light and dark theme">
      <span aria-hidden="true">◐</span>
    </button>
  </div>
</header>
<main id="main" class="wrap">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-inner">
    <p class="disclaimer"><strong>Not legal advice.</strong> VisaPulse is an independent information site, not affiliated with the U.S. Department of State or USCIS. Cut-off dates can change or retrogress. Always confirm on the <a href="${OFFICIAL_LINKS.bulletinIndex}" rel="noopener">official Visa Bulletin</a> and with <a href="${OFFICIAL_LINKS.uscisCharts}" rel="noopener">USCIS</a> before you act, and talk to a qualified immigration attorney about your case.</p>
    <nav class="footer-nav" aria-label="Footer">
      <a href="${urls.methodology}">Sources and method</a>
      <a href="${urls.data}">Open data</a>
      ${site.hasFeed ? html`<a href="${urls.feed}">Feed</a>` : ''}
      <a href="${urls.disclaimer}">Disclaimer</a>
      <a href="${urls.privacy}">Privacy</a>
      <a href="${urls.about}">About</a>
    </nav>
    ${site.feedbackEndpoint ? html`<details class="feedback" data-feedback data-endpoint="${site.feedbackEndpoint}">
      <summary>Send feedback</summary>
      <form class="feedback-form" novalidate>
        <label>Your feedback<textarea name="message" rows="4" required maxlength="4000"></textarea></label>
        <label>Email (optional, only if you want a reply)<input type="email" name="email" autocomplete="email" maxlength="200"></label>
        <label class="hp" aria-hidden="true">Leave this empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
        <button type="submit">Send</button>
        <p class="feedback-status" role="status" aria-live="polite"></p>
      </form>
    </details>` : ''}
    <p class="fineprint">Cut-off dates are U.S. government data in the public domain. Site built ${site.buildDate}.</p>
  </div>
</footer>
<script src="${site.assets.js}" defer></script>
</body>
</html>
`
}

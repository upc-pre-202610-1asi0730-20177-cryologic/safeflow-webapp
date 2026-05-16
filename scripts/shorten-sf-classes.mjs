/**
 * One-shot: shorten long sf-* BEM class names across src/**/*.vue and src/**/*.css.
 * Keeps shell layout + global design tokens unchanged.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'src')

const SAFE_EXACT = new Set([
  'sf-shell',
  'sf-main',
  'sf-main--dash-typography',
  'sf-content',
  'sf-content--dash-typography',
  'sf-topbar',
  'sf-topbar--dash-typography',
  'sf-topbar--no-title',
  'sf-fade',
  'sf-fade-enter-active',
  'sf-fade-enter-from',
  'sf-fade-leave-active',
  'sf-fade-leave-to',
  'sf-ui-text',
  'sf-sidebar',
  'sf-sidebar--collapsed',
  'sf-nav-link',
  'sf-nav-link--active',
  'sf-toggle',
  'sf-dash-title',
  'sf-dash-subtitle',
  'sf-dash-body',
  'sf-dash-table',
  'sf-dash-kpi-value',
  'sf-dash-mon-card-title',
])

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (/\.(vue|css)$/.test(e.name)) acc.push(p)
  }
  return acc
}

function flat(rest) {
  return rest.replace(/__/g, '-').replace(/--/g, '-')
}

/** @param {string} token */
function mapToken(token) {
  if (SAFE_EXACT.has(token)) return token
  if (token.startsWith('sf-dash-')) return token
  if (token === 'sf-ui-text') return token

  if (token.startsWith('sf-lns')) {
    if (token === 'sf-lns') return 'shp-page'
    if (token === 'sf-lns--light-form') return 'shp-page-light'
    return 'shp-' + flat(token.slice(6))
  }
  if (token.startsWith('sf-lnd')) {
    if (token === 'sf-lnd') return 'dst-page'
    if (token === 'sf-lnd--light-form') return 'dst-page-light'
    return 'dst-' + flat(token.slice(6))
  }
  if (token.startsWith('sf-ldrv')) {
    if (token === 'sf-ldrv') return 'drv-page'
    if (token === 'sf-ldrv--light-form') return 'drv-page-light'
    return 'drv-' + flat(token.slice(7))
  }

  const rules = [
    [/^(sf-alerts-)(.+)$/, (_, __, r) => 'als-' + flat(r)],
    [/^(sf-analytics-)(.+)$/, (_, __, r) => 'an-' + flat(r)],
    [/^(sf-alert-)(.+)$/, (_, __, r) => 'al-' + flat(r)],
    [/^(sf-logistics-page)(.*)$/, (_, base, r) => 'log-page' + flat(r)],
    [/^(sf-log-)(.+)$/, (_, __, r) => 'log-' + flat(r)],
    [/^(sf-rep-)(.+)$/, (_, __, r) => 'rep-' + flat(r)],
    [/^(sf-reg-)(.+)$/, (_, __, r) => 'reg-' + flat(r)],
    [/^(sf-login-)(.+)$/, (_, __, r) => 'login-' + flat(r)],
    [/^(sf-env-)(.+)$/, (_, __, r) => 'env-' + flat(r)],
    [/^(sf-inv-)(.+)$/, (_, __, r) => 'itv-' + flat(r)],
    [/^(sf-mon-)(.+)$/, (_, __, r) => 'mon-' + flat(r)],
    [/^(sf-kpi-grid)(.*)$/, (_, __, r) => 'kpi-grid' + flat(r)],
    [/^(sf-kpi)(.*)$/, (_, __, r) => 'kpi' + flat(r)],
    [/^(sf-profile)(.*)$/, (_, __, r) => 'pf' + flat(r)],
    [/^(sf-sign)(.*)$/, (_, __, r) => 'sign' + flat(r)],
    [/^(sf-sidebar)(.*)$/, (_, __, r) => 'sb' + flat(r)],
    [/^(sf-topbar)(.*)$/, (_, __, r) => 'tb' + flat(r)],
    [/^(sf-nav-link)(.*)$/, (_, __, r) => 'nav' + flat(r)],
    [/^(sf-lang-)(.+)$/, (_, __, r) => 'lang-' + flat(r)],
    [/^(sf-icon-btn)(.*)$/, (_, __, r) => 'ibtn' + flat(r)],
    [/^(sf-avatar)(.*)$/, (_, __, r) => 'av' + flat(r)],
    [/^(sf-ship-status)(.*)$/, (_, __, r) => 'sts' + flat(r)],
    [/^(sf-thermal-fab)(.*)$/, (_, __, r) => 'tfab' + flat(r)],
    [/^(sf-toggle)(.*)$/, (_, __, r) => 'tog' + flat(r)],
    [/^(sf-nf)(.*)$/, (_, __, r) => 'nf' + flat(r)],
    [/^(sf-stub)(.*)$/, (_, __, r) => 'stub' + flat(r)],
    [/^(sf-status)(.*)$/, (_, __, r) => 'st' + flat(r)],
    [/^(sf-pulse)(.*)$/, (_, __, r) => 'pulse' + flat(r)],
  ]

  for (const [re, fn] of rules) {
    const m = token.match(re)
    if (m) return fn(...m)
  }

  if (token.startsWith('sf-')) return token.slice(3).replace(/__/g, '-').replace(/--/g, '-')
  return token
}

function collectTokens(text) {
  const re = /sf-[a-z0-9_-]+/g
  const s = new Set()
  let m
  while ((m = re.exec(text))) s.add(m[0])
  return s
}

function buildReplacements(text) {
  const tokens = [...collectTokens(text)]
  const pairs = []
  for (const t of tokens) {
    const n = mapToken(t)
    if (n !== t) pairs.push([t, n])
  }
  pairs.sort((a, b) => b[0].length - a[0].length)
  return pairs
}

function applyVarRenames(text) {
  let t = text
  const varPairs = [
    ['--sf-ldrv-', '--drv-'],
    ['--sf-lnd-', '--dst-'],
    ['--sf-lns-', '--shp-'],
  ]
  for (const [a, b] of varPairs) t = t.split(a).join(b)
  return t
}

function transformFile(text) {
  let t = applyVarRenames(text)
  const pairs = buildReplacements(t)
  for (const [oldT, newT] of pairs) {
    if (oldT === newT) continue
    t = t.split(oldT).join(newT)
  }
  return t
}

const files = walk(SRC)
let changed = 0
for (const f of files) {
  if (!f.endsWith('.vue') && !f.endsWith('.css')) continue
  const before = fs.readFileSync(f, 'utf8')
  const after = transformFile(before)
  if (after !== before) {
    fs.writeFileSync(f, after)
    changed++
    console.log(path.relative(ROOT, f))
  }
}
console.log('files updated:', changed)

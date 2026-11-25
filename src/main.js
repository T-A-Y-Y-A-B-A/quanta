import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'
import '@fontsource/instrument-serif/400-italic.css'
import './style.css'

const $ = (s, root = document) => root.querySelector(s)
const $$ = (s, root = document) => [...root.querySelectorAll(s)]
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches

/* ---------- Navbar: mobile menu + active section ---------- */
const nav = $('.nav')
const burger = $('.burger')
const menu = $('#menu')
const setMenu = (open) => {
  nav.classList.toggle('open', open)
  burger.setAttribute('aria-expanded', String(open))
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
}
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')))
// Tapping anywhere outside the open menu closes it.
document.addEventListener('click', (e) => {
  if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false)
})
menu.addEventListener('click', (e) => e.target.closest('a') && setMenu(false))
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('open')) {
    setMenu(false)
    burger.focus()
  }
})

const navLinks = $$('#menu a:not(.btn)')
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      for (const a of navLinks) {
        const current = a.hash === `#${e.target.id}`
        a.classList.toggle('active', current)
        if (current) a.setAttribute('aria-current', 'location')
        else a.removeAttribute('aria-current')
      }
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
)
;['hero', 'product', 'features', 'how', 'pricing', 'testimonials', 'faq'].forEach((id) => spy.observe(document.getElementById(id)))

/* ---------- Reveal on scroll ---------- */
const revealer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      e.target.classList.add('in')
      revealer.unobserve(e.target)
    }
  },
  { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
)
$$('[data-reveal]').forEach((el) => revealer.observe(el))

/* ---------- Marquees: duplicate content once for a seamless loop ---------- */
$$('[data-marquee]').forEach((track) => {
  for (const node of [...track.children]) {
    const clone = node.cloneNode(true)
    clone.setAttribute('aria-hidden', 'true')
    track.append(clone)
  }
})

/* ---------- Dashboard: counters, Copilot typing, live feed ---------- */
const fmt = (v, d) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

function countUp(el) {
  const to = Number(el.dataset.count)
  const d = Number(el.dataset.decimals || 0)
  const pre = el.dataset.prefix || ''
  const suf = el.dataset.suffix || ''
  if (reduceMotion) return
  const t0 = performance.now()
  const tick = (now) => {
    const p = Math.min((now - t0) / 1800, 1)
    const eased = p === 1 ? 1 : 1 - 2 ** (-10 * p)
    el.textContent = pre + fmt(to * eased, d) + suf
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function typeOut(out, text) {
  if (reduceMotion) return (out.textContent = text)
  let i = 0
  const step = () => {
    out.textContent = text.slice(0, ++i)
    if (i < text.length) setTimeout(step, 14 + Math.random() * 26)
  }
  setTimeout(step, 900)
}

const feed = $('#feed')
const events = [
  ['ev--a', 'New signup', 'Seoul'],
  ['ev--c', 'Invoice paid · $380', 'Sydney'],
  ['ev--b', 'Seat added', 'Lisbon'],
  ['ev--d', 'Spike detected', 'EU traffic'],
  ['ev--a', 'Trial started', 'São Paulo'],
  ['ev--b', 'Upgraded to Scale', 'Chicago'],
  ['ev--c', 'Payment received · $2,900', 'London'],
  ['ev--a', 'New signup', 'Nairobi'],
]
let feedIndex = 0
let feedTimer = 0
function pushEvent() {
  const [cls, what, where] = events[feedIndex++ % events.length]
  const li = document.createElement('li')
  li.className = 'new'
  li.innerHTML = `<i class="ev ${cls}"></i><span>${what} <em>· ${where}</em></span><time></time>`
  feed.prepend(li)
  while (feed.children.length > 4) feed.lastElementChild.remove()
  ;[...feed.children].forEach((row, i) => (row.querySelector('time').textContent = i ? `${i * 3}s ago` : 'now'))
}

// Start counters at zero so they visibly count up when the dashboard scrolls in.
if (!reduceMotion) {
  $$('[data-count]').forEach((el) => (el.textContent = (el.dataset.prefix || '') + fmt(0, Number(el.dataset.decimals || 0)) + (el.dataset.suffix || '')))
}

let dashStarted = false
new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting && !dashStarted) {
      dashStarted = true
      $$('[data-count]').forEach(countUp)
      const typed = $('.typed')
      typeOut($('.typed__out', typed), $('.typed__ghost', typed).textContent.trim())
    }
    clearInterval(feedTimer)
    if (entry.isIntersecting && !reduceMotion) feedTimer = setInterval(pushEvent, 2600)
  },
  { threshold: 0.25 },
).observe($('.dash'))

/* ---------- Scroll-linked effects (one rAF per frame) ---------- */
const progressBar = $('.nav__progress')
const stage = $('#stage')
const steps = $('#steps')
const stepItems = $$('.step', steps)
let ticking = false

function onScroll() {
  ticking = false
  const vh = innerHeight
  const y = scrollY
  nav.classList.toggle('scrolled', y > 24)
  const max = document.documentElement.scrollHeight - vh
  progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`

  if (!reduceMotion) {
    // Dashboard un-tilts from 26deg to flat as it scrolls into view.
    const r = stage.getBoundingClientRect()
    stage.style.setProperty('--p', clamp((vh - r.top) / (vh * 0.8), 0, 1).toFixed(4))
  }

  const sr = steps.getBoundingClientRect()
  const line = vh * 0.6
  steps.style.setProperty('--progress', clamp((line - sr.top) / sr.height, 0, 1).toFixed(4))
  stepItems.forEach((li) => li.classList.toggle('active', li.getBoundingClientRect().top < line))
}
addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(onScroll)
  }
}, { passive: true })
addEventListener('resize', onScroll)
onScroll()

/* ---------- 3D tilt + cursor spotlight on cards ---------- */
if (finePointer && !reduceMotion) {
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.style.setProperty('--mx', `${x * 100}%`)
      el.style.setProperty('--my', `${y * 100}%`)
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg)`
    })
    el.addEventListener('pointerleave', () => (el.style.transform = ''))
  })
}

/* ---------- Pricing toggle ---------- */
const billing = $('#billing')
billing.addEventListener('click', () => {
  const yearly = billing.getAttribute('aria-checked') !== 'true'
  billing.setAttribute('aria-checked', String(yearly))
  $('.pricing').classList.toggle('yearly', yearly)
  $('#billing-status').textContent = yearly ? 'Showing yearly prices, 20% off.' : 'Showing monthly prices.'
  $$('.plan').forEach((plan) => {
    const amt = $('.price__amt', plan)
    const value = Number(yearly ? amt.dataset.y : amt.dataset.m)
    amt.textContent = value
    amt.classList.remove('flip')
    void amt.offsetWidth // restart the flip animation
    amt.classList.add('flip')
    $('.plan__billed', plan).textContent = yearly ? `billed yearly · $${(value * 12).toLocaleString('en-US')}/yr` : 'billed monthly'
  })
})

/* ---------- CTA form (no backend: validate + confirm) ---------- */
const form = $('.cta__form')
const msg = $('.cta__msg')
form.addEventListener('submit', (e) => {
  e.preventDefault()
  const email = form.email
  if (!email.checkValidity()) {
    msg.classList.add('err')
    msg.textContent = 'Please enter a valid work email.'
    email.focus()
    return
  }
  msg.classList.remove('err')
  msg.textContent = 'You’re in! Check your inbox for your setup link.'
  form.reset()
})

$('#year').textContent = new Date().getFullYear()
console.log('%cQuanta%c  Made by Tayyaba Imtiaz', 'font:700 20px sans-serif;color:#ff6a3d', 'font:italic 14px Georgia,serif;color:#ffc861')

/* ---------- 3D scene: loaded after first paint so it never blocks content ---------- */
// Skip WebGL on software-rendered devices (no GPU): the CSS aura background still looks complete.
function hasFastWebGL() {
  const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true })
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  return Boolean(gl)
}
const startScene = () =>
  hasFastWebGL() &&
  import('./scene.js')
    .then((m) => m.initScene($('#gl'), { reduceMotion, finePointer }))
    .catch(() => {}) // no WebGL: the CSS aura background still looks complete
if ('requestIdleCallback' in window) requestIdleCallback(startScene, { timeout: 1200 })
else setTimeout(startScene, 200)

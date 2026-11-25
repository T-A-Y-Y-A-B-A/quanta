import { AdditiveBlending, BufferAttribute, BufferGeometry, PerspectiveCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from 'three'

const FOV = 45
const CAM_Z = 6
// Half-size of each shape in world units: sphere, ring, helix, wave, sphere again.
const EXTENT = [1.6, 1.75, 2.3, 3.2, 1.6]

// Each anchor pins the particle shape to a page element; scrolling blends between neighbours.
const ANCHORS = [
  { sel: '.hero__visual', morph: 0, opacity: 1, tilt: 0.25, size: (r) => Math.min(r.width, r.height) * 0.52 },
  { sel: '.stage', morph: 1, opacity: 0.85, tilt: 1.2, size: (r) => Math.min(r.width * 0.56, r.height * 0.95) },
  { sel: '#how', xSel: '.how__intro', morph: 2, opacity: 0.8, tilt: 0.2, dim: true, size: (_, vh) => vh * 0.44 },
  { sel: '.plans', morph: 3, opacity: 0.6, tilt: 1.0, size: (r) => r.width * 0.6 },
  { sel: '.cta__card', morph: 4, opacity: 0.75, tilt: 0.25, dim: true, size: (r) => Math.min(r.width, r.height) * 0.6 },
]

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uOpacity;
  uniform float uEnergy;
  uniform vec3 uMouse; // xy = pointer on the z=0 plane, z = strength
  attribute vec3 aRing;
  attribute vec3 aHelix;
  attribute vec3 aWave;
  attribute float aRand;
  varying vec3 vColor;
  varying float vAlpha;

  // Staggered per-particle progress through morph step s -> s+1.
  float stage(float s) {
    return smoothstep(0.0, 1.0, clamp((uMorph - s) * 1.6 - aRand * 0.6, 0.0, 1.0));
  }

  void main() {
    vec3 p = position;
    p = mix(p, aRing, stage(0.0));
    p = mix(p, aHelix, stage(1.0));
    p = mix(p, aWave, stage(2.0));
    p = mix(p, position, stage(3.0));

    float t = uTime;
    float waveW = stage(2.0) * (1.0 - stage(3.0));
    p.y += waveW * 0.22 * sin(p.x * 1.3 + t * 1.2) * cos(p.z * 1.1 + t * 0.8);

    float amp = 0.035 + uEnergy * 0.22;
    p += amp * vec3(
      sin(p.y * 2.7 + t * 1.1 + aRand * 6.2832),
      sin(p.z * 2.3 + t * 0.9 + aRand * 4.0),
      sin(p.x * 2.5 + t * 1.3)
    );

    float a = t * 0.12;
    float c = cos(a);
    float s = sin(a);
    p.xz = mat2(c, -s, s, c) * p.xz;

    vec4 world = modelMatrix * vec4(p, 1.0);
    vec2 d = world.xy - uMouse.xy;
    float push = (1.0 - smoothstep(0.0, 1.1, length(d))) * uMouse.z;
    world.xy += normalize(d + 1e-4) * push * 0.45;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;

    float twinkle = 0.75 + 0.25 * sin(t * 2.0 + aRand * 40.0);
    gl_PointSize = uSize * (0.35 + aRand * aRand * 1.6) * twinkle / max(-mv.z, 1.0);

    vec3 ember = vec3(1.0, 0.42, 0.24);
    vec3 amber = vec3(1.0, 0.78, 0.38);
    vec3 cream = vec3(1.0, 0.94, 0.86);
    vColor = mix(ember, amber, smoothstep(-1.4, 1.4, p.y + p.x * 0.4));
    vColor = mix(vColor, cream, step(0.94, aRand) * 0.85);
    vAlpha = uOpacity * mix(1.0, 0.3, smoothstep(5.0, 8.0, -mv.z));
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float a = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5));
    if (a <= 0.0) discard;
    gl_FragColor = vec4(vColor, a * a * vAlpha);
  }
`

function buildShapes(n) {
  const sphere = new Float32Array(n * 3)
  const ring = new Float32Array(n * 3)
  const helix = new Float32Array(n * 3)
  const wave = new Float32Array(n * 3)
  const rand = new Float32Array(n)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const side = Math.ceil(Math.sqrt(n))
  const R = Math.random

  for (let i = 0; i < n; i++) {
    const k = i * 3
    rand[i] = R()

    // Sphere: Fibonacci shell plus a sparse inner core for depth.
    const y = 1 - (i / (n - 1)) * 2
    const rr = Math.sqrt(1 - y * y)
    const th = golden * i
    const r = i % 10 === 0 ? 1.6 * Math.cbrt(R()) : 1.6 * (0.97 + R() * 0.06)
    sphere[k] = Math.cos(th) * rr * r
    sphere[k + 1] = y * r
    sphere[k + 2] = Math.sin(th) * rr * r

    // Ring: thin bright torus with a dusty halo.
    const u = R() * Math.PI * 2
    const v = R() * Math.PI * 2
    const spread = 0.06 + R() ** 3 * 0.5
    ring[k] = (1.75 + Math.cos(v) * spread) * Math.cos(u)
    ring[k + 1] = Math.sin(v) * spread * 0.6
    ring[k + 2] = (1.75 + Math.cos(v) * spread) * Math.sin(u)

    // Helix: two strands plus rungs.
    const t = R()
    if (R() < 0.18) {
      const tq = Math.round(t * 22) / 22
      const ang = tq * Math.PI * 5
      const along = R() * 2 - 1
      helix[k] = Math.cos(ang) * 0.8 * along
      helix[k + 1] = (tq - 0.5) * 4.6
      helix[k + 2] = Math.sin(ang) * 0.8 * along
    } else {
      const ang = t * Math.PI * 5 + (i & 1) * Math.PI
      helix[k] = Math.cos(ang) * 0.8 + (R() - 0.5) * 0.08
      helix[k + 1] = (t - 0.5) * 4.6 + (R() - 0.5) * 0.08
      helix[k + 2] = Math.sin(ang) * 0.8 + (R() - 0.5) * 0.08
    }

    // Wave: a grid (animated in the shader).
    const wx = ((i % side) / (side - 1)) * 6.4 - 3.2
    const wz = (Math.floor(i / side) / (side - 1)) * 6.4 - 3.2
    wave[k] = wx
    wave[k + 1] = 0.28 * Math.sin(wx * 1.4) * Math.cos(wz * 1.2)
    wave[k + 2] = wz
  }
  return { sphere, ring, helix, wave, rand }
}

export function initScene(canvas, { reduceMotion = false, finePointer = false } = {}) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' })
  const pr = Math.min(window.devicePixelRatio || 1, 1.75)
  renderer.setPixelRatio(pr)
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50)
  camera.position.z = CAM_Z

  const lowPower = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4
  const shapes = buildShapes(lowPower ? 9000 : 16000)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(shapes.sphere, 3))
  geometry.setAttribute('aRing', new BufferAttribute(shapes.ring, 3))
  geometry.setAttribute('aHelix', new BufferAttribute(shapes.helix, 3))
  geometry.setAttribute('aWave', new BufferAttribute(shapes.wave, 3))
  geometry.setAttribute('aRand', new BufferAttribute(shapes.rand, 1))

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uSize: { value: 22 * pr },
    uOpacity: { value: 0 },
    uEnergy: { value: 0 },
    uMouse: { value: [0, 0, 0] },
  }
  const points = new Points(
    geometry,
    new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: AdditiveBlending }),
  )
  points.frustumCulled = false // bounds come from the sphere only; morphed shapes extend past them
  scene.add(points)

  /* ---------- Layout: map page elements to world space ---------- */
  const anchors = ANCHORS.map((a) => ({ ...a, el: document.querySelector(a.sel), xEl: a.xSel && document.querySelector(a.xSel) })).filter((a) => a.el)
  let W = 0
  let H = 0
  let k = 1 // world units per CSS pixel on the z=0 plane

  function measure() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w !== W || h !== H) {
      W = w
      H = h
      renderer.setSize(W, H, false)
      camera.aspect = W / H
      camera.updateProjectionMatrix()
    }
    k = (2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z) / H
    const sy = scrollY
    for (const a of anchors) {
      const r = a.el.getBoundingClientRect()
      const rx = a.xEl ? a.xEl.getBoundingClientRect() : r
      a.cx = rx.left + rx.width / 2
      a.cy = r.top + sy + r.height / 2
      a.scrollAt = a.cy - H / 2
      a.scale = (a.size(r, H) * k) / EXTENT[a.morph]
      a.op = a.opacity * (a.dim && W < 960 ? 0.55 : 1)
    }
  }

  function targetAt(sy) {
    let i = 0
    while (i < anchors.length - 1 && sy > anchors[i + 1].scrollAt) i++
    const a = anchors[i]
    const b = anchors[Math.min(i + 1, anchors.length - 1)]
    const span = b.scrollAt - a.scrollAt
    let t = span > 0 ? Math.min(1, Math.max(0, (sy - a.scrollAt) / span)) : 0
    t = t * t * (3 - 2 * t)
    const mix = (x, y) => x + (y - x) * t
    return {
      x: (mix(a.cx, b.cx) - W / 2) * k,
      y: -(mix(a.cy, b.cy) - sy - H / 2) * k,
      morph: mix(a.morph, b.morph),
      opacity: mix(a.op, b.op),
      tilt: mix(a.tilt, b.tilt),
      scale: mix(a.scale, b.scale),
    }
  }

  /* ---------- Pointer ---------- */
  const mouse = { x: 0, y: 0, s: 0, nx: 0, ny: 0, tx: 0, ty: 0, ts: 0, tnx: 0, tny: 0 }
  if (finePointer && !reduceMotion) {
    addEventListener(
      'pointermove',
      (e) => {
        mouse.tx = (e.clientX - W / 2) * k
        mouse.ty = -(e.clientY - H / 2) * k
        mouse.tnx = e.clientX / W - 0.5
        mouse.tny = e.clientY / H - 0.5
        mouse.ts = 1
      },
      { passive: true },
    )
    document.documentElement.addEventListener('pointerleave', () => (mouse.ts = 0))
  }

  /* ---------- Render ---------- */
  measure()
  const cur = targetAt(scrollY)
  let time = 0
  let energy = 1
  if (!reduceMotion) {
    cur.scale *= 0.25 // intro: particles burst outward into the first shape
    cur.opacity = 0
  }

  function draw() {
    points.position.set(cur.x, cur.y, 0)
    points.scale.setScalar(cur.scale)
    points.rotation.set(cur.tilt + mouse.ny * 0.25, mouse.nx * 0.4, 0)
    uniforms.uTime.value = time
    uniforms.uMorph.value = cur.morph
    uniforms.uOpacity.value = cur.opacity
    uniforms.uEnergy.value = energy
    const m = uniforms.uMouse.value
    m[0] = mouse.x
    m[1] = mouse.y
    m[2] = mouse.s
    renderer.render(scene, camera)
  }

  let pending = false
  const schedule = (fn) => {
    if (pending) return
    pending = true
    requestAnimationFrame(() => {
      pending = false
      fn()
    })
  }

  if (reduceMotion) {
    // Static: no animation loop, just re-render when the page moves.
    energy = 0
    const still = () => {
      Object.assign(cur, targetAt(scrollY))
      draw()
    }
    addEventListener('scroll', () => schedule(still), { passive: true })
    addEventListener('resize', () => schedule(() => (measure(), still())))
    new ResizeObserver(() => schedule(() => (measure(), still()))).observe(document.body)
    still()
  } else {
    let last = performance.now()
    let lastY = scrollY
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      time += dt
      const sy = scrollY
      const tgt = targetAt(sy)
      const f = 1 - Math.exp(-dt * 4.5)
      cur.x += (tgt.x - cur.x) * f
      cur.y += (tgt.y - cur.y) * f
      cur.morph += (tgt.morph - cur.morph) * f
      cur.opacity += (tgt.opacity - cur.opacity) * f
      cur.tilt += (tgt.tilt - cur.tilt) * f
      cur.scale += (tgt.scale - cur.scale) * f
      const speed = Math.abs(sy - lastY) / Math.max(dt, 1e-3)
      lastY = sy
      energy += (Math.min(speed / 2500, 1) - energy) * (1 - Math.exp(-dt * 3))
      const g = 1 - Math.exp(-dt * 6)
      mouse.x += (mouse.tx - mouse.x) * g
      mouse.y += (mouse.ty - mouse.y) * g
      mouse.s += (mouse.ts - mouse.s) * g
      mouse.nx += (mouse.tnx - mouse.nx) * g
      mouse.ny += (mouse.tny - mouse.ny) * g
      draw()
      requestAnimationFrame(frame)
    }
    addEventListener('resize', () => schedule(measure))
    new ResizeObserver(() => schedule(measure)).observe(document.body)
    requestAnimationFrame(frame)
  }

  document.fonts?.ready.then(measure)
  canvas.classList.add('ready')
}

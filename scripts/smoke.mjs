/**
 * Prueba de humo del portfolio con Chrome headless.
 *
 * Un FPS no se puede comprobar con tests unitarios: lo que importa es que el
 * jugador se apoye en el suelo, que se mueva al pulsar W, que un disparo a una
 * diana abra su sección y que TAB despliegue la tablet. Esto lo comprueba de
 * punta a punta contra el servidor de desarrollo.
 *
 * Uso:
 *   1) npm run dev            (en otra terminal)
 *   2) npm run smoke
 *
 * Requiere Chrome instalado. Se puede indicar otra ruta con CHROME_PATH y otro
 * servidor con SMOKE_URL.
 */
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const CANDIDATE_BROWSERS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

const executablePath = CANDIDATE_BROWSERS.find((p) => existsSync(p))
if (!executablePath) {
  console.error('No se ha encontrado Chrome. Indica la ruta con CHROME_PATH.')
  process.exit(1)
}

const URL = process.env.SMOKE_URL ?? 'http://localhost:5199/'
const OUT = process.env.SMOKE_OUT ?? 'smoke-out'
mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = (label, ok, detail = '') => {
  results.push({ label, ok })
  console.log(`${ok ? 'OK  ' : 'FALLO'} ${label}${detail ? ` — ${detail}` : ''}`)
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: [
    '--window-size=1280,800',
    // Chrome headless no tiene GPU: WebGL va por software con SwiftShader.
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
  ],
})

const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

const errors = []
const logs = []
page.on('console', (m) => {
  logs.push(`${m.type()}: ${m.text()}`)
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

const state = () => page.evaluate(() => window.__labState?.())
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` })

/**
 * Espera a que el juego alcance una fase concreta.
 *
 * Con renderizado por software esto corre a menos de 10 fps, así que dormir un
 * número fijo de milisegundos hace la prueba inestable: unas veces llega y
 * otras no. Sondear el estado real la vuelve determinista.
 */
const waitPhase = async (expected, timeout = 15000) => {
  try {
    await page.waitForFunction(
      (want) => window.__labState?.()?.phase === want,
      { timeout, polling: 100 },
      expected,
    )
    return true
  } catch {
    return false
  }
}

try {
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 })

  // 1 · Menú principal
  await page.waitForFunction(() => document.body.innerText.includes('Entrar al laboratorio'), {
    timeout: 60000,
  })
  check('el menú principal se muestra', true)
  await shot('01-menu')

  // 2 · Entrar al juego
  await page.evaluate(() => {
    ;[...document.querySelectorAll('button')]
      .find((b) => b.textContent.includes('Entrar al laboratorio'))
      ?.click()
  })
  const started = await waitPhase('playing')
  check('al entrar, la fase pasa a "playing"', started, (await state())?.phase)
  // Margen para que la cápsula se asiente en el suelo antes de medir.
  await sleep(1200)

  // 3 · El jugador reposa sobre el suelo, no cae al infinito
  const y1 = await page.evaluate(() => window.__labCameraY?.())
  await sleep(1200)
  const y2 = await page.evaluate(() => window.__labCameraY?.())
  check(
    'el jugador se apoya en el suelo a la altura de los ojos',
    Math.abs(y2 - 1.7) < 0.25 && Math.abs(y2 - y1) < 0.25,
    `y=${y2?.toFixed(3)}`,
  )

  // 4 · Movimiento
  const before = await page.evaluate(() => window.__labCameraPos?.())
  await page.keyboard.down('KeyW')
  await sleep(900)
  await page.keyboard.up('KeyW')
  await sleep(250)
  const after = await page.evaluate(() => window.__labCameraPos?.())
  const travelled = Math.hypot(after[0] - before[0], after[2] - before[2])
  check('pulsar W desplaza al jugador', travelled > 1.5, `${travelled.toFixed(2)} m`)

  // El jugador debe frenar al soltar la tecla, no deslizarse indefinidamente.
  //
  // No se compara con una distancia fija: esta prueba corre con renderizado por
  // software a ~12 fps, y a esa cadencia el frenado tarda mucho más en tiempo
  // real que en un equipo normal. Lo que sí es independiente del framerate es
  // que la deriva se reduzca ventana a ventana hasta apagarse.
  const driftOver = async (ms) => {
    const a = await page.evaluate(() => window.__labCameraPos?.())
    await sleep(ms)
    const b = await page.evaluate(() => window.__labCameraPos?.())
    return Math.hypot(b[0] - a[0], b[2] - a[2])
  }
  const drift1 = await driftOver(700)
  const drift2 = await driftOver(700)
  check(
    'al soltar la tecla el jugador desacelera hasta parar',
    drift2 < drift1 * 0.3 && drift2 < 0.1,
    `deriva ${drift1.toFixed(3)} m → ${drift2.toFixed(3)} m`,
  )
  await shot('02-juego')

  // 5 · Apuntar y disparar a la diana de la pared norte
  await page.evaluate(() => window.__labLookAt?.(0, 2.4, -13.95))
  const aimingOk = await page
    .waitForFunction(() => window.__labState?.()?.aimedSection === 'sobre-mi', {
      timeout: 10000,
      polling: 100,
    })
    .then(() => true)
    .catch(() => false)
  check('el HUD detecta la diana apuntada', aimingOk, String((await state())?.aimedSection))
  await shot('03-apuntando')

  await page.evaluate(() => window.__labShoot?.())
  const opened = await waitPhase('section')
  const afterShot = await state()
  check(
    'disparar a la diana abre su sección',
    opened && afterShot?.activeSection === 'sobre-mi',
    `${afterShot?.phase}/${afterShot?.activeSection}`,
  )
  const modalHasBio = await page.evaluate(() =>
    document.body.innerText.includes('Full-Stack junior'),
  )
  check('el panel muestra el contenido de la sección', modalHasBio)
  await shot('04-seccion')

  // 6 · Escape cierra el panel
  await page.keyboard.press('Escape')
  const closed = await waitPhase('playing')
  check('Escape cierra el panel y devuelve al juego', closed, (await state())?.phase)

  // 7 · TAB abre la tablet del CV
  await page.keyboard.press('Tab')
  const tabletOpen = await waitPhase('tablet')
  check('TAB despliega la tablet', tabletOpen, (await state())?.phase)
  await sleep(400)
  const tabletVisible = await page.evaluate(() =>
    document.body.innerText.includes('PERSONNEL FILE'),
  )
  check('la tablet muestra su interfaz', tabletVisible)
  await shot('05-tablet')

  // 8 · Pestañas de la tablet
  await page.evaluate(() => {
    ;[...document.querySelectorAll('button')]
      .find((b) => b.textContent.trim() === 'Experiencia')
      ?.click()
  })
  await sleep(500)
  const hasJob = await page.evaluate(() => document.body.innerText.includes('Circontrol'))
  check('la pestaña Experiencia carga el historial laboral', hasJob)
  await shot('06-tablet-experiencia')

  // 9 · TAB vuelve a guardar la tablet
  await page.keyboard.press('Tab')
  const tabletClosed = await waitPhase('playing')
  check('TAB guarda la tablet', tabletClosed, (await state())?.phase)

  const fps = await page.evaluate(() => window.__labFps?.())
  console.log(`  · fps medio con renderizado por software: ${fps}`)

  // 10 · Versión clásica
  await page.keyboard.press('Escape')
  await waitPhase('paused')
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('CV clásico')),
    { timeout: 10000, polling: 100 },
  )
  await page.evaluate(() => {
    ;[...document.querySelectorAll('button')]
      .find((b) => b.textContent.includes('CV clásico'))
      ?.click()
  })
  await page.waitForFunction(() => document.body.innerText.includes('Hablemos'), {
    timeout: 15000,
    polling: 150,
  })
  const classic = await page.evaluate(() => {
    const t = document.body.innerText
    return {
      ok:
        t.includes('Circontrol') &&
        t.includes('Proyectos') &&
        t.includes('Recipes') &&
        t.includes('Hablemos'),
      scrollable: getComputedStyle(document.body).overflow !== 'hidden',
    }
  })
  check('la versión clásica contiene todo el CV', classic.ok)
  check('la versión clásica recupera el scroll', classic.scrollable)
  await page.screenshot({ path: `${OUT}/07-clasico.png`, fullPage: true })

  writeFileSync(`${OUT}/console.log`, logs.join('\n'), 'utf8')
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`)
if (errors.length) {
  console.log('\nErrores de consola del navegador:')
  console.log([...new Set(errors)].join('\n'))
}
console.log(`Capturas en ${OUT}/`)

process.exit(failed.length || errors.length ? 1 : 0)

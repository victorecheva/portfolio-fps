import { profile, sections } from '../data/portfolio'
import { useGame } from '../store/gameStore'
import { sfx, unlockAudio, setAudioEnabled } from '../lib/audio'
import type { Capabilities } from '../lib/capabilities'

/**
 * Pantalla de inicio.
 *
 * Existe por una razón técnica además de estética: el navegador solo permite
 * capturar el puntero y arrancar el audio a partir de un gesto real del
 * usuario, así que hace falta un clic explícito antes de entrar al juego.
 */

function KeyRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="inline-flex min-w-7 items-center justify-center rounded border border-lab-line bg-lab-panel-2 px-1.5 py-1 font-mono text-[11px] text-lab-text"
          >
            {k}
          </kbd>
        ))}
      </div>
      <span className="text-xs text-lab-muted">{label}</span>
    </div>
  )
}

export function MainMenu({
  capabilities,
  onClassic,
}: {
  capabilities: Capabilities
  onClassic: () => void
}) {
  const phase = useGame((s) => s.phase)
  const start = useGame((s) => s.start)
  const settings = useGame((s) => s.settings)
  const updateSettings = useGame((s) => s.updateSettings)

  if (phase !== 'menu') return null

  const handleStart = () => {
    // Debe ocurrir dentro del gesto del usuario, no después.
    unlockAudio()
    setAudioEnabled(settings.audio)
    if (settings.audio) sfx.startAmbient()
    sfx.uiClick()
    start()
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-lab-bg/92 backdrop-blur-md">
      <div className="lab-grid-bg pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto flex min-h-full max-w-4xl flex-col justify-center px-5 py-10">
        <div className="lab-enter">
          <p className="font-mono text-[11px] tracking-[0.3em] text-lab-accent">
            PORTFOLIO INTERACTIVO · MODO FPS
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-lab-text sm:text-6xl">
            {profile.shortName}
          </h1>
          <p className="mt-2 text-lg font-medium text-lab-accent sm:text-xl">{profile.title}</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-lab-muted">
            Esto no es una página que se lee, es una sala que se recorre. Muévete por el
            laboratorio, <strong className="font-semibold text-lab-text">dispara</strong> a los
            paneles para abrir cada sección y pulsa{' '}
            <strong className="font-semibold text-lab-text">TAB</strong> para sacar la tablet con mi
            currículum.
          </p>

          {/* Secciones disponibles */}
          <div className="mt-6 flex flex-wrap gap-2">
            {sections.map((s) => (
              <span
                key={s.id}
                className="rounded-lg border border-lab-line bg-lab-panel/70 px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] text-lab-muted"
              >
                {s.label}
              </span>
            ))}
          </div>

          {/* Controles */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <KeyRow keys={['W', 'A', 'S', 'D']} label="Moverse" />
            <KeyRow keys={['Shift']} label="Correr" />
            <KeyRow keys={['Espacio']} label="Saltar" />
            <KeyRow keys={['Clic']} label="Disparar" />
            <KeyRow keys={['TAB']} label="Tablet con el CV" />
            <KeyRow keys={['Esc']} label="Pausa" />
          </div>

          {/* Acciones */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            {capabilities.canPlay ? (
              <button
                type="button"
                onClick={handleStart}
                onMouseEnter={() => sfx.uiHover()}
                className="group relative overflow-hidden rounded-xl bg-lab-accent px-7 py-3.5 text-sm font-bold tracking-wide text-lab-bg transition-transform hover:scale-[1.02] active:scale-100"
              >
                Entrar al laboratorio
                <span className="ml-2 font-mono text-xs opacity-70">▶</span>
              </button>
            ) : (
              <div className="rounded-xl border border-lab-line bg-lab-panel/80 px-5 py-3.5 text-xs text-lab-muted">
                {capabilities.reason} Abajo tienes el CV completo en formato clásico.
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                sfx.uiClick()
                onClassic()
              }}
              onMouseEnter={() => sfx.uiHover()}
              className="rounded-xl border border-lab-line px-6 py-3.5 text-sm font-semibold text-lab-text transition-colors hover:border-lab-accent hover:text-lab-accent"
            >
              ¿Sin ganas de jugar? Ver el CV normal
            </button>
          </div>

          {/* Ajustes */}
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-lab-line/60 pt-6">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-lab-muted">
              <input
                type="checkbox"
                checked={settings.highQuality}
                onChange={(e) => updateSettings({ highQuality: e.target.checked })}
                className="h-3.5 w-3.5 accent-lab-accent"
              />
              Calidad alta <span className="opacity-60">(sombras y luces)</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-lab-muted">
              <input
                type="checkbox"
                checked={settings.audio}
                onChange={(e) => {
                  updateSettings({ audio: e.target.checked })
                  setAudioEnabled(e.target.checked)
                }}
                className="h-3.5 w-3.5 accent-lab-accent"
              />
              Sonido
            </label>

            <label className="flex items-center gap-2 text-xs text-lab-muted">
              Sensibilidad del ratón
              <input
                type="range"
                min={0.3}
                max={2}
                step={0.1}
                value={settings.sensitivity}
                onChange={(e) => updateSettings({ sensitivity: Number(e.target.value) })}
                className="w-28 accent-lab-accent"
              />
              <span className="w-8 font-mono">{settings.sensitivity.toFixed(1)}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

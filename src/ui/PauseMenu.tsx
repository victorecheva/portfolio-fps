import { sections } from '../data/portfolio'
import { useGame } from '../store/gameStore'
import { sfx, setAudioEnabled } from '../lib/audio'

/**
 * Pausa (tras pulsar Escape).
 *
 * Reanudar requiere un clic porque el navegador impone un pequeño enfriamiento
 * antes de volver a capturar el puntero después de un Escape.
 */
export function PauseMenu({ onClassic }: { onClassic: () => void }) {
  const phase = useGame((s) => s.phase)
  const resume = useGame((s) => s.resume)
  const toggleTablet = useGame((s) => s.toggleTablet)
  const toMenu = useGame((s) => s.toMenu)
  const visited = useGame((s) => s.visited)
  const shotsFired = useGame((s) => s.shotsFired)
  const settings = useGame((s) => s.settings)
  const updateSettings = useGame((s) => s.updateSettings)

  if (phase !== 'paused') return null

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-lab-bg/85 p-4 backdrop-blur-md">
      <div className="lab-enter w-full max-w-md rounded-2xl border border-lab-line bg-lab-panel p-6 shadow-2xl">
        <p className="font-mono text-[10px] tracking-[0.28em] text-lab-accent">EN PAUSA</p>
        <h2 className="mt-2 text-2xl font-bold text-lab-text">Laboratorio en espera</h2>

        <div className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border border-lab-line bg-lab-panel-2/60 py-3">
            <div className="text-xl font-bold text-lab-accent">
              {visited.length}/{sections.length}
            </div>
            <div className="text-[10px] tracking-widest text-lab-muted">SECCIONES</div>
          </div>
          <div className="rounded-lg border border-lab-line bg-lab-panel-2/60 py-3">
            <div className="text-xl font-bold text-lab-accent">{shotsFired}</div>
            <div className="text-[10px] tracking-widest text-lab-muted">DISPAROS</div>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              sfx.uiClick()
              resume()
            }}
            onMouseEnter={() => sfx.uiHover()}
            className="w-full rounded-xl bg-lab-accent px-5 py-3 text-sm font-bold tracking-wide text-lab-bg transition-colors hover:bg-white"
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.uiClick()
              toggleTablet()
            }}
            onMouseEnter={() => sfx.uiHover()}
            className="w-full rounded-xl border border-lab-line px-5 py-3 text-sm font-semibold text-lab-text transition-colors hover:border-lab-accent hover:text-lab-accent"
          >
            Abrir la tablet con el CV <span className="font-mono text-xs opacity-60">TAB</span>
          </button>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                sfx.uiClick()
                onClassic()
              }}
              onMouseEnter={() => sfx.uiHover()}
              className="flex-1 rounded-xl border border-lab-line px-4 py-2.5 text-xs font-semibold text-lab-muted transition-colors hover:border-lab-accent hover:text-lab-accent"
            >
              CV clásico
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.uiClick()
                toMenu()
              }}
              onMouseEnter={() => sfx.uiHover()}
              className="flex-1 rounded-xl border border-lab-line px-4 py-2.5 text-xs font-semibold text-lab-muted transition-colors hover:border-lab-accent hover:text-lab-accent"
            >
              Menú principal
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-lab-line/60 pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-lab-muted">
            <input
              type="checkbox"
              checked={settings.highQuality}
              onChange={(e) => updateSettings({ highQuality: e.target.checked })}
              className="h-3.5 w-3.5 accent-lab-accent"
            />
            Calidad alta
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-lab-muted">
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
          <label className="flex items-center gap-2 text-[11px] text-lab-muted">
            Sensibilidad
            <input
              type="range"
              min={0.3}
              max={2}
              step={0.1}
              value={settings.sensitivity}
              onChange={(e) => updateSettings({ sensitivity: Number(e.target.value) })}
              className="w-24 accent-lab-accent"
            />
          </label>
        </div>
      </div>
    </div>
  )
}

import { sections } from '../data/portfolio'
import { useGame } from '../store/gameStore'

/**
 * HUD del modo juego.
 *
 * Un portfolio lo abre gente que no juega, así que las teclas están siempre
 * en pantalla y la mira cambia de forma al apuntar a una diana: nadie debería
 * tener que adivinar qué hacer.
 */

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-lab-line bg-lab-panel/80 px-1.5 py-0.5 font-mono text-[11px] text-lab-text shadow-sm">
      {children}
    </kbd>
  )
}

function Crosshair({ hot }: { hot: boolean }) {
  const color = hot ? 'bg-lab-accent' : 'bg-white/70'
  const gap = hot ? 9 : 6
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="relative h-8 w-8">
        {/* Punto central */}
        <div
          className={`absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
            hot ? 'bg-lab-accent' : 'bg-white'
          }`}
        />
        {/* Cuatro trazos que se separan al apuntar a una diana */}
        {[
          { style: { left: '50%', top: `calc(50% - ${gap + 6}px)` }, cls: 'h-[6px] w-[2px] -translate-x-1/2' },
          { style: { left: '50%', top: `calc(50% + ${gap}px)` }, cls: 'h-[6px] w-[2px] -translate-x-1/2' },
          { style: { top: '50%', left: `calc(50% - ${gap + 6}px)` }, cls: 'h-[2px] w-[6px] -translate-y-1/2' },
          { style: { top: '50%', left: `calc(50% + ${gap}px)` }, cls: 'h-[2px] w-[6px] -translate-y-1/2' },
        ].map((line, i) => (
          <div
            key={i}
            style={line.style}
            className={`absolute transition-all duration-150 ${line.cls} ${color}`}
          />
        ))}
      </div>
    </div>
  )
}

export function HUD() {
  const phase = useGame((s) => s.phase)
  const aimedSection = useGame((s) => s.aimedSection)
  const visited = useGame((s) => s.visited)
  const pointerLocked = useGame((s) => s.pointerLocked)

  if (phase !== 'playing') return null

  const aimed = aimedSection ? sections.find((s) => s.id === aimedSection) : null

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <Crosshair hot={!!aimed} />

      {/* Nombre de la sección apuntada, justo bajo la mira */}
      {aimed && (
        <div className="absolute left-1/2 top-[calc(50%+58px)] -translate-x-1/2 text-center lab-pop">
          <div className="text-sm font-bold tracking-[0.2em] text-lab-accent">{aimed.label}</div>
          <div className="mt-1 text-[11px] tracking-wide text-lab-muted">
            Dispara para abrir
          </div>
        </div>
      )}

      {/* Progreso de secciones */}
      <div className="absolute right-5 top-5 rounded-lg border border-lab-line/70 bg-lab-panel/70 px-3 py-2 backdrop-blur-sm">
        <div className="mb-1.5 text-[10px] font-semibold tracking-[0.18em] text-lab-muted">
          SECCIONES
        </div>
        <div className="flex gap-1.5">
          {sections.map((s) => (
            <div
              key={s.id}
              title={s.label}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                visited.includes(s.id) ? 'bg-lab-ok' : 'bg-lab-line'
              }`}
            />
          ))}
        </div>
        <div className="mt-1.5 text-[10px] text-lab-muted">
          {visited.length} / {sections.length} visitadas
        </div>
      </div>

      {/* Controles */}
      <div className="absolute bottom-5 left-5 space-y-1.5 text-[11px] text-lab-muted">
        <div className="flex items-center gap-2">
          <Key>W</Key>
          <Key>A</Key>
          <Key>S</Key>
          <Key>D</Key>
          <span>Moverse</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>Shift</Key>
          <span>Correr</span>
          <Key>Espacio</Key>
          <span>Saltar</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>Clic</Key>
          <span>Disparar</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>TAB</Key>
          <span className="text-lab-accent">Sacar la tablet con el CV</span>
        </div>
        <div className="flex items-center gap-2">
          <Key>Esc</Key>
          <span>Pausa</span>
        </div>
      </div>

      {/* Aviso cuando el navegador aún no ha devuelto el puntero */}
      {!pointerLocked && (
        <div className="absolute inset-0 grid place-items-center bg-lab-bg/50 backdrop-blur-[2px]">
          <div className="rounded-xl border border-lab-line bg-lab-panel/90 px-6 py-4 text-center">
            <div className="text-sm font-semibold">Haz clic para retomar el control</div>
            <div className="mt-1 text-xs text-lab-muted">
              El navegador necesita un clic para volver a capturar el ratón.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

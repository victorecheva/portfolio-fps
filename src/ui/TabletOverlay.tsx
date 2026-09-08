import { profile } from '../data/portfolio'
import { useGame, type TabletTab } from '../store/gameStore'
import { sfx } from '../lib/audio'
import { AboutContent, ContactContent, ExperienceContent, SkillsContent } from './content'

/**
 * La tablet del CV, con TAB.
 *
 * Va superpuesta al canvas y alineada con el modelo 3D de la tablet que el
 * personaje levanta: mientras el arma baja y la tablet sube, este panel
 * aparece encima. Es la razón de haber elegido React Three Fiber — el CV es
 * HTML de verdad, con scroll, enlaces y texto seleccionable.
 */

const TABS: Array<{ id: TabletTab; label: string; Body: () => React.JSX.Element }> = [
  { id: 'sobre-mi', label: 'Sobre mí', Body: AboutContent },
  { id: 'experiencia', label: 'Experiencia', Body: ExperienceContent },
  { id: 'skills', label: 'Skills', Body: SkillsContent },
  { id: 'contacto', label: 'Contacto', Body: ContactContent },
]

export function TabletOverlay() {
  const phase = useGame((s) => s.phase)
  const tabletTab = useGame((s) => s.tabletTab)
  const setTabletTab = useGame((s) => s.setTabletTab)
  const toggleTablet = useGame((s) => s.toggleTablet)

  if (phase !== 'tablet') return null

  const active = TABS.find((t) => t.id === tabletTab) ?? TABS[0]
  const Body = active.Body

  return (
    <div className="fixed inset-0 z-30 grid place-items-center p-3 sm:p-6">
      <div className="lab-enter relative flex h-[min(88vh,640px)] w-full max-w-3xl flex-col overflow-hidden rounded-[22px] border-[6px] border-[#c3ced5] bg-lab-panel shadow-[0_25px_70px_-20px_rgba(0,0,0,0.9)]">
        {/* Reflejo de la pantalla y rejilla técnica */}
        <div className="lab-grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/6 to-transparent" />
        <div className="lab-scanline pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-lab-accent/6 to-transparent" />

        {/* Barra de estado de la tablet */}
        <div className="relative flex items-center justify-between border-b border-lab-line/70 px-5 py-2 font-mono text-[10px] tracking-widest text-lab-muted">
          <span className="text-lab-accent">● PERSONNEL FILE</span>
          <span>V. ECHEVARRÍA · REV 2026</span>
        </div>

        {/* Cabecera */}
        <header className="relative flex items-center gap-4 px-5 py-4 sm:px-6">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-lab-accent-dim/60 bg-lab-accent-dim/15 text-lg font-bold text-lab-accent">
            VE
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-lab-text sm:text-lg">
              {profile.name}
            </h2>
            <p className="truncate text-xs font-medium tracking-wide text-lab-accent">
              {profile.title}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.uiClick()
              toggleTablet()
            }}
            onMouseEnter={() => sfx.uiHover()}
            className="shrink-0 rounded-md border border-lab-line px-2.5 py-1 font-mono text-[11px] text-lab-muted transition-colors hover:border-lab-accent hover:text-lab-accent"
          >
            TAB
          </button>
        </header>

        {/* Pestañas */}
        <nav className="relative flex gap-1 overflow-x-auto border-b border-lab-line/70 px-4 sm:px-6">
          {TABS.map((tab) => {
            const isActive = tab.id === active.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sfx.uiClick()
                  setTabletTab(tab.id)
                }}
                onMouseEnter={() => sfx.uiHover()}
                className={`relative whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                  isActive ? 'text-lab-accent' : 'text-lab-muted hover:text-lab-text'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-lab-accent shadow-[0_0_8px] shadow-lab-accent" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Contenido */}
        <div className="lab-scroll relative flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <Body />
        </div>

        {/* Pie */}
        <footer className="relative flex items-center justify-between gap-3 border-t border-lab-line/70 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => {
              sfx.uiClick()
              toggleTablet()
            }}
            onMouseEnter={() => sfx.uiHover()}
            className="rounded-lg bg-lab-accent px-4 py-2 text-xs font-bold tracking-wide text-lab-bg transition-colors hover:bg-white"
          >
            Guardar la tablet
          </button>
          <span className="font-mono text-[10px] tracking-wider text-lab-muted">
            TAB o ESC para volver
          </span>
        </footer>
      </div>
    </div>
  )
}

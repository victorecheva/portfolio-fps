import { useEffect } from 'react'
import { sections } from '../data/portfolio'
import { useGame } from '../store/gameStore'
import { sfx } from '../lib/audio'
import { AboutContent, ContactContent, ExperienceContent, ProjectsContent } from './content'

/**
 * Panel que se abre al acertar en una diana.
 *
 * Se presenta como una consola del laboratorio, no como un modal de web: marco
 * técnico, cabecera con el identificador de la sección y cierre con Escape.
 */

const BODIES = {
  'sobre-mi': AboutContent,
  experiencia: ExperienceContent,
  proyectos: ProjectsContent,
  contacto: ContactContent,
} as const

export function SectionModal() {
  const phase = useGame((s) => s.phase)
  const activeSection = useGame((s) => s.activeSection)
  const closeSection = useGame((s) => s.closeSection)
  const toggleTablet = useGame((s) => s.toggleTablet)

  useEffect(() => {
    if (phase === 'section') sfx.uiClick()
  }, [phase])

  if (phase !== 'section' || !activeSection) return null

  const meta = sections.find((s) => s.id === activeSection)!
  const Body = BODIES[activeSection]

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-lab-bg/75 p-4 backdrop-blur-sm">
      <div className="lab-enter flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-lab-accent-dim/50 bg-lab-panel shadow-[0_0_60px_-15px] shadow-lab-accent/30">
        {/* Cabecera tipo consola */}
        <header className="flex items-center justify-between gap-4 border-b border-lab-line bg-lab-panel-2/70 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-lab-accent shadow-[0_0_10px] shadow-lab-accent" />
            <div>
              <h2 className="text-sm font-bold tracking-[0.16em] text-lab-text">{meta.label}</h2>
              <p className="font-mono text-[10px] tracking-wider text-lab-muted">
                {meta.hint.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.uiClick()
              closeSection()
            }}
            onMouseEnter={() => sfx.uiHover()}
            className="rounded-md border border-lab-line px-2.5 py-1 font-mono text-[11px] text-lab-muted transition-colors hover:border-lab-accent hover:text-lab-accent"
          >
            ESC
          </button>
        </header>

        <div className="lab-scroll flex-1 overflow-y-auto p-5 sm:p-6">
          <Body />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-lab-line bg-lab-panel-2/50 px-5 py-3">
          <button
            type="button"
            onClick={() => {
              sfx.uiClick()
              closeSection()
            }}
            onMouseEnter={() => sfx.uiHover()}
            className="rounded-lg bg-lab-accent px-4 py-2 text-xs font-bold tracking-wide text-lab-bg transition-colors hover:bg-white"
          >
            Volver al laboratorio
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.uiClick()
              toggleTablet()
            }}
            onMouseEnter={() => sfx.uiHover()}
            className="text-xs font-semibold text-lab-muted transition-colors hover:text-lab-accent"
          >
            Ver el CV completo (TAB)
          </button>
        </footer>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { profile } from '../data/portfolio'
import { AboutContent, ContactContent, ExperienceContent, ProjectsContent, SkillsContent } from './content'

/**
 * Versión clásica del portfolio.
 *
 * No es un plan B técnico, es la vista principal para media audiencia real:
 * quien lo abre desde el móvil, quien tiene la reducción de movimiento
 * activada, y el reclutador con quince pestañas abiertas que solo quiere leer
 * el CV. Sale del mismo `portfolio.ts` que el juego, así que nunca se
 * desincroniza, y su contenido está en el DOM para que el enlace se indexe y
 * se vea bien al compartirlo.
 */

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-lab-line/60 py-10">
      <p className="font-mono text-[10px] tracking-[0.28em] text-lab-accent">{eyebrow}</p>
      <h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-lab-text">{title}</h2>
      {children}
    </section>
  )
}

export function ClassicView({ onPlay, canPlay }: { onPlay: () => void; canPlay: boolean }) {
  // El body del juego bloquea el scroll; la vista clásica lo necesita.
  useEffect(() => {
    document.body.classList.add('classic-mode')
    return () => document.body.classList.remove('classic-mode')
  }, [])

  return (
    <div className="min-h-full bg-lab-bg">
      <header className="sticky top-0 z-10 border-b border-lab-line/60 bg-lab-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-lab-text">{profile.shortName}</p>
            <p className="truncate text-[11px] text-lab-muted">{profile.title}</p>
          </div>
          {canPlay && (
            <button
              type="button"
              onClick={onPlay}
              className="shrink-0 rounded-lg bg-lab-accent px-4 py-2 text-xs font-bold tracking-wide text-lab-bg transition-colors hover:bg-white"
            >
              Jugar la versión 3D
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20">
        <div className="py-12">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-lab-text sm:text-5xl">
            {profile.name}
          </h1>
          <p className="mt-2 text-lg font-medium text-lab-accent">{profile.title}</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-lab-muted">{profile.tagline}</p>
          {!canPlay && (
            <p className="mt-6 rounded-xl border border-lab-line bg-lab-panel/60 px-4 py-3 text-xs text-lab-muted">
              Este portfolio también existe como shooter en primera persona, pero necesita teclado
              y ratón. Ábrelo desde un ordenador para recorrerlo.
            </p>
          )}
        </div>

        <Section id="sobre-mi" eyebrow="01 · PERFIL" title="Sobre mí">
          <AboutContent />
        </Section>

        <Section id="experiencia" eyebrow="02 · TRAYECTORIA" title="Experiencia">
          <ExperienceContent />
        </Section>

        <Section id="proyectos" eyebrow="03 · TRABAJO" title="Proyectos">
          <ProjectsContent />
        </Section>

        <Section id="skills" eyebrow="04 · HERRAMIENTAS" title="Tecnologías">
          <SkillsContent />
        </Section>

        <Section id="contacto" eyebrow="05 · CONTACTO" title="Hablemos">
          <ContactContent />
        </Section>
      </main>

      <footer className="border-t border-lab-line/60 py-8 text-center">
        <p className="text-xs text-lab-muted">
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p className="mt-1 text-[11px] text-lab-muted/70">
          Hecho con React, Three.js y Rapier. Toda la escena 3D está generada por código: el
          proyecto no incluye ningún modelo ni sonido externo.
        </p>
      </footer>
    </div>
  )
}

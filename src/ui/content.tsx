import { profile, jobs, projects, skillGroups, contactLinks } from '../data/portfolio'

/**
 * Bloques de contenido del CV, reutilizados por los tres sitios donde aparece
 * la misma información: los modales del juego, la tablet y la versión clásica.
 *
 * Escribirlos una vez es lo que garantiza que las tres vistas no se
 * desincronicen cuando Víctor actualice `portfolio.ts`.
 */

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-lab-accent-dim/50 bg-lab-accent-dim/12 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-lab-accent">
      {children}
    </span>
  )
}

export function AboutContent() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-lab-text">{profile.name}</h3>
        <p className="text-sm font-medium tracking-wide text-lab-accent">{profile.title}</p>
      </div>
      {profile.bio.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-relaxed text-lab-muted">
          {paragraph}
        </p>
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        {skillGroups
          .flatMap((g) => g.items)
          .slice(0, 10)
          .map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
      </div>
    </div>
  )
}

export function ExperienceContent() {
  return (
    <ol className="relative space-y-6 border-l border-lab-line pl-6">
      {jobs.map((job) => (
        <li key={job.company} className="relative">
          <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-lab-accent ring-4 ring-lab-accent/15" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="font-bold text-lab-text">{job.role}</h3>
            <span className="font-mono text-[11px] text-lab-muted">{job.period}</span>
          </div>
          <p className="text-sm font-medium text-lab-accent">{job.company}</p>
          <ul className="mt-2 space-y-1.5">
            {job.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-lab-muted">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-lab-muted/60" />
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {job.tech.map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function ProjectsContent() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((project) => (
        <article
          key={project.name}
          className="flex flex-col rounded-lg border border-lab-line bg-lab-panel-2/60 p-4 transition-colors hover:border-lab-accent-dim"
        >
          <h3 className="font-bold text-lab-text">{project.name}</h3>
          <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-lab-muted">
            {project.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tech.map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </div>
          {(project.repo || project.demo) && (
            <div className="mt-3 flex gap-3 text-xs font-semibold">
              {project.repo && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-lab-accent underline decoration-lab-accent-dim underline-offset-2 hover:text-white"
                >
                  Código
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-lab-accent underline decoration-lab-accent-dim underline-offset-2 hover:text-white"
                >
                  Ver en vivo
                </a>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

export function SkillsContent() {
  return (
    <div className="space-y-5">
      {skillGroups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-[11px] font-bold tracking-[0.18em] text-lab-muted">
            {group.label.toUpperCase()}
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ContactContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-lab-muted">
        Estoy abierto a nuevas oportunidades y a proyectos donde seguir aprendiendo. La forma más
        directa de escribirme es a través de estos perfiles:
      </p>
      <div className="space-y-2">
        {contactLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center justify-between rounded-lg border border-lab-line bg-lab-panel-2/60 px-4 py-3 transition-colors hover:border-lab-accent"
          >
            <span className="text-sm font-semibold text-lab-text">{link.label}</span>
            <span className="font-mono text-xs text-lab-accent">{link.value}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

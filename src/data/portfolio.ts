/**
 * Única fuente de verdad del contenido del portfolio.
 *
 * Nada de este fichero conoce el 3D: la escena, la tablet, los modales y la
 * versión clásica leen todos de aquí. Para actualizar el CV solo se toca esto.
 */

export type SectionId = 'sobre-mi' | 'experiencia' | 'proyectos' | 'contacto'

export interface Job {
  company: string
  role: string
  period: string
  bullets: string[]
  tech: string[]
}

export interface Project {
  name: string
  summary: string
  tech: string[]
  repo?: string
  demo?: string
}

export interface SkillGroup {
  label: string
  items: string[]
}

export interface ContactLink {
  label: string
  value: string
  href: string
}

export const profile = {
  name: 'Víctor Echevarría García',
  shortName: 'Víctor Echevarría',
  title: 'Desarrollador Full-Stack Junior',
  tagline: 'Convierto ideas en soluciones funcionales y creativas.',
  bio: [
    'Soy Víctor Echevarría García, desarrollador Full-Stack junior con una gran pasión por la programación.',
    'Me gusta transformar ideas en soluciones funcionales y creativas. Para mí programar es mucho más que escribir sintaxis: es una forma de resolver problemas.',
    'Me muevo con soltura tanto en el front-end como en el back-end, me siento cómodo ante retos nuevos y disfruto trabajando en equipo, con la vista puesta en seguir aprendiendo de forma continua.',
  ],
  location: 'España',
  photo: 'victor2.jpeg',
} as const

// Orden cronológico inverso: el timeline de la tablet y de la versión clásica
// pintan este array tal cual, así que el puesto actual va siempre primero.
export const jobs: Job[] = [
  {
    company: 'nbGroup',
    role: 'Desarrollador Full-Stack',
    period: 'Febrero 2026 — Actualidad',
    bullets: [
      'Mantenimiento y configuración de tiendas PrestaShop.',
      'Desarrollo de aplicaciones web personalizadas para clientes.',
      'Desarrollo en AL para Dynamics 365 Business Central.',
    ],
    tech: ['React', 'PrestaShop', 'AL', 'Dynamics 365 Business Central'],
  },
  {
    company: 'Circontrol',
    role: 'DevOps & Desarrollador Web',
    period: 'Abril 2024 — Abril 2025',
    bullets: [
      'Prácticas duales combinando tareas de DevOps y desarrollo web.',
      'Automatización de despliegues con Docker mediante CI/CD.',
      'Desarrollo de proyectos web con Angular y Django, buscando soluciones escalables.',
    ],
    tech: ['Docker', 'CI/CD', 'Angular', 'Django'],
  },
  {
    company: 'Noria — TICKobex',
    role: 'Técnico de Soporte IT',
    period: 'Abril 2023 — Diciembre 2024',
    bullets: [
      'Prácticas de soporte técnico: montaje y configuración de equipos para clientes.',
      'Mantenimiento de equipos y resolución de incidencias.',
      'Atención al cliente tanto presencial como en remoto.',
    ],
    tech: ['Hardware', 'Soporte técnico', 'Atención al cliente'],
  },
]

export const skillGroups: SkillGroup[] = [
  { label: 'Front-end', items: ['Angular', 'React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML', 'CSS'] },
  { label: 'Back-end', items: ['Node.js', 'Express', 'Django', 'Python', 'PostgreSQL'] },
  { label: 'DevOps', items: ['Docker', 'CI/CD', 'GitHub Actions', 'Git'] },
  { label: 'ERP y e-commerce', items: ['PrestaShop', 'AL', 'Dynamics 365 Business Central'] },
  { label: 'Otros', items: ['Java', 'Three.js', 'Soporte IT', 'Trabajo en equipo'] },
]

export const projects: Project[] = [
  {
    name: 'Portfolio FPS 3D',
    summary:
      'Este mismo portfolio: un shooter en primera persona donde las secciones se abren disparando y el CV se consulta sacando una tablet. Escena y modelos generados por código, sin assets externos.',
    tech: ['React', 'TypeScript', 'Three.js', 'React Three Fiber', 'Rapier'],
  },
  {
    name: 'Recipes',
    summary:
      'Aplicación web para gestionar recetas semanales, con login funcional y base de datos PostgreSQL. Front en React y API en Node + Express.',
    tech: ['TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL'],
    repo: 'https://github.com/victorecheva/recipes',
  },
  {
    name: 'Portfolio (versión clásica)',
    summary:
      'Mi portfolio web responsive con navegación intuitiva, desplegado en GitHub Pages con CI/CD automatizado.',
    tech: ['Angular', 'Tailwind CSS', 'GitHub Actions'],
    repo: 'https://github.com/victorecheva/portfolio',
    demo: 'https://victorecheva.github.io/portfolio/',
  },
  {
    name: 'tetris.js',
    summary: 'Un Tetris completo hecho a mano en JavaScript, como ejercicio de lógica de juego y renderizado en canvas.',
    tech: ['JavaScript', 'Canvas'],
    repo: 'https://github.com/victorecheva/tetris.js',
    demo: 'https://victorecheva.github.io/tetris.js/',
  },
  {
    name: 'TarroUtils',
    summary: 'Plugin de servidor para Minecraft desarrollado en Java, con utilidades y comandos personalizados.',
    tech: ['Java', 'Spigot API'],
    repo: 'https://github.com/victorecheva/TarroUtils',
  },
  {
    name: 'Lista de deseos',
    summary: 'Aplicación de lista de deseos para practicar gestión de estado y persistencia en el navegador.',
    tech: ['JavaScript'],
    repo: 'https://github.com/victorecheva/lista-deseos',
  },
]

/**
 * TODO(Víctor): falta tu email público, si quieres publicarlo.
 * Se ha dejado fuera a propósito: un portfolio es una página pública y publicar
 * una dirección de correo es una decisión tuya, no mía.
 */
export const contactLinks: ContactLink[] = [
  {
    label: 'LinkedIn',
    value: 'in/victor-echevarria-garcia03',
    href: 'https://www.linkedin.com/in/victor-echevarria-garcia03/',
  },
  {
    label: 'GitHub',
    value: 'github.com/victorecheva',
    href: 'https://github.com/victorecheva',
  },
]

export interface SectionMeta {
  id: SectionId
  label: string
  hint: string
}

/** Orden y etiquetas de las cuatro dianas de la sala. */
export const sections: SectionMeta[] = [
  { id: 'sobre-mi', label: 'SOBRE MÍ', hint: 'Quién soy' },
  { id: 'experiencia', label: 'EXPERIENCIA', hint: 'Dónde he trabajado' },
  { id: 'proyectos', label: 'PROYECTOS', hint: 'Qué he construido' },
  { id: 'contacto', label: 'CONTACTO', hint: 'Hablemos' },
]

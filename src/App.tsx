import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { detectCapabilities } from './lib/capabilities'
import { sfx } from './lib/audio'
import { useGame } from './store/gameStore'
import { ClassicView } from './ui/ClassicView'

/**
 * Raíz de la aplicación.
 *
 * Dos modos sobre los mismos datos: el juego en primera persona y el CV en
 * versión clásica. El primero se carga con `lazy()`, así que la versión
 * clásica se sirve sin una línea de Three.js — que es justo lo que necesita
 * quien la abre desde el móvil.
 */

const GameMode = lazy(() => import('./GameMode'))

function BootScreen() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-lab-bg">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-lab-line border-t-lab-accent" />
        <p className="mt-4 font-mono text-[11px] tracking-[0.25em] text-lab-muted">
          CARGANDO EL MOTOR 3D
        </p>
      </div>
    </div>
  )
}

export default function App() {
  // Se mide una sola vez: no cambia mientras la pestaña está abierta.
  const capabilities = useMemo(() => detectCapabilities(), [])
  const [mode, setMode] = useState<'game' | 'classic'>(capabilities.canPlay ? 'game' : 'classic')
  const toMenu = useGame((s) => s.toMenu)

  const goClassic = useCallback(() => {
    sfx.stopAmbient()
    toMenu()
    setMode('classic')
  }, [toMenu])

  const goGame = useCallback(() => {
    toMenu()
    setMode('game')
  }, [toMenu])

  if (mode === 'classic') {
    return <ClassicView onPlay={goGame} canPlay={capabilities.canPlay} />
  }

  return (
    <>
      <Suspense fallback={<BootScreen />}>
        <GameMode capabilities={capabilities} onClassic={goClassic} />
      </Suspense>

      {/* El canvas es invisible para buscadores y lectores de pantalla, así que
          el contenido esencial también vive en el DOM. Quien navegue con
          teclado encuentra aquí la salida a la versión legible. */}
      <div className="sr-only">
        <h1>Víctor Echevarría García — Desarrollador Full-Stack Junior</h1>
        <p>
          Portfolio interactivo en 3D. Si usas un lector de pantalla o prefieres leer el currículum
          como una página normal, cambia a la versión clásica.
        </p>
        <button type="button" onClick={goClassic}>
          Ver el currículum en versión clásica
        </button>
      </div>
    </>
  )
}

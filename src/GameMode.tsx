import { Suspense, useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './game/Scene'
import { CAMERA, PLAYER } from './game/constants'
import type { Capabilities } from './lib/capabilities'
import { useGame } from './store/gameStore'
import { HUD } from './ui/HUD'
import { MainMenu } from './ui/MainMenu'
import { PauseMenu } from './ui/PauseMenu'
import { SectionModal } from './ui/SectionModal'
import { TabletOverlay } from './ui/TabletOverlay'
import { useGlobalKeys } from './ui/useGlobalKeys'

/**
 * Modo juego completo: canvas 3D y todas sus superposiciones.
 *
 * Vive en su propio módulo para que `App` lo cargue con `lazy()`. Three.js y
 * el WebAssembly de Rapier pesan más de un mega, y quien abre el portfolio en
 * el móvil para leer el CV no tiene por qué descargarlos.
 */

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-lab-bg">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-lab-line border-t-lab-accent" />
        <p className="mt-4 font-mono text-[11px] tracking-[0.25em] text-lab-muted">
          INICIALIZANDO LABORATORIO
        </p>
      </div>
    </div>
  )
}

export default function GameMode({
  capabilities,
  onClassic,
}: {
  capabilities: Capabilities
  onClassic: () => void
}) {
  const [sceneReady, setSceneReady] = useState(false)
  const phase = useGame((s) => s.phase)

  useGlobalKeys(true)

  const handleReady = useCallback(() => setSceneReady(true), [])

  return (
    <div className="fixed inset-0">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: PLAYER.spawn }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        // El canvas no debe robar el foco del teclado a la interfaz.
        tabIndex={-1}
      >
        <Suspense fallback={null}>
          <Scene onReady={handleReady} />
        </Suspense>
      </Canvas>

      {!sceneReady && <LoadingScreen />}

      {sceneReady && (
        <>
          <HUD />
          <SectionModal />
          <TabletOverlay />
          <PauseMenu onClassic={onClassic} />
          <MainMenu capabilities={capabilities} onClassic={onClassic} />
        </>
      )}

      {/* Marca discreta mientras se juega. */}
      {phase === 'playing' && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-10 text-right">
          <p className="font-mono text-[10px] tracking-[0.2em] text-lab-muted/70">
            VÍCTOR ECHEVARRÍA · PORTFOLIO
          </p>
        </div>
      )}
    </div>
  )
}

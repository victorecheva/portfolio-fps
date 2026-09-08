import { useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import { Level } from './Level'
import { Player } from './Player'
import { Controls } from './Controls'
import { Weapon } from './Weapon'
import { Impacts } from './Impacts'
import { SectionTarget } from './SectionTarget'
import { DebugBridge } from './DebugBridge'
import { LabEnvironment } from './LabEnvironment'
import { TARGET_PLACEMENTS, PALETTE, ROOM } from './constants'
import { useGame } from '../store/gameStore'

/**
 * Composición de la escena.
 *
 * Iluminación deliberadamente sencilla: hemisférica + direccional para el
 * ambiente blanco del laboratorio, y las luces puntuales de las luminarias
 * solo en calidad alta. Nada de mapas de entorno HDR, que serían una descarga
 * de varios megas para un portfolio que debe abrir al instante.
 */
/**
 * Avisa de que la escena está viva.
 *
 * Va dentro de `<Physics>` a propósito: Rapier carga su módulo WebAssembly y
 * suspende hasta tenerlo, así que este componente solo se monta cuando la
 * física ya responde. Es la señal honesta de "listo para jugar".
 */
function ReadyBeacon({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.()
  }, [onReady])
  return null
}

export function Scene({ onReady }: { onReady?: () => void }) {
  const highQuality = useGame((s) => s.settings.highQuality)

  return (
    <>
      <color attach="background" args={['#0b1015']} />
      {/* La diagonal de la sala son ~40 m: la niebla arranca más allá para
          suavizar solo las esquinas lejanas sin ensuciar el blanco del
          laboratorio. */}
      <fog attach="fog" args={['#0b1015', 30, 72]} />

      <LabEnvironment />

      {/* Con el mapa de entorno activo, la luz directa se reduce: sumar las dos
          a plena potencia quema los blancos de la sala y borra la rejilla del
          suelo. */}
      <hemisphereLight args={['#ffffff', '#4a5c68', 0.45]} />
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[6, ROOM.height + 4, 8]}
        intensity={highQuality ? 0.75 : 1}
        color="#eaf6ff"
        castShadow={highQuality}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-ROOM.half}
        shadow-camera-right={ROOM.half}
        shadow-camera-top={ROOM.half}
        shadow-camera-bottom={-ROOM.half}
        shadow-bias={-0.0004}
      />
      {/* Relleno frío desde el suelo: evita que las sombras salgan negras. */}
      <pointLight position={[0, 1, 0]} intensity={3} distance={20} color={PALETTE.accentDim} />

      <Physics timeStep="vary" gravity={[0, -22, 0]}>
        <ReadyBeacon onReady={onReady} />
        <Level highQuality={highQuality} />
        <Player />
        {TARGET_PLACEMENTS.map((t) => (
          <SectionTarget key={t.id} id={t.id} position={t.position} rotationY={t.rotationY} />
        ))}
      </Physics>

      <Impacts />
      <Weapon />
      <Controls />
      {import.meta.env.DEV && <DebugBridge />}
    </>
  )
}

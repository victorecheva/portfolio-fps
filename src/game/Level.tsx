import { useMemo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { ROOM, PALETTE } from './constants'
import { createGridTexture } from '../lib/labelTexture'

/**
 * El laboratorio.
 *
 * Toda la geometría es procedural (cajas y cilindros): no se descarga ni un
 * modelo. Para una estética de "laboratorio limpio" eso no es una limitación,
 * son justo las formas que hacen falta, y el nivel carga al instante.
 *
 * Las colisiones son colliders de caja colocados a mano, mucho más baratos que
 * un trimesh de la escena.
 */

const { half, height, wallThickness } = ROOM

/** Franja de luz empotrada. Emisiva, no ilumina de verdad (coste cero). */
function LightStrip({
  position,
  size,
  intensity = 2.4,
}: {
  position: [number, number, number]
  size: [number, number, number]
  intensity?: number
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={PALETTE.accent}
        emissive={PALETTE.accent}
        emissiveIntensity={intensity}
        toneMapped={false}
      />
    </mesh>
  )
}

/** Rodapié de las cuatro paredes con su franja de luz. */
function Skirting() {
  const strips: Array<{ position: [number, number, number]; size: [number, number, number] }> = [
    { position: [0, 0.12, -half + 0.1], size: [half * 2, 0.05, 0.06] },
    { position: [0, 0.12, half - 0.1], size: [half * 2, 0.05, 0.06] },
    { position: [-half + 0.1, 0.12, 0], size: [0.06, 0.05, half * 2] },
    { position: [half - 0.1, 0.12, 0], size: [0.06, 0.05, half * 2] },
  ]
  return (
    <group>
      {strips.map((s, i) => (
        <LightStrip key={i} position={s.position} size={s.size} intensity={1.6} />
      ))}
    </group>
  )
}

/** Luminarias del techo: rejilla de paneles con luz real solo en los centrales. */
function CeilingLights({ highQuality }: { highQuality: boolean }) {
  const cells = useMemo(() => {
    const out: Array<{ x: number; z: number; lit: boolean }> = []
    const step = 7
    for (let x = -half + 3.5; x < half; x += step) {
      for (let z = -half + 3.5; z < half; z += step) {
        out.push({ x, z, lit: Math.abs(x) < 8 && Math.abs(z) < 8 })
      }
    }
    return out
  }, [])

  return (
    <group>
      {cells.map((c, i) => (
        <group key={i} position={[c.x, height - 0.08, c.z]}>
          <mesh>
            <boxGeometry args={[3.2, 0.12, 1.1]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#eaf7ff"
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>
          {highQuality && c.lit && (
            <pointLight position={[0, -1, 0]} intensity={9} distance={16} decay={2} color="#dff3ff" />
          )}
        </group>
      ))}
    </group>
  )
}

/** Columna estructural con anillo luminoso. */
function Pillar({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[1, height, 1]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[1.06, 0.06, 1.06]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      <CuboidCollider args={[0.5, height / 2, 0.5]} position={[0, height / 2, 0]} />
    </RigidBody>
  )
}

/** Mesa de laboratorio: sirve de cobertura y de obstáculo para saltar. */
function Bench({
  position,
  rotationY = 0,
  length = 4,
}: {
  position: [number, number, number]
  rotationY?: number
  length?: number
}) {
  const topY = 0.95
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow position={[0, topY, 0]}>
        <boxGeometry args={[length, 0.1, 1.2]} />
        <meshStandardMaterial color="#f2f6f8" roughness={0.35} metalness={0.1} />
      </mesh>
      <mesh castShadow position={[0, topY / 2, 0]}>
        <boxGeometry args={[length - 0.4, topY, 0.9]} />
        <meshStandardMaterial color={PALETTE.wallTrim} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Monitor de diagnóstico, puro decorado. */}
      <mesh position={[length / 2 - 0.9, topY + 0.42, 0]} rotation={[0, -0.35, 0]}>
        <boxGeometry args={[0.9, 0.55, 0.05]} />
        <meshStandardMaterial
          color="#0f1b22"
          emissive={PALETTE.accentDim}
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>
      <CuboidCollider args={[length / 2, topY / 2 + 0.05, 0.6]} position={[0, topY / 2 + 0.05, 0]} />
    </RigidBody>
  )
}

/**
 * Isla central: pedestal con núcleo luminoso, el foco visual de la sala.
 *
 * Su altura no es un detalle estético. Las dianas están a 2,4 m y los ojos del
 * jugador a 1,7 m: cualquier cosa en el centro que sobrepase los 1,7 m tapa la
 * línea de tiro desde el extremo opuesto de la sala, porque el rayo solo sube.
 * Por eso todo el conjunto remata por debajo de esa cota.
 */
const CORE_TOP = 1.6

function CentralCore() {
  const orbRadius = 0.35
  const orbY = CORE_TOP - orbRadius
  return (
    <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
      <mesh receiveShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[3.4, 3.6, 0.3, 48]} />
        <meshStandardMaterial color="#e8eef1" roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Un toro nace en el plano XY, o sea de canto como un aro. Hay que
          tumbarlo para que sea el anillo luminoso del suelo. */}
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.1, 0.035, 8, 64]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      {/* Acero cepillado, no negro: un cono oscuro en medio de una sala blanca
          se lee como un agujero. */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.42, 0.6, 0.8, 24]} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[0, orbY, 0]}>
        <icosahedronGeometry args={[orbRadius, 1]} />
        <meshStandardMaterial
          color={PALETTE.glass}
          emissive={PALETTE.accent}
          emissiveIntensity={1.4}
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, orbY, 0]} intensity={9} distance={12} decay={2} color={PALETTE.accent} />
      <CuboidCollider args={[3.5, 0.15, 3.5]} position={[0, 0.15, 0]} />
      <CuboidCollider args={[0.6, 0.4, 0.6]} position={[0, 0.55, 0]} />
    </RigidBody>
  )
}

export function Level({ highQuality }: { highQuality: boolean }) {
  const floorTexture = useMemo(() => {
    const t = createGridTexture(512, PALETTE.floorLine, PALETTE.floor, 4)
    t.repeat.set(half, half)
    return t
  }, [])

  // Un panel de pared se compone de la pared maciza más un zócalo de cierre.
  const walls: Array<{ position: [number, number, number]; size: [number, number, number] }> = [
    { position: [0, height / 2, -half - wallThickness / 2], size: [half * 2 + wallThickness * 2, height, wallThickness] },
    { position: [0, height / 2, half + wallThickness / 2], size: [half * 2 + wallThickness * 2, height, wallThickness] },
    { position: [-half - wallThickness / 2, height / 2, 0], size: [wallThickness, height, half * 2 + wallThickness * 2] },
    { position: [half + wallThickness / 2, height / 2, 0], size: [wallThickness, height, half * 2 + wallThickness * 2] },
  ]

  return (
    <group>
      {/* Suelo */}
      <RigidBody type="fixed" colliders={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[half * 2, half * 2]} />
          <meshStandardMaterial map={floorTexture} roughness={0.45} metalness={0.25} color="#ffffff" />
        </mesh>
        <CuboidCollider args={[half, 0.5, half]} position={[0, -0.5, 0]} />
      </RigidBody>

      {/* Techo */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[half * 2, half * 2]} />
        <meshStandardMaterial color={PALETTE.ceiling} roughness={0.9} />
      </mesh>

      {/* Paredes */}
      {walls.map((w, i) => (
        <RigidBody key={i} type="fixed" colliders={false}>
          <mesh position={w.position} receiveShadow>
            <boxGeometry args={w.size} />
            <meshStandardMaterial color={PALETTE.wall} roughness={0.75} metalness={0.05} />
          </mesh>
          <CuboidCollider
            args={[w.size[0] / 2, w.size[1] / 2, w.size[2] / 2]}
            position={w.position}
          />
        </RigidBody>
      ))}

      {/* Techo invisible: evita que el jugador se salga por arriba al saltar. */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[half, 0.5, half]} position={[0, height + 0.5, 0]} />
      </RigidBody>

      <Skirting />
      <CeilingLights highQuality={highQuality} />
      <CentralCore />

      {/* Columnas en las cuatro esquinas. */}
      {([
        [-half + 2.5, 0, -half + 2.5],
        [half - 2.5, 0, -half + 2.5],
        [-half + 2.5, 0, half - 2.5],
        [half - 2.5, 0, half - 2.5],
      ] as Array<[number, number, number]>).map((p, i) => (
        <Pillar key={i} position={p} />
      ))}

      {/* Mobiliario: rompe la sala y da referencias de profundidad al moverse. */}
      <Bench position={[-8, 0, -6]} rotationY={0.4} />
      <Bench position={[8, 0, -6]} rotationY={-0.4} />
      <Bench position={[-8, 0, 7]} rotationY={-0.5} length={3} />
      <Bench position={[8, 0, 7]} rotationY={0.5} length={3} />

      {/* Cajas apilables: dan sensación de escala y sirven para saltar. */}
      {([
        [-4.5, 0.5, -11],
        [-3.4, 0.5, -11.4],
        [-4, 1.5, -11.2],
        [5.5, 0.5, 11],
        [6.6, 0.5, 11.3],
      ] as Array<[number, number, number]>).map((p, i) => (
        <RigidBody key={i} type="fixed" colliders={false} position={p}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#cdd8de" roughness={0.6} metalness={0.15} />
          </mesh>
          <mesh>
            <boxGeometry args={[1.02, 0.08, 1.02]} />
            <meshStandardMaterial
              color={PALETTE.accentDim}
              emissive={PALETTE.accentDim}
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
          <CuboidCollider args={[0.5, 0.5, 0.5]} />
        </RigidBody>
      ))}
    </group>
  )
}

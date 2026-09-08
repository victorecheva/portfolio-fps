import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { SectionId } from '../data/portfolio'
import { sections } from '../data/portfolio'
import { PALETTE } from './constants'
import { useGame } from '../store/gameStore'
import { useLabelTexture } from '../lib/labelTexture'
import { on } from '../lib/events'

/**
 * Panel-diana de una sección.
 *
 * El panel no sabe qué es "Experiencia": recibe un `sectionId`, marca sus
 * mallas con él en `userData` y el arma se encarga de resolver el impacto. Así
 * añadir una sección es añadir una entrada de datos, no tocar el 3D.
 */

const PANEL_SIZE = 3.4

export function SectionTarget({
  id,
  position,
  rotationY,
}: {
  id: SectionId
  position: [number, number, number]
  rotationY: number
}) {
  const meta = sections.find((s) => s.id === id)!
  const aimed = useGame((s) => s.aimedSection === id)
  const visited = useGame((s) => s.visited.includes(id))

  const labelTexture = useLabelTexture({
    text: meta.label,
    width: 1024,
    ratio: 0.22,
    color: '#0e1a24',
    fontSize: 132,
  })
  const hintTexture = useLabelTexture({
    text: meta.hint.toUpperCase(),
    width: 1024,
    ratio: 0.16,
    color: '#5c7180',
    fontSize: 74,
    fontWeight: 600,
    letterSpacing: 14,
  })

  const rings = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const glowMaterial = useRef<THREE.MeshStandardMaterial>(null)
  /** 1 justo tras el impacto, decae a 0: alimenta el "golpe" visual. */
  const punch = useRef(0)

  useEffect(
    () =>
      on('targetHit', (e) => {
        if (e.sectionId === id) punch.current = 1
      }),
    [id],
  )

  const baseColor = useMemo(
    () => new THREE.Color(visited ? PALETTE.targetDone : PALETTE.accent),
    [visited],
  )

  useFrame((state, delta) => {
    punch.current = Math.max(0, punch.current - delta * 2.6)
    const p = punch.current
    const t = state.clock.elapsedTime

    // Latido lento en reposo, más vivo si el jugador está apuntando.
    const pulse = 0.6 + Math.sin(t * (aimed ? 5 : 1.8)) * (aimed ? 0.35 : 0.12)

    if (glowMaterial.current) {
      glowMaterial.current.emissiveIntensity = pulse + p * 3
      glowMaterial.current.emissive.lerpColors(
        baseColor,
        new THREE.Color('#ffffff'),
        p * 0.7,
      )
    }
    if (rings.current) {
      // El impacto empuja los anillos hacia fuera y vuelven solos.
      const scale = 1 + p * 0.14 + (aimed ? 0.03 : 0)
      rings.current.scale.setScalar(THREE.MathUtils.damp(rings.current.scale.x, scale, 12, delta))
      rings.current.rotation.z += delta * (aimed ? 0.5 : 0.12)
    }
    if (core.current) {
      core.current.position.z = THREE.MathUtils.damp(core.current.position.z, -p * 0.12, 10, delta)
    }
  })

  return (
    <group position={position} rotation={[0, rotationY, 0]} userData={{ sectionId: id }}>
      {/* Marco empotrado en la pared */}
      <mesh position={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[PANEL_SIZE + 0.35, PANEL_SIZE + 0.35, 0.16]} />
        <meshStandardMaterial color="#f7fafb" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Fondo oscuro del panel: da contraste a los anillos */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[PANEL_SIZE, PANEL_SIZE, 0.08]} />
        <meshStandardMaterial color="#101c24" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Diana: anillos concéntricos */}
      <group ref={rings} position={[0, 0, 0.08]}>
        {[1.42, 1.05, 0.68].map((r, i) => (
          <mesh key={r} position={[0, 0, i * 0.004]}>
            <torusGeometry args={[r, 0.035, 8, 64]} />
            <meshStandardMaterial
              color={baseColor}
              emissive={baseColor}
              emissiveIntensity={1.2 - i * 0.2}
              toneMapped={false}
            />
          </mesh>
        ))}
        {/* Cruces de puntería en los cuatro ejes */}
        {[0, Math.PI / 2].map((rot) => (
          <mesh key={rot} rotation={[0, 0, rot]}>
            <boxGeometry args={[3, 0.02, 0.02]} />
            <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Centro luminoso. `circleGeometry` ya mira hacia +Z, como el panel. */}
      <mesh ref={core} position={[0, 0, 0.1]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial
          ref={glowMaterial}
          color="#ffffff"
          emissive={baseColor}
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>

      {/* Rótulo de la sección */}
      <mesh position={[0, PANEL_SIZE / 2 + 0.55, 0.04]}>
        <planeGeometry args={[3.6, 0.79]} />
        <meshBasicMaterial map={labelTexture} transparent toneMapped={false} />
      </mesh>

      {/* Subtítulo */}
      <mesh position={[0, -PANEL_SIZE / 2 - 0.42, 0.04]}>
        <planeGeometry args={[3.2, 0.51]} />
        <meshBasicMaterial map={hintTexture} transparent toneMapped={false} />
      </mesh>

      {/* Marca de visitada */}
      {visited && (
        <mesh position={[PANEL_SIZE / 2 - 0.25, PANEL_SIZE / 2 - 0.25, 0.09]}>
          <circleGeometry args={[0.12, 24]} />
          <meshStandardMaterial
            color={PALETTE.targetDone}
            emissive={PALETTE.targetDone}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      )}

      {aimed && <pointLight position={[0, 0, 1.4]} intensity={4} distance={5} color={baseColor} />}

      {/* El panel también es sólido: no se atraviesa. */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[PANEL_SIZE / 2, PANEL_SIZE / 2, 0.12]} />
      </RigidBody>
    </group>
  )
}

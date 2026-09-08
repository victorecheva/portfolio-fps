import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { MAX_DECALS, PALETTE } from './constants'
import { on } from '../lib/events'

/**
 * Marcas de impacto y trazadoras.
 *
 * Las marcas viven en un `InstancedMesh` con búfer circular: siempre son las
 * mismas 40 instancias, así que disparar no crea ni destruye objetos y el
 * recolector de basura no se despierta a mitad de partida.
 */

interface Decal {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  born: number
  active: boolean
}

const DECAL_LIFETIME = 6
const TRACER_LIFETIME = 0.09
const MAX_TRACERS = 6

/** Orienta un plano (que mira a +Z) contra la normal de la superficie. */
const FORWARD = new THREE.Vector3(0, 0, 1)

/** Los efectos son decorado: nunca deben interceptar un rayo de disparo. */
const NO_RAYCAST = () => {}

export function Impacts() {
  const decalMesh = useRef<THREE.InstancedMesh>(null)
  const tracerGroup = useRef<THREE.Group>(null)

  const decals = useMemo<Decal[]>(
    () =>
      Array.from({ length: MAX_DECALS }, () => ({
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        born: -Infinity,
        active: false,
      })),
    [],
  )

  const tracers = useMemo(
    () =>
      Array.from({ length: MAX_TRACERS }, () => ({
        from: new THREE.Vector3(),
        to: new THREE.Vector3(),
        born: -Infinity,
      })),
    [],
  )

  const cursor = useRef(0)
  const tracerCursor = useRef(0)
  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      scale: new THREE.Vector3(),
      mid: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      up: new THREE.Vector3(0, 1, 0),
      origin: new THREE.Vector3(),
    }),
    [],
  )

  // El origen de la trazadora se toma de la cámara con un offset a la derecha
  // para que parezca salir del cañón y no de la frente del jugador.
  const muzzleOffset = useMemo(() => new THREE.Vector3(0.24, -0.2, -0.45), [])

  useEffect(
    () =>
      on('hit', (e) => {
        const now = performance.now() / 1000
        const slot = decals[cursor.current]
        cursor.current = (cursor.current + 1) % MAX_DECALS
        slot.position.copy(e.point).addScaledVector(e.normal, 0.012)
        slot.quaternion.setFromUnitVectors(FORWARD, e.normal)
        slot.born = now
        slot.active = true

        const tracer = tracers[tracerCursor.current]
        tracerCursor.current = (tracerCursor.current + 1) % MAX_TRACERS
        tracer.to.copy(e.point)
        tracer.born = now
      }),
    [decals, tracers],
  )

  useFrame((state) => {
    const now = performance.now() / 1000
    const s = scratch

    // --- Marcas de impacto ---
    const mesh = decalMesh.current
    if (mesh) {
      for (let i = 0; i < MAX_DECALS; i++) {
        const d = decals[i]
        const age = now - d.born
        let scale = 0
        if (d.active && age < DECAL_LIFETIME) {
          // Golpe inicial que se abre rápido y luego se desvanece.
          const grow = Math.min(age / 0.05, 1)
          const fade = 1 - Math.max(0, (age - DECAL_LIFETIME * 0.55) / (DECAL_LIFETIME * 0.45))
          scale = 0.16 * grow * Math.max(fade, 0)
        } else if (d.active && age >= DECAL_LIFETIME) {
          d.active = false
        }
        s.scale.setScalar(scale)
        s.matrix.compose(d.position, d.quaternion, s.scale)
        mesh.setMatrixAt(i, s.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }

    // --- Trazadoras ---
    const group = tracerGroup.current
    if (group) {
      // Origen aproximado del cañón, en coordenadas de mundo.
      const origin = s.origin.copy(muzzleOffset).applyMatrix4(state.camera.matrixWorld)
      group.children.forEach((child, i) => {
        const tracer = tracers[i]
        const age = now - tracer.born
        if (age > TRACER_LIFETIME || tracer.born === -Infinity) {
          child.visible = false
          return
        }
        // El origen solo se fija en el primer frame de vida: si no, la
        // trazadora seguiría a la cámara mientras el jugador gira.
        if (age < 0.017) tracer.from.copy(origin)

        child.visible = true
        s.dir.subVectors(tracer.to, tracer.from)
        const length = s.dir.length()
        s.mid.copy(tracer.from).addScaledVector(s.dir, 0.5)
        child.position.copy(s.mid)
        // El cilindro nace a lo largo de Y: se alinea con la dirección de tiro.
        s.quat.setFromUnitVectors(s.up, s.dir.normalize())
        child.quaternion.copy(s.quat)
        const fade = 1 - age / TRACER_LIFETIME
        child.scale.set(fade, length, fade)
      })
    }
  })

  return (
    // `raycast` anulado: si no, los propios efectos interceptarían el disparo
    // siguiente y el jugador acabaría disparándole a su última bala.
    <group>
      <instancedMesh
        ref={decalMesh}
        args={[undefined, undefined, MAX_DECALS]}
        frustumCulled={false}
        raycast={NO_RAYCAST}
      >
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial
          color={PALETTE.accent}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      <group ref={tracerGroup}>
        {Array.from({ length: MAX_TRACERS }, (_, i) => (
          <mesh key={i} visible={false} frustumCulled={false} raycast={NO_RAYCAST}>
            <cylinderGeometry args={[0.012, 0.012, 1, 6, 1, true]} />
            <meshBasicMaterial
              color="#d9fbff"
              transparent
              opacity={0.75}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

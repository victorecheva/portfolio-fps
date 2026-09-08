import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import { PLAYER, CAMERA } from './constants'
import { useKeyboard, clearInput } from './useKeyboard'
import { useGame, isInteractive } from '../store/gameStore'
import { sfx } from '../lib/audio'

/**
 * Jugador: cápsula física + cámara en primera persona.
 *
 * El movimiento no asigna la velocidad de golpe, la acelera hacia la deseada.
 * Eso es lo que separa un FPS que responde bien de uno que patina: hay un
 * arranque y una parada cortos pero perceptibles, control reducido en el aire,
 * y la cámara acompaña con balanceo de paso y FOV dinámico al esprintar.
 */

// Medidas de la cápsula: altura total = 2*halfHeight + 2*radius.
const RADIUS = PLAYER.radius
const HALF_HEIGHT = PLAYER.height / 2 - RADIUS
/** Del centro de la cápsula a la planta de los pies. */
const CENTER_TO_FEET = HALF_HEIGHT + RADIUS
/** Del centro de la cápsula a los ojos. */
const CENTER_TO_EYES = PLAYER.eyeHeight - CENTER_TO_FEET

export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const input = useKeyboard()
  const { world, rapier } = useRapier()
  const camera = useThree((s) => s.camera)

  const phase = useGame((s) => s.phase)

  // Estado del bucle de movimiento. Fuera de React a propósito.
  const runtime = useRef({
    bobPhase: 0,
    grounded: true,
    wasGrounded: true,
    /** Instante del último salto, para no encadenarlos en un frame. */
    lastJump: 0,
    /** Margen de gracia tras dejar el suelo (coyote time). */
    lastGroundedAt: 0,
    footstepSide: 0,
  })

  // Vectores reutilizados: crear objetos en useFrame genera basura cada frame.
  const scratch = useRef({
    forward: new THREE.Vector3(),
    right: new THREE.Vector3(),
    wish: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    origin: new THREE.Vector3(),
  })

  useEffect(() => {
    camera.near = CAMERA.near
    camera.far = CAMERA.far
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = CAMERA.fov
      camera.updateProjectionMatrix()
    }
  }, [camera])

  // Al salir del modo juego se sueltan las teclas para no seguir andando solo.
  useEffect(() => {
    if (!isInteractive(phase)) {
      clearInput(input)
      body.current?.setLinvel({ x: 0, y: body.current.linvel().y, z: 0 }, true)
    }
  }, [phase, input])

  useFrame((state, rawDelta) => {
    const rb = body.current
    if (!rb) return

    // Un frame perdido (pestaña en segundo plano) no debe teletransportar
    // nada. El tope está en 1/15 y no más bajo a propósito: Rapier integra la
    // posición con el delta real, así que recortar de más aquí desacopla el
    // frenado del movimiento y el jugador patina en equipos lentos.
    const delta = Math.min(rawDelta, 1 / 15)
    const s = scratch.current
    const rt = runtime.current
    const active = isInteractive(phase)
    const keys = input.current

    const translation = rb.translation()
    const linvel = rb.linvel()

    // --- Contacto con el suelo -------------------------------------------
    s.origin.set(translation.x, translation.y, translation.z)
    let grounded = false
    try {
      const ray = new rapier.Ray(s.origin, { x: 0, y: -1, z: 0 })
      const hit = world.castRay(
        ray,
        CENTER_TO_FEET + 0.18,
        true,
        undefined,
        undefined,
        undefined,
        rb,
      )
      grounded = hit !== null
    } catch {
      // Si la escena física aún no está lista, se asume aire: caer es seguro.
      grounded = false
    }
    // Subir sin bajar nunca sería un salto infinito: solo cuenta si además
    // no estamos ascendiendo con fuerza.
    grounded = grounded && linvel.y < 1.5
    rt.grounded = grounded
    if (grounded) rt.lastGroundedAt = state.clock.elapsedTime

    if (grounded && !rt.wasGrounded && active) sfx.land()
    rt.wasGrounded = grounded

    // --- Dirección deseada ------------------------------------------------
    // Se toma de la cámara, pero aplanada: mirar al techo no debe frenarte.
    camera.getWorldDirection(s.forward)
    s.forward.y = 0
    s.forward.normalize()
    s.right.crossVectors(s.forward, THREE.Object3D.DEFAULT_UP).normalize()

    s.wish.set(0, 0, 0)
    if (active) {
      if (keys.forward) s.wish.add(s.forward)
      if (keys.back) s.wish.sub(s.forward)
      if (keys.right) s.wish.add(s.right)
      if (keys.left) s.wish.sub(s.right)
    }
    const hasInput = s.wish.lengthSq() > 0.0001
    if (hasInput) s.wish.normalize()

    const sprinting = active && keys.sprint && hasInput && grounded
    const targetSpeed = sprinting ? PLAYER.sprintSpeed : PLAYER.walkSpeed

    // --- Aceleración hacia la velocidad deseada ---------------------------
    const desiredX = s.wish.x * targetSpeed
    const desiredZ = s.wish.z * targetSpeed
    const rate = grounded ? (hasInput ? PLAYER.accel : PLAYER.damping) : PLAYER.airAccel

    let dx = desiredX - linvel.x
    let dz = desiredZ - linvel.z
    const deltaLen = Math.hypot(dx, dz)
    const maxDelta = rate * delta
    if (deltaLen > maxDelta && deltaLen > 0) {
      const k = maxDelta / deltaLen
      dx *= k
      dz *= k
    }

    let vy = linvel.y

    // --- Salto ------------------------------------------------------------
    const canJump =
      active &&
      keys.jump &&
      state.clock.elapsedTime - rt.lastJump > 0.25 &&
      state.clock.elapsedTime - rt.lastGroundedAt < 0.12
    if (canJump) {
      vy = PLAYER.jumpVelocity
      rt.lastJump = state.clock.elapsedTime
      rt.lastGroundedAt = -1
      sfx.jump()
    }

    rb.setLinvel({ x: linvel.x + dx, y: vy, z: linvel.z + dz }, true)

    // --- Cámara: posición, balanceo de paso y FOV -------------------------
    const speed = Math.hypot(linvel.x, linvel.z)
    if (grounded && speed > 0.6) {
      // La fase avanza con la distancia recorrida, no con el tiempo: al andar
      // despacio los pasos se separan solos.
      rt.bobPhase += delta * speed * 1.35
    } else {
      // Al pararse el balanceo vuelve al centro en vez de cortarse en seco.
      rt.bobPhase += delta * 6
      const wrapped = rt.bobPhase % Math.PI
      if (wrapped < 0.12) rt.bobPhase = 0
    }

    const bobAmount = grounded ? Math.min(speed / PLAYER.sprintSpeed, 1) : 0
    const bobY = Math.sin(rt.bobPhase * 2) * 0.045 * bobAmount
    const bobX = Math.cos(rt.bobPhase) * 0.03 * bobAmount

    camera.position.set(
      translation.x + s.right.x * bobX,
      translation.y + CENTER_TO_EYES + bobY,
      translation.z + s.right.z * bobX,
    )

    // Un paso por cada punto bajo del balanceo.
    const side = Math.sign(Math.sin(rt.bobPhase))
    if (grounded && speed > 1.2 && side !== rt.footstepSide) {
      rt.footstepSide = side
      if (active) sfx.footstep()
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = sprinting ? CAMERA.sprintFov : CAMERA.fov
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, delta)
        camera.updateProjectionMatrix()
      }
    }
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={PLAYER.spawn}
      // Sin esto la cápsula rueda por el suelo como un bidón.
      lockRotations
      // Rapier ya no debe frenarnos: el rozamiento lo controlamos nosotros.
      linearDamping={0}
      friction={0}
      restitution={0}
      canSleep={false}
      ccd
      mass={70}
    >
      <CapsuleCollider args={[HALF_HEIGHT, RADIUS]} />
    </RigidBody>
  )
}

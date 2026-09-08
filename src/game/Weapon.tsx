import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { PALETTE } from './constants'
import { useGame } from '../store/gameStore'
import { sfx } from '../lib/audio'
import { emit } from '../lib/events'
import type { SectionId } from '../data/portfolio'

/**
 * Arma y tablet en primera persona, más la resolución de los disparos.
 *
 * Ambos modelos se generan con primitivas y se montan como hijos de la cámara
 * mediante `createPortal`, que es la forma limpia de tener un *viewmodel*: se
 * mueven con la vista sin recalcular matrices a mano.
 *
 * El disparo es un raycast desde el centro de la pantalla. Si la malla tocada
 * (o alguno de sus padres) lleva un `sectionId` en `userData`, es una diana.
 */

/** Sube por la jerarquía buscando la sección marcada en `userData`. */
function findSectionId(object: THREE.Object3D | null): SectionId | null {
  let node: THREE.Object3D | null = object
  while (node) {
    const id = node.userData?.sectionId
    if (typeof id === 'string') return id as SectionId
    node = node.parent
  }
  return null
}

/** Blaster de laboratorio, montado con cajas y cilindros. */
function BlasterModel() {
  return (
    <group>
      {/* Cuerpo */}
      <mesh castShadow>
        <boxGeometry args={[0.09, 0.1, 0.34]} />
        <meshStandardMaterial color="#eef3f5" roughness={0.35} metalness={0.35} />
      </mesh>
      {/* Empuñadura, en el extremo cercano a la cámara */}
      <mesh position={[0, -0.1, 0.11]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.07, 0.15, 0.085]} />
        <meshStandardMaterial color={PALETTE.darkMetal} roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Cañón */}
      <mesh position={[0, 0.012, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.032, 0.24, 16]} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Boca del cañón. El toro nace ya en el plano XY, que es justo el aro
          alrededor del cañón: rotarlo lo pondría de canto. */}
      <mesh position={[0, 0.012, -0.4]}>
        <torusGeometry args={[0.038, 0.008, 8, 24]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      {/* Celda de energía, en el flanco visible desde la cámara */}
      <mesh position={[-0.055, 0.005, 0.02]}>
        <boxGeometry args={[0.025, 0.055, 0.16]} />
        <meshStandardMaterial
          color={PALETTE.glass}
          emissive={PALETTE.accent}
          emissiveIntensity={1.3}
          toneMapped={false}
        />
      </mesh>
      {/* Mira superior */}
      <mesh position={[0, 0.075, -0.13]}>
        <boxGeometry args={[0.02, 0.02, 0.05]} />
        <meshStandardMaterial color={PALETTE.darkMetal} roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

/** Tablet del CV: marco, pantalla emisiva y bisel. */
function TabletModel() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.44, 0.3, 0.014]} />
        <meshStandardMaterial color="#dfe7eb" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.009]}>
        <planeGeometry args={[0.4, 0.26]} />
        <meshStandardMaterial
          color="#0d1a22"
          emissive={PALETTE.accentDim}
          emissiveIntensity={1.1}
          toneMapped={false}
        />
      </mesh>
      {/* Franja de estado */}
      <mesh position={[0, -0.16, 0.004]}>
        <boxGeometry args={[0.18, 0.008, 0.006]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

/**
 * Posturas del viewmodel: arma en la mano, arma guardada y tablet dentro/fuera.
 *
 * Las distancias son pequeñas y muy sensibles: con un FOV de 76° cada
 * centímetro que el arma se acerca a la cámara le come una porción notable de
 * pantalla. De ahí la escala reducida y el empujón hacia -Z.
 */
const WEAPON_SCALE = 0.62
const WEAPON_READY = { pos: new THREE.Vector3(0.23, -0.22, -0.72), rot: new THREE.Euler(0.03, -0.12, 0.02) }
const WEAPON_STOWED = { pos: new THREE.Vector3(0.28, -0.62, -0.6), rot: new THREE.Euler(-1.1, -0.3, 0.2) }
const TABLET_OUT = { pos: new THREE.Vector3(0, -0.08, -0.5), rot: new THREE.Euler(-0.2, 0, 0) }
const TABLET_IN = { pos: new THREE.Vector3(0.05, -0.7, -0.45), rot: new THREE.Euler(-1.35, 0.1, 0) }

export function Weapon() {
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)

  const phase = useGame((s) => s.phase)
  const pointerLocked = useGame((s) => s.pointerLocked)
  const openSection = useGame((s) => s.openSection)
  const registerShot = useGame((s) => s.registerShot)
  const setAimedSection = useGame((s) => s.setAimedSection)

  const weaponGroup = useRef<THREE.Group>(null)
  const tabletGroup = useRef<THREE.Group>(null)
  const flash = useRef<THREE.Group>(null)

  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const screenCenter = useMemo(() => new THREE.Vector2(0, 0), [])
  const runtime = useRef({
    recoil: 0,
    flash: 0,
    lastShot: -1,
    /** Interpolación 0 = arma en mano, 1 = tablet desplegada. */
    tabletBlend: 0,
    frame: 0,
    prevCamPos: new THREE.Vector3(),
    speed: 0,
    swayQuat: new THREE.Quaternion(),
  })

  const tabletOpen = phase === 'tablet'

  /**
   * El renderizador solo recorre el grafo de la escena. La cámara por defecto
   * de R3F no cuelga de ella, así que sus hijos —nuestro viewmodel— no se
   * dibujarían nunca. Añadirla es inofensivo (es un Object3D más) y es lo que
   * hace visible el arma.
   *
   * Consecuencia buscada: a partir de aquí el arma sí aparece en los raycasts
   * de la escena, y por eso `castCenterRay` la descarta explícitamente.
   */
  useEffect(() => {
    if (!camera.parent) scene.add(camera)
  }, [camera, scene])

  useEffect(() => {
    if (tabletOpen) sfx.tabletOpen()
    else if (runtime.current.tabletBlend > 0.5) sfx.tabletClose()
  }, [tabletOpen])

  /** Lanza el rayo desde el centro de la pantalla y devuelve el impacto. */
  const castCenterRay = () => {
    raycaster.setFromCamera(screenCenter, camera)
    const hits = raycaster.intersectObjects(scene.children, true)
    for (const hit of hits) {
      // El arma y la tablet cuelgan de la cámara y están a medio metro: si no
      // se descartan, cada disparo impacta en el propio arma.
      let node: THREE.Object3D | null = hit.object
      let isViewmodel = false
      while (node) {
        if (node === camera) {
          isViewmodel = true
          break
        }
        node = node.parent
      }
      if (isViewmodel) continue
      // Sin `face` no hay superficie donde dejar la marca de impacto.
      if (!hit.face) continue
      return hit
    }
    return null
  }

  const shoot = () => {
    const rt = runtime.current
    const now = performance.now()
    // Cadencia: sin esto, mantener el clic dispararía cada frame.
    if (now - rt.lastShot < 180) return
    rt.lastShot = now

    rt.recoil = 1
    rt.flash = 1
    registerShot()
    sfx.shoot()

    const hit = castCenterRay()
    if (!hit) return

    const sectionId = findSectionId(hit.object)
    const normal = hit.face
      ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
      : new THREE.Vector3(0, 1, 0)

    emit('hit', { point: hit.point.clone(), normal, sectionId })

    if (sectionId) {
      emit('targetHit', { sectionId })
      sfx.targetHit()
      // Se deja ver el fogonazo y el golpe de la diana antes del modal.
      window.setTimeout(() => {
        if (useGame.getState().phase === 'playing') openSection(sectionId)
      }, 260)
    } else {
      sfx.impact()
    }
  }

  // En desarrollo, las pruebas automatizadas necesitan disparar sin ratón:
  // sin gesto real del usuario el navegador nunca captura el puntero, y el
  // disparo por clic está condicionado justamente a esa captura.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__labShoot = () => shoot()
    return () => {
      delete window.__labShoot
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const onPointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      // Sin puntero capturado, el clic sirve para recuperarlo, no para disparar.
      if (!useGame.getState().pointerLocked) return
      shoot()
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pointerLocked])

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30)
    const rt = runtime.current

    rt.recoil = Math.max(0, rt.recoil - delta * 5.5)
    rt.flash = Math.max(0, rt.flash - delta * 14)
    rt.tabletBlend = THREE.MathUtils.damp(rt.tabletBlend, tabletOpen ? 1 : 0, 9, delta)

    // Velocidad estimada del jugador a partir del desplazamiento de la cámara.
    const camPos = state.camera.position
    const moved = camPos.distanceTo(rt.prevCamPos) / delta
    rt.speed = THREE.MathUtils.damp(rt.speed, Math.min(moved, 12), 8, delta)
    rt.prevCamPos.copy(camPos)

    const blend = rt.tabletBlend
    const t = state.clock.elapsedTime

    // Balanceo del arma al caminar, en contrafase con la cámara.
    const walk = Math.min(rt.speed / 8, 1)
    const swayX = Math.sin(t * 6) * 0.012 * walk
    const swayY = Math.cos(t * 12) * 0.009 * walk

    if (weaponGroup.current) {
      const g = weaponGroup.current
      // Retroceso: el arma se va hacia atrás y cabecea hacia arriba.
      const kick = rt.recoil * rt.recoil
      g.position.set(
        THREE.MathUtils.lerp(WEAPON_READY.pos.x, WEAPON_STOWED.pos.x, blend) + swayX,
        THREE.MathUtils.lerp(WEAPON_READY.pos.y, WEAPON_STOWED.pos.y, blend) + swayY + kick * 0.012,
        THREE.MathUtils.lerp(WEAPON_READY.pos.z, WEAPON_STOWED.pos.z, blend) + kick * 0.06,
      )
      g.rotation.set(
        THREE.MathUtils.lerp(WEAPON_READY.rot.x, WEAPON_STOWED.rot.x, blend) + kick * 0.28,
        THREE.MathUtils.lerp(WEAPON_READY.rot.y, WEAPON_STOWED.rot.y, blend),
        THREE.MathUtils.lerp(WEAPON_READY.rot.z, WEAPON_STOWED.rot.z, blend),
      )
      g.visible = blend < 0.98
    }

    if (tabletGroup.current) {
      const g = tabletGroup.current
      g.position.lerpVectors(TABLET_IN.pos, TABLET_OUT.pos, blend)
      g.rotation.set(
        THREE.MathUtils.lerp(TABLET_IN.rot.x, TABLET_OUT.rot.x, blend),
        THREE.MathUtils.lerp(TABLET_IN.rot.y, TABLET_OUT.rot.y, blend),
        THREE.MathUtils.lerp(TABLET_IN.rot.z, TABLET_OUT.rot.z, blend),
      )
      g.visible = blend > 0.02
    }

    if (flash.current) {
      flash.current.visible = rt.flash > 0.05
      flash.current.scale.setScalar(0.4 + rt.flash * 1.1)
    }

    // Qué sección se está apuntando, para el HUD. Cada 3 frames basta y evita
    // un raycast completo a 60 Hz.
    rt.frame++
    if (phase === 'playing' && rt.frame % 3 === 0) {
      const hit = castCenterRay()
      setAimedSection(hit ? findSectionId(hit.object) : null)
    } else if (phase !== 'playing') {
      setAimedSection(null)
    }
  })

  return createPortal(
    <group>
      <group ref={weaponGroup} scale={WEAPON_SCALE}>
        <BlasterModel />
        {/* Fogonazo en la boca del cañón */}
        <group ref={flash} position={[0, 0.012, -0.42]} visible={false}>
          <mesh>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color="#eaffff" transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <pointLight intensity={9} distance={7} color={PALETTE.accent} />
        </group>
      </group>
      <group ref={tabletGroup} visible={false}>
        <TabletModel />
      </group>
    </group>,
    camera,
  )
}

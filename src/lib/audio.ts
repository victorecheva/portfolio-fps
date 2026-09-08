/**
 * Sonidos sintetizados con la Web Audio API.
 *
 * No hay ni un fichero de audio en el proyecto: cada efecto se genera con
 * osciladores y ruido. Así el juego carga al instante y no arrastra licencias
 * de assets de terceros.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let ambient: { osc: OscillatorNode; gain: GainNode } | null = null

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  return ctx
}

function getNoise(context: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const length = Math.floor(context.sampleRate * 0.5)
    noiseBuffer = context.createBuffer(1, length, context.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

/** Debe llamarse desde un gesto del usuario (el click de "Entrar"). */
export function unlockAudio() {
  const context = ensureContext()
  if (context && context.state === 'suspended') void context.resume()
}

export function setAudioEnabled(enabled: boolean) {
  const context = ensureContext()
  if (!context || !master) return
  master.gain.setTargetAtTime(enabled ? 0.5 : 0, context.currentTime, 0.05)
}

interface ToneOptions {
  freq: number
  toFreq?: number
  duration: number
  type?: OscillatorType
  gain?: number
  delay?: number
}

function tone({ freq, toFreq, duration, type = 'sine', gain = 0.2, delay = 0 }: ToneOptions) {
  const context = ensureContext()
  if (!context || !master) return
  const t = context.currentTime + delay
  const osc = context.createOscillator()
  const env = context.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (toFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(toFreq, 1), t + duration)
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(gain, t + 0.005)
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(env)
  env.connect(master)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

interface NoiseOptions {
  duration: number
  gain?: number
  filterFreq?: number
  filterType?: BiquadFilterType
  delay?: number
}

function noise({ duration, gain = 0.2, filterFreq = 1200, filterType = 'lowpass', delay = 0 }: NoiseOptions) {
  const context = ensureContext()
  if (!context || !master) return
  const t = context.currentTime + delay
  const src = context.createBufferSource()
  src.buffer = getNoise(context)
  const filter = context.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = filterFreq
  const env = context.createGain()
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  src.connect(filter)
  filter.connect(env)
  env.connect(master)
  src.start(t)
  src.stop(t + duration + 0.02)
}

export const sfx = {
  /** Disparo del blaster: chasquido de ruido + barrido descendente. */
  shoot() {
    noise({ duration: 0.12, gain: 0.28, filterFreq: 2600, filterType: 'highpass' })
    tone({ freq: 720, toFreq: 90, duration: 0.16, type: 'square', gain: 0.16 })
    tone({ freq: 180, toFreq: 60, duration: 0.22, type: 'sine', gain: 0.12 })
  },

  /** Impacto contra una superficie cualquiera. */
  impact() {
    noise({ duration: 0.09, gain: 0.12, filterFreq: 900 })
  },

  /** Impacto certero en una diana de sección: campanada ascendente. */
  targetHit() {
    tone({ freq: 660, duration: 0.14, type: 'triangle', gain: 0.22 })
    tone({ freq: 990, duration: 0.3, type: 'triangle', gain: 0.16, delay: 0.06 })
    tone({ freq: 1320, duration: 0.4, type: 'sine', gain: 0.1, delay: 0.12 })
  },

  footstep() {
    noise({ duration: 0.07, gain: 0.07, filterFreq: 420 })
  },

  jump() {
    tone({ freq: 320, toFreq: 520, duration: 0.1, type: 'triangle', gain: 0.1 })
  },

  land() {
    noise({ duration: 0.1, gain: 0.11, filterFreq: 300 })
  },

  /** Servo de la tablet al desplegarse. */
  tabletOpen() {
    tone({ freq: 400, toFreq: 900, duration: 0.18, type: 'sawtooth', gain: 0.07 })
    tone({ freq: 1200, duration: 0.12, type: 'sine', gain: 0.06, delay: 0.14 })
  },

  tabletClose() {
    tone({ freq: 900, toFreq: 380, duration: 0.16, type: 'sawtooth', gain: 0.07 })
  },

  uiHover() {
    tone({ freq: 1100, duration: 0.04, type: 'sine', gain: 0.05 })
  },

  uiClick() {
    tone({ freq: 720, duration: 0.06, type: 'square', gain: 0.08 })
    tone({ freq: 1440, duration: 0.08, type: 'sine', gain: 0.05, delay: 0.03 })
  },

  /** Zumbido de fondo del laboratorio. */
  startAmbient() {
    const context = ensureContext()
    if (!context || !master || ambient) return
    const osc = context.createOscillator()
    const gain = context.createGain()
    const filter = context.createBiquadFilter()
    osc.type = 'sawtooth'
    osc.frequency.value = 55
    filter.type = 'lowpass'
    filter.frequency.value = 180
    gain.gain.setValueAtTime(0, context.currentTime)
    gain.gain.linearRampToValueAtTime(0.035, context.currentTime + 2)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(master)
    osc.start()
    ambient = { osc, gain }
  },

  stopAmbient() {
    const context = ensureContext()
    if (!ambient || !context) return
    const { osc, gain } = ambient
    gain.gain.setTargetAtTime(0, context.currentTime, 0.3)
    osc.stop(context.currentTime + 1.5)
    ambient = null
  },
}

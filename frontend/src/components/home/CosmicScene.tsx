'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

const GOLD = new THREE.Color('#C9A24B')
const GOLD_LIGHT = new THREE.Color('#F0D58A')
const GREEN = new THREE.Color('#0E7C5A')
const NAVY = '#0B1F3A'

/* Floating Quran verses, projected into the 3D scene as DOM (crisp Arabic via Amiri). */
const VERSES = [
  { ar: 'اقْرَأْ بِاسْمِ رَبِّكَ', en: 'Read in the name of your Lord', pos: [3.1, 1.7, -2] as const, delay: 0 },
  { ar: 'نُورٌ عَلَىٰ نُورٍ', en: 'Light upon light', pos: [3.6, -0.4, -1] as const, delay: 5 },
  { ar: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', en: 'My Lord, increase me in knowledge', pos: [2.7, -2, -3] as const, delay: 10 },
]

function smoothstep(x: number) {
  x = Math.min(1, Math.max(0, x))
  return x * x * (3 - 2 * x)
}

/** Soft round sprite for particles so they glow instead of being hard squares. */
function useSprite() {
  return useMemo(() => {
    const size = 64
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,240,200,0.85)')
    g.addColorStop(0.6, 'rgba(201,162,75,0.25)')
    g.addColorStop(1, 'rgba(201,162,75,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

/* ── Foreground: particles that swirl in a cloud and assemble into an Islamic 8-point star ── */
function StarField({ pointer }: { pointer: React.RefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Points>(null)
  const sprite = useSprite()
  const COUNT = 2600

  const data = useMemo(() => {
    // Target shape: 8-pointed star (octagram) outline + inner octagon ring + center.
    const star: [number, number][] = []
    const spikes = 8
    const outer = 3.3
    const inner = 1.45
    const verts: [number, number][] = []
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
      verts.push([Math.cos(a) * r, Math.sin(a) * r])
    }
    const perEdge = 90
    for (let i = 0; i < verts.length; i++) {
      const [ax, ay] = verts[i]
      const [bx, by] = verts[(i + 1) % verts.length]
      for (let s = 0; s < perEdge; s++) {
        const t = s / perEdge
        star.push([ax + (bx - ax) * t, ay + (by - ay) * t])
      }
    }
    // inner octagon ring
    const ringPts = 260
    for (let i = 0; i < ringPts; i++) {
      const a = (i / ringPts) * Math.PI * 2
      star.push([Math.cos(a) * inner * 0.92, Math.sin(a) * inner * 0.92])
    }
    // center cluster
    for (let i = 0; i < 120; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * 0.45
      star.push([Math.cos(a) * r, Math.sin(a) * r])
    }

    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const scatter = new Float32Array(COUNT * 3)
    const starTarget = new Float32Array(COUNT * 3)
    const swirl = new Float32Array(COUNT)

    const tmp = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      // scattered "home" — a swirling disc cloud
      const a = Math.random() * Math.PI * 2
      const rad = 1.5 + Math.random() * 5.5
      scatter[i * 3] = Math.cos(a) * rad
      scatter[i * 3 + 1] = Math.sin(a) * rad * 0.75
      scatter[i * 3 + 2] = (Math.random() - 0.5) * 5
      swirl[i] = 0.5 + Math.random() * 1.5

      const [sx, sy] = star[i % star.length]
      starTarget[i * 3] = sx
      starTarget[i * 3 + 1] = sy
      starTarget[i * 3 + 2] = (Math.random() - 0.5) * 0.5

      positions[i * 3] = scatter[i * 3]
      positions[i * 3 + 1] = scatter[i * 3 + 1]
      positions[i * 3 + 2] = scatter[i * 3 + 2]

      // colour: mostly gold, some light-gold sparkle, a few green embers
      const roll = Math.random()
      if (roll > 0.92) tmp.copy(GREEN)
      else if (roll > 0.6) tmp.copy(GOLD_LIGHT)
      else tmp.copy(GOLD)
      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    }
    return { positions, colors, scatter, starTarget, swirl }
  }, [])

  useFrame((state) => {
    const pts = ref.current
    if (!pts) return
    const t = state.clock.elapsedTime
    // assemble/disperse cycle — eased pulse, ~30s period, lingers assembled
    const wave = Math.sin(t * 0.2) * 0.5 + 0.5
    const morph = smoothstep(Math.pow(wave, 0.7))
    const pos = pts.geometry.attributes.position.array as Float32Array
    const { scatter, starTarget, swirl } = data
    const starSpin = t * 0.08
    const cosS = Math.cos(starSpin)
    const sinS = Math.sin(starSpin)

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3
      // swirling scattered position (rotates around centre)
      const ca = t * 0.06 * swirl[i]
      const cx = scatter[ix]
      const cy = scatter[ix + 1]
      const sCos = Math.cos(ca)
      const sSin = Math.sin(ca)
      const swx = cx * sCos - cy * sSin
      const swy = cx * sSin + cy * sCos
      // rotating star target
      const tx = starTarget[ix]
      const ty = starTarget[ix + 1]
      const stx = tx * cosS - ty * sinS
      const sty = tx * sinS + ty * cosS

      pos[ix] = swx + (stx - swx) * morph
      pos[ix + 1] = swy + (sty - swy) * morph
      pos[ix + 2] = scatter[ix + 2] + (starTarget[ix + 2] - scatter[ix + 2]) * morph
    }
    pts.geometry.attributes.position.needsUpdate = true

    // gentle breathing scale
    const s = 1 + Math.sin(t * 0.5) * 0.02
    pts.scale.setScalar(s)

    // parallax tilt from pointer
    const p = pointer.current
    pts.rotation.y += (p.x * 0.25 - pts.rotation.y) * 0.05
    pts.rotation.x += (-p.y * 0.2 - pts.rotation.x) * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.085}
        sizeAttenuation
        vertexColors
        map={sprite}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.95}
      />
    </points>
  )
}

/* ── Background: deep starfield streaming toward the camera (the "travel" feeling) ── */
function TravelField() {
  const ref = useRef<THREE.Points>(null)
  const sprite = useSprite()
  const COUNT = 1400
  const SPAN = 42

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 26
      arr[i * 3 + 1] = (Math.random() - 0.5) * 18
      arr[i * 3 + 2] = -Math.random() * SPAN
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    const pts = ref.current
    if (!pts) return
    const arr = pts.geometry.attributes.position.array as Float32Array
    const speed = delta * 4
    for (let i = 0; i < COUNT; i++) {
      const zi = i * 3 + 2
      arr[zi] += speed
      if (arr[zi] > 7) {
        arr[i * 3] = (Math.random() - 0.5) * 26
        arr[i * 3 + 1] = (Math.random() - 0.5) * 18
        arr[zi] = -SPAN
      }
    }
    pts.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        color={'#cdb877'}
        map={sprite}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.7}
      />
    </points>
  )
}

/* Glowing core at the heart of the star — bloom turns this into light rays. */
function Core() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    const wave = Math.sin(t * 0.2) * 0.5 + 0.5
    const morph = smoothstep(Math.pow(wave, 0.7))
    const s = 0.25 + morph * 0.55 + Math.sin(t * 2) * 0.03
    m.scale.setScalar(s)
    ;(m.material as THREE.MeshBasicMaterial).opacity = 0.4 + morph * 0.6
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0.6} />
    </mesh>
  )
}

/* Camera drift + pointer parallax. */
function Rig({ pointer }: { pointer: React.RefObject<{ x: number; y: number }> }) {
  const { camera } = useThree()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p = pointer.current
    const targetX = p.x * 1.6 + Math.sin(t * 0.1) * 0.3
    const targetY = p.y * 1.1 + Math.cos(t * 0.13) * 0.2
    camera.position.x += (targetX - camera.position.x) * 0.04
    camera.position.y += (targetY - camera.position.y) * 0.04
    camera.position.z = 8 + Math.sin(t * 0.15) * 0.4
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Verses() {
  return (
    <>
      {VERSES.map((v) => (
        <Html
          key={v.ar}
          position={v.pos as unknown as [number, number, number]}
          center
          transform
          distanceFactor={9}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            className="verse-3d"
            style={{ animationDelay: `${v.delay}s` }}
          >
            <span className="font-arabic" dir="rtl" lang="ar">
              {v.ar}
            </span>
            <span className="verse-3d-en">{v.en}</span>
          </div>
        </Html>
      ))}
    </>
  )
}

export default function CosmicScene() {
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 55 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <fogExp2 attach="fog" args={[NAVY, 0.03]} />
      <ambientLight intensity={0.4} />
      <Rig pointer={pointer} />
      <TravelField />
      <StarField pointer={pointer} />
      <Core />
      <Verses />
      <EffectComposer>
        <Bloom intensity={1.3} luminanceThreshold={0.08} luminanceSmoothing={0.9} mipmapBlur radius={0.7} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  )
}

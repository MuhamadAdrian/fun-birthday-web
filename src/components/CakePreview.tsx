import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import type { CakeDefinition } from '../data/cakes'
import { CakeModel } from './CakeModel'

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial color="#FF8FAB" wireframe />
    </mesh>
  )
}

export function CakePreview({
  cake,
  name,
  candleLit,
}: {
  cake: CakeDefinition
  name: string
  candleLit: boolean
}) {
  return (
    <div className="preview-wrap">
      <Canvas camera={{ position: [0, 1.2, 2.8], fov: 45 }} shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 4, 2]} intensity={1.2} castShadow shadow-mapSize={1024} />
        <directionalLight position={[-2, 2, -2]} intensity={0.4} />
        <Suspense fallback={<Loader />}>
          <CakeModel cake={cake} name={name} candleLit={candleLit} />
          <ContactShadows position={[0, -0.6, 0]} opacity={0.35} scale={4} blur={2} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={1.5} maxDistance={4} minPolarAngle={0.3} maxPolarAngle={1.4} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
      <div className="preview-hint">Geser untuk putar • Cubit untuk zoom</div>
      <style>{`
        .preview-wrap{ position:relative; height: 420px; background: radial-gradient(120% 120% at 50% 0%, #FFF8E7 0%, #F5EBD0 60%, #FFE5EC 100%); border-radius: var(--radius-lg); overflow:hidden; border:2px solid #fff; box-shadow: var(--shadow-bakery-lg); }
        .preview-wrap canvas{ width:100%; height:100%; }
        .preview-hint{ position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background: rgba(58,42,26,0.85); color:#fff; font: 500 11px var(--font-body); padding:6px 12px; border-radius:999px; letter-spacing:.02em; }
        @media(max-width:600px){ .preview-wrap{ height: 360px; } }
      `}</style>
    </div>
  )
}

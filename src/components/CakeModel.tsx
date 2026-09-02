import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CakeDefinition } from '../data/cakes'
import { useCakeTexture } from '../hooks/useCakeTexture'

export function CakeModel({
  cake,
  name,
  candleLit,
  float = true,
}: {
  cake: CakeDefinition
  name: string
  candleLit: boolean
  float?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const flameRef = useRef<THREE.Mesh>(null!)
  const lightRef = useRef<THREE.PointLight>(null!)
  const plaqueTexture = useCakeTexture(name)

  useFrame(({ clock }) => {
    if (float && groupRef.current) {
      groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.04
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.05
    }
    if (candleLit && flameRef.current && lightRef.current) {
      const t = clock.elapsedTime
      const flicker = 0.8 + Math.sin(t * 12) * 0.1 + Math.sin(t * 7) * 0.08
      flameRef.current.scale.set(flicker, flicker, flicker)
      lightRef.current.intensity = 1.2 + Math.sin(t * 10) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Base tier */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 32]} />
        <meshStandardMaterial color={cake.colors.base} roughness={0.6} />
      </mesh>
      {/* Top tier frosting */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 0.9, 0.35, 32]} />
        <meshStandardMaterial color={cake.colors.frosting} roughness={0.5} />
      </mesh>
      {/* Frosting drips — stylized */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.86, 0.86, 0.08, 32]} />
        <meshStandardMaterial color={cake.colors.frosting} />
      </mesh>
      {/* Sprinkle dots for cute */}
      {cake.style === 'cute' && (
        <>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const r = 0.72
            return (
              <mesh key={i} position={[Math.cos(angle) * r, 0.65, Math.sin(angle) * r]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color={i % 2 === 0 ? '#FF8FAB' : '#FFD23F'} />
              </mesh>
            )
          })}
        </>
      )}

      {/* Plaque with name texture */}
      <mesh position={[0, 0.05, 1.02]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.2, 0.6]} />
        <meshStandardMaterial map={plaqueTexture} transparent roughness={0.8} />
      </mesh>

      {/* Candles — 3 */}
      {[-0.35, 0, 0.35].map((x, idx) => (
        <group key={idx} position={[x, 0.75, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.35, 12]} />
            <meshStandardMaterial color="#FFF8E7" />
          </mesh>
          {/* wick */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.06, 6]} />
            <meshStandardMaterial color="#3A2A1A" />
          </mesh>
          {candleLit && (
            <>
              <mesh ref={idx === 1 ? flameRef : undefined} position={[0, 0.28, 0]}>
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshStandardMaterial emissive="#FFD23F" emissiveIntensity={2} color="#FFD23F" transparent opacity={0.95} />
              </mesh>
              <pointLight ref={idx === 1 ? lightRef : undefined} position={[0, 0.28, 0]} intensity={1.2} distance={2.5} color="#FFD23F" decay={2} />
            </>
          )}
          {!candleLit && (
            <mesh position={[0, 0.28, 0]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color="#333" transparent opacity={0.6} />
            </mesh>
          )}
        </group>
      ))}

      {/* Cherry on realistic */}
      {cake.style === 'realistic' && (
        <mesh position={[0, 0.72, 0.18]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#E63946" roughness={0.2} />
        </mesh>
      )}

      {/* Bear ears for bear */}
      {cake.id === 'bear-01' && (
        <>
          <mesh position={[-0.55, 0.5, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={cake.colors.base} />
          </mesh>
          <mesh position={[0.55, 0.5, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={cake.colors.base} />
          </mesh>
          <mesh position={[-0.55, 0.5, 0.08]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#FF8FAB" />
          </mesh>
          <mesh position={[0.55, 0.5, 0.08]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#FF8FAB" />
          </mesh>
        </>
      )}
    </group>
  )
}

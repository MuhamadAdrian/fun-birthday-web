import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useXRHitTest } from '@react-three/xr'

interface HitTestPreviewProps {
  onHitTest: (position: [number, number, number], rotation: [number, number, number]) => void
  visible: boolean
}

export function HitTestPreview({ onHitTest, visible }: HitTestPreviewProps) {
  const ref = useRef<THREE.Group>(null)
  const mat = useMemo(() => new THREE.Matrix4(), [])
  const pos = useMemo(() => new THREE.Vector3(), [])
  const quat = useMemo(() => new THREE.Quaternion(), [])
  const euler = useMemo(() => new THREE.Euler(), [])

  useXRHitTest(
    (results, getWorldMatrix) => {
      if (!visible || results.length === 0 || !ref.current) {
        if (ref.current) ref.current.visible = false
        return
      }
      getWorldMatrix(mat, results[0])
      mat.decompose(pos, quat, ref.current.scale)
      ref.current.position.copy(pos)
      ref.current.quaternion.copy(quat)
      ref.current.visible = visible
      euler.setFromQuaternion(quat)
      onHitTest([pos.x, pos.y, pos.z], [euler.x, euler.y, euler.z])
    },
    'viewer',
  )

  // Reticle visual — ring + dot, always visible when hit found
  return (
    <group ref={ref} visible={false}>
      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.07, 0.08, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.04, 0.045, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Center dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.015, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Shadow plane for depth cue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <circleGeometry args={[0.09, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

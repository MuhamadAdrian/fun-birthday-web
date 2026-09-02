import { useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {
  const reduceMotion = useRef(
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  )

  const fire = useCallback(() => {
    const count = reduceMotion.current ? 20 : 180
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50, gravity: 0.9, scalar: 1.1 }
    // wax-drip signature: custom shapes via confetti + colors from palette
    const colors = ['#E63946', '#FF8FAB', '#FFD23F', '#A8E6CF', '#FFF8E7']

    // burst from center and sides
    confetti({ ...defaults, particleCount: count * 0.6, origin: { x: 0.5, y: 0.6 }, colors, shapes: ['circle', 'square'] })
    if (!reduceMotion.current) {
      setTimeout(() => confetti({ ...defaults, particleCount: count * 0.3, origin: { x: 0.2, y: 0.7 }, colors }), 150)
      setTimeout(() => confetti({ ...defaults, particleCount: count * 0.3, origin: { x: 0.8, y: 0.7 }, colors }), 300)
    }
    // wax drip: smaller gravity, more ticks for slower fall
    if (!reduceMotion.current) {
      setTimeout(
        () =>
          confetti({
            particleCount: 40,
            startVelocity: 15,
            spread: 90,
            ticks: 120,
            gravity: 0.6,
            origin: { x: 0.5, y: 0.4 },
            colors: ['#FFD23F', '#E63946'],
            shapes: ['circle'],
            scalar: 0.8,
          }),
        200,
      )
    }
  }, [])

  const stop = useCallback(() => {
    confetti.reset()
  }, [])

  return { fire, stop }
}

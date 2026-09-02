import { useCallback, useEffect, useRef, useState } from 'react'

export type BlowState = 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported' | 'blowing'

interface UseBlowDetectorProps {
  onBlow: () => void
  disabled?: boolean
  threshold?: number // 0-255
}

export function useBlowDetector({ onBlow, disabled, threshold = 35 }: UseBlowDetectorProps) {
  const [state, setState] = useState<BlowState>('idle')
  const [level, setLevel] = useState(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const blowStartRef = useRef<number | null>(null)
  const lastBlowRef = useRef<number>(0)
  const onBlowRef = useRef(onBlow)
  onBlowRef.current = onBlow

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    streamRef.current = null
    analyserRef.current = null
    audioCtxRef.current = null
    setLevel(0)
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      return
    }
    if (disabled) return
    try {
      setState('requesting')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      streamRef.current = stream
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      setState('listening')

      const data = new Uint8Array(analyser.frequencyBinCount)

      const loop = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(data)
        // RMS approx from frequency data
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
        const rms = Math.sqrt(sum / data.length)
        setLevel(Math.round(rms))

        // low freq energy 80-500Hz
        const sampleRate = audioCtxRef.current?.sampleRate ?? 44100
        const binHz = sampleRate / analyserRef.current.fftSize
        const lowStart = Math.floor(80 / binHz)
        const lowEnd = Math.floor(500 / binHz)
        let lowSum = 0
        let totalSum = 0
        for (let i = 0; i < data.length; i++) {
          totalSum += data[i]
          if (i >= lowStart && i <= lowEnd) lowSum += data[i]
        }
        const lowRatio = totalSum > 0 ? lowSum / totalSum : 0

        const now = performance.now()
        const isBlowing = rms > threshold && lowRatio > 0.45
        if (isBlowing) {
          if (blowStartRef.current === null) blowStartRef.current = now
          if (now - blowStartRef.current >= 300 && now - lastBlowRef.current > 1000) {
            lastBlowRef.current = now
            setState('blowing')
            onBlowRef.current()
            // haptics
            navigator.vibrate?.(50)
            setTimeout(() => setState('listening'), 800)
          }
        } else {
          blowStartRef.current = null
        }

        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    } catch {
      setState('denied')
    }
  }, [disabled, threshold])

  useEffect(() => {
    return () => stop()
  }, [stop])

  useEffect(() => {
    if (disabled) {
      stop()
      setState('idle')
    }
  }, [disabled, stop])

  return { state, level, start, stop, threshold }
}

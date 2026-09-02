import { useMemo } from 'react'
import * as THREE from 'three'

export function useCakeTexture(name: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    // plaque background
    ctx.fillStyle = '#FFF8E7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // border
    ctx.strokeStyle = '#3A2A1A'
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
    // inner accent
    ctx.fillStyle = '#FFD23F'
    ctx.fillRect(0, 0, canvas.width, 16)
    ctx.fillRect(0, canvas.height - 16, canvas.width, 16)

    // sanitize: already stripped <>, limit 20
    const display = name ? name : 'Happy Birthday'
    // dynamic font size
    let fontSize = 64
    ctx.font = `800 ${fontSize}px "Bricolage Grotesque", sans-serif`
    let metrics = ctx.measureText(display)
    while (metrics.width > canvas.width - 40 && fontSize > 28) {
      fontSize -= 4
      ctx.font = `800 ${fontSize}px "Bricolage Grotesque", sans-serif`
      metrics = ctx.measureText(display)
    }
    // if still overflow, truncate
    let text = display
    if (metrics.width > canvas.width - 40) {
      while (text.length > 3 && ctx.measureText(text + '…').width > canvas.width - 40) {
        text = text.slice(0, -1)
      }
      text = text + '…'
    }

    ctx.fillStyle = '#E63946'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // shadow
    ctx.shadowColor = 'rgba(58,42,26,0.15)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 4
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 6)
    // reset shadow for subtitle
    ctx.shadowBlur = 0
    ctx.fillStyle = '#3A2A1A'
    ctx.font = `600 22px "Plus Jakarta Sans", sans-serif`
    ctx.fillText('Selamat Ulang Tahun! 🎉', canvas.width / 2, canvas.height / 2 + 58)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    tex.needsUpdate = true
    return tex
  }, [name])

  return texture
}

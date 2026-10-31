import { useEffect, useRef } from 'react'
import { buildMap, MAP_H, MAP_W, TILE } from '../Golf/game/map'
import { allPins, SPAWN } from '../Golf/game/layout'
import { drawFlag, renderCourse } from '../Golf/game/tiles'
import { buildGolferFrames } from '../Golf/game/sprites'
import { P } from '../Golf/game/palette'

/** Map tile the preview centres on: the clubhouse and range, or just the clubhouse when narrow. */
const focusFor = (cols: number) => ({ x: cols < 16 ? 8 : 13, y: 8 })

/** A live, non-interactive crop of the real course for the landing page. */
export default function CoursePreview() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const map = buildMap()
    const layers = [renderCourse(map, 0), renderCourse(map, 1)]
    const golfer = buildGolferFrames().down[0]
    const pins = allPins()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cols = 20
    let rows = 10
    let tick = 0

    const draw = () => {
      const w = cols * TILE
      const h = rows * TILE
      const focus = focusFor(cols)
      const ox = Math.round(Math.max(0, Math.min(MAP_W * TILE - w, (focus.x + 0.5) * TILE - w / 2)))
      const oy = Math.round(Math.max(0, Math.min(MAP_H * TILE - h, (focus.y + 0.5) * TILE - h / 2)))
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(layers[Math.floor(tick / 2) % 2], ox, oy, w, h, 0, 0, w, h)
      for (const p of pins) drawFlag(ctx, p.at.x * TILE - ox, p.at.y * TILE - oy, tick % 2, p.color)
      const gx = SPAWN.x * TILE - ox
      const gy = SPAWN.y * TILE - oy
      ctx.fillStyle = P.shadow
      ctx.fillRect(gx + 4, gy + 14, 8, 2)
      ctx.drawImage(golfer, gx, gy - 2)
    }

    // Integer pixel scale; enough tiles to cover the panel, cropped by the wrapper.
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const scale = 2
      cols = Math.min(MAP_W, Math.ceil(width / (TILE * scale)))
      rows = Math.min(MAP_H, Math.max(1, Math.ceil(height / (TILE * scale))))
      canvas.width = cols * TILE
      canvas.height = rows * TILE
      canvas.style.width = `${cols * TILE * scale}px`
      canvas.style.height = `${rows * TILE * scale}px`
      draw()
    })
    ro.observe(wrapRef.current!)

    const id = reduced
      ? 0
      : window.setInterval(() => {
          tick++
          draw()
        }, 320)

    return () => {
      ro.disconnect()
      window.clearInterval(id)
    }
  }, [])

  return (
    <div ref={wrapRef} className="preview" aria-hidden="true">
      <canvas ref={canvasRef} className="preview__canvas" />
    </div>
  )
}

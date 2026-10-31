import { useEffect, useRef, useState } from 'react'

/**
 * Classic three-press swing, made explicit:
 *   1 START  – the marker climbs (backswing)
 *   2 POWER  – lock how far it got; it swings back down
 *   3 HIT    – press as it crosses the green IMPACT zone
 * The meter runs from MISS (left) to 100 (right); impact sits at 0.
 */
type Phase = 'ready' | 'power' | 'impact' | 'done'

const SPEED = 0.064 // meter units per ms (~1.6 s for a full backswing)
const MISS = -16
const PERFECT = 2
const GOOD = 6
const DRIVE: Record<number, number> = { 3: 190, 4: 290, 5: 310 }

interface Shot {
  verdict: string
  detail: string
  yards: number
  /** Sideways curve: negative draws left, positive fades right. */
  curve: number
  tone: 'great' | 'ok' | 'bad'
}

function judge(power: number, impact: number, par: number): Shot {
  const full = Math.round((power / 100) * DRIVE[par])
  const off = impact // early press = positive (hook side), late = negative (slice side)
  if (impact <= MISS + 1) return { verdict: 'TOPPED IT', detail: 'Too late: the ball dribbles off the tee.', yards: Math.round(full * 0.12), curve: 0, tone: 'bad' }
  if (Math.abs(off) <= PERFECT) {
    if (par === 3 && power >= 95)
      return { verdict: 'HOLE IN ONE!', detail: 'Perfect strike at full power. Drinks are on you.', yards: full, curve: 0, tone: 'great' }
    return { verdict: 'PERFECT!', detail: `Pure strike, straight down the middle.`, yards: full, curve: 0, tone: 'great' }
  }
  if (Math.abs(off) <= GOOD)
    return off > 0
      ? { verdict: 'GOOD · DRAW', detail: 'A touch early: a gentle draw to the left.', yards: Math.round(full * 0.95), curve: -0.35, tone: 'ok' }
      : { verdict: 'GOOD · FADE', detail: 'A touch late: a gentle fade to the right.', yards: Math.round(full * 0.95), curve: 0.35, tone: 'ok' }
  return off > 0
    ? { verdict: 'HOOK!', detail: 'Too early: it hooks hard left into the rough.', yards: Math.round(full * 0.8), curve: -1, tone: 'bad' }
    : { verdict: 'SLICE!', detail: 'Too late: it slices away to the right.', yards: Math.round(full * 0.8), curve: 1, tone: 'bad' }
}

const STEPS: { phase: Phase; label: string }[] = [
  { phase: 'ready', label: '1 START' },
  { phase: 'power', label: '2 POWER' },
  { phase: 'impact', label: '3 HIT' },
]

const PROMPTS: Record<Phase, string> = {
  ready: 'Press to start your backswing.',
  power: 'Press to lock your power. Higher goes further.',
  impact: 'Now press as the marker crosses the green IMPACT zone!',
  done: '',
}

const BUTTON: Record<Phase, string> = { ready: 'START', power: 'POWER', impact: 'HIT!', done: 'AGAIN' }

const pct = (v: number) => ((v - MISS) / (100 - MISS)) * 100

/** Top-down flight: tee on the left, carry to the right, curve up (left) or down (right). */
function Flight({ shot, max }: { shot: Shot; max: number }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setT(1)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 900)
      setT(k)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shot])

  const W = 240
  const H = 72
  const x0 = 12
  const y0 = H / 2
  const x1 = x0 + ((W - 30) * shot.yards) / max
  const y1 = y0 + shot.curve * 22
  const point = (k: number) => {
    // Quadratic curve; the bend shows most at the end of the flight.
    const cx = (x0 + x1) / 2
    const cy = y0 + shot.curve * 2
    const x = (1 - k) ** 2 * x0 + 2 * (1 - k) * k * cx + k ** 2 * x1
    const y = (1 - k) ** 2 * y0 + 2 * (1 - k) * k * cy + k ** 2 * y1
    return { x: Math.round(x), y: Math.round(y) }
  }
  const dots = Array.from({ length: 14 }, (_, i) => (i + 1) / 14).filter((k) => k <= t)
  const ball = point(t)

  return (
    <svg className="flight" viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" aria-hidden="true">
      <rect width={W} height={H} fill="#5aac3c" />
      <rect y={y0 - 12} width={W} height={24} fill="#7cc95a" />
      {[100, 200, 300].map((yd) => {
        const x = x0 + ((W - 30) * yd) / max
        return x < W ? (
          <g key={yd}>
            <rect x={x} y={4} width={1} height={H - 8} fill="#f4f4f4" opacity={0.5} />
            <text x={x + 3} y={11} fontSize={7} fill="#f4f4f4" fontFamily="monospace">
              {yd}
            </text>
          </g>
        ) : null
      })}
      <rect x={x0 - 3} y={y0 - 6} width={6} height={12} fill="#8ad466" stroke="#1c2a14" />
      {dots.map((k) => {
        const p = point(k)
        return <rect key={k} x={p.x - 1} y={p.y - 1} width={2} height={2} fill="#1c2a14" opacity={0.55} />
      })}
      <rect x={ball.x - 2} y={ball.y - 2} width={4} height={4} fill="#f4f4f4" stroke="#1c2a14" strokeWidth={1} />
    </svg>
  )
}

export default function SwingMeter({ par }: { par: number }) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [pos, setPos] = useState(0)
  const [power, setPower] = useState<number | null>(null)
  const [shot, setShot] = useState<Shot | null>(null)
  const posRef = useRef(0)
  const powerRef = useRef(0)

  useEffect(() => {
    if (phase !== 'power' && phase !== 'impact') return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.max(0, now - last)
      last = now
      if (phase === 'power') {
        const p = Math.min(100, posRef.current + SPEED * dt)
        posRef.current = p
        setPos(p)
        if (p >= 100) {
          // Never pressed: lock full power rather than silently resetting.
          powerRef.current = 100
          setPower(100)
          setPhase('impact')
          return
        }
      } else {
        const p = posRef.current - SPEED * 1.15 * dt
        posRef.current = p
        setPos(p)
        if (p <= MISS) {
          setShot(judge(powerRef.current, MISS, par))
          setPhase('done')
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, par])

  const press = () => {
    if (phase === 'ready' || phase === 'done') {
      posRef.current = 0
      setPos(0)
      setPower(null)
      setShot(null)
      setPhase('power')
    } else if (phase === 'power') {
      powerRef.current = Math.max(10, Math.round(posRef.current))
      setPower(powerRef.current)
      setPhase('impact')
    } else {
      setShot(judge(powerRef.current, posRef.current, par))
      setPhase('done')
    }
  }

  const stepIndex = phase === 'done' ? 3 : STEPS.findIndex((s) => s.phase === phase)
  const showCursor = phase !== 'ready'

  return (
    <div className="meter">
      <ol className="meter__steps" aria-hidden="true">
        {STEPS.map((s, i) => (
          <li key={s.label} className={i === stepIndex ? 'is-now' : i < stepIndex ? 'is-done' : ''}>
            {s.label}
          </li>
        ))}
      </ol>

      <p className="meter__prompt" aria-live="polite">
        {shot ? (
          <>
            <strong className={`meter__verdict meter__verdict--${shot.tone}`}>{shot.verdict}</strong> {shot.yards}Y ·{' '}
            {shot.detail}
          </>
        ) : (
          PROMPTS[phase]
        )}
      </p>

      <div className="meter__bar" aria-hidden="true">
        <div className="meter__zone meter__zone--good" style={{ left: `${pct(-GOOD)}%`, width: `${pct(GOOD) - pct(-GOOD)}%` }} />
        <div className="meter__zone meter__zone--perfect" style={{ left: `${pct(-PERFECT)}%`, width: `${pct(PERFECT) - pct(-PERFECT)}%` }} />
        <span className="meter__impact-label" style={{ left: `${pct(0)}%` }}>
          IMPACT
        </span>
        {[25, 50, 75, 100].map((v) => (
          <span key={v} className="meter__tick" style={{ left: `${pct(v)}%` }}>
            <span>{v === 100 ? 'MAX' : v}</span>
          </span>
        ))}
        {showCursor && phase === 'power' && <div className="meter__fill" style={{ left: `${pct(0)}%`, width: `${pct(pos) - pct(0)}%` }} />}
        {power !== null && <div className="meter__power" style={{ left: `${pct(power)}%` }} />}
        {showCursor && <div className="meter__cursor" style={{ left: `${pct(pos)}%` }} />}
      </div>

      <div className="meter__row">
        <button
          type="button"
          className="pixel-btn meter__btn"
          onClick={press}
          aria-label={`${BUTTON[phase]}. ${PROMPTS[phase]}`}
        >
          {BUTTON[phase]}
        </button>
        <span className="meter__readout" aria-hidden="true">
          {phase === 'power' ? `POWER ${Math.round(pos)}%` : power !== null ? `POWER ${power}%` : 'SPACE / TAP'}
        </span>
        {shot && <Flight shot={shot} max={Math.max(DRIVE[par], 300)} />}
      </div>
    </div>
  )
}

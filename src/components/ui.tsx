import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'

/** Page transition wrapper — subtle rise + fade, disabled for reduced motion. */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 ${className}`}
    >
      {children}
    </motion.main>
  )
}

export function SaveIndicator() {
  const { saveState } = useStore()
  return (
    <span
      className={`chip transition-opacity duration-300 ${saveState === 'idle' ? 'opacity-0' : 'opacity-100'}`}
      aria-live="polite"
    >
      <span
        className={`inline-block size-1.5 rounded-full ${saveState === 'saving' ? 'animate-pulse bg-amber-400' : 'bg-mint-400'}`}
      />
      {saveState === 'saving' ? 'يحفظ…' : 'تم الحفظ'}
    </span>
  )
}

export function TopBar({ title, back, actions }: { title: ReactNode; back?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-center gap-3">
      {back && (
        <Link to={back} className="btn btn-ghost !px-3" aria-label="رجوع">
          <ArrowStart />
        </Link>
      )}
      <h1 className="min-w-0 flex-1 truncate text-xl font-bold sm:text-2xl">{title}</h1>
      <SaveIndicator />
      {actions}
    </header>
  )
}

/** Animated circular readiness score. */
export function ScoreRing({ score, size = 96, label }: { score: number; size?: number; label?: string }) {
  const reduce = useReducedMotion()
  const stroke = size >= 90 ? 8 : 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const hue = score >= 85 ? 'var(--color-mint-400)' : score >= 60 ? 'var(--color-cyan-400)' : score >= 30 ? 'var(--color-amber-400)' : 'var(--color-rose-400)'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--glass-border)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={hue}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={reduce ? { duration: 0 } : { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-lg font-bold leading-none" style={{ color: hue }}>
          {score}
        </span>
        {label && <span className="mt-1 text-[10px] text-mist-500">{label}</span>}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="bento flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="text-4xl opacity-60">{icon}</div>
      <p className="font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-mist-500">{hint}</p>}
      {action}
    </div>
  )
}

/* ---- Inline icons (stroke inherits currentColor, RTL-aware arrows) ---- */

function Svg({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`size-[1.15em] ${className}`} aria-hidden>
      {children}
    </svg>
  )
}

/** Arrow pointing toward "start" (right in RTL) — used for back buttons. */
export function ArrowStart() {
  return (
    <Svg className="rtl:-scale-x-100">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </Svg>
  )
}

export function PlusIcon() {
  return (
    <Svg>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  )
}

export function EyeIcon() {
  return (
    <Svg>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  )
}

export function LockIcon() {
  return (
    <Svg>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  )
}

export function LinkIcon() {
  return (
    <Svg>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </Svg>
  )
}

export function PlayIcon() {
  return (
    <Svg className="rtl:-scale-x-100">
      <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function CheckIcon() {
  return (
    <Svg>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  )
}

export function TrashIcon() {
  return (
    <Svg>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </Svg>
  )
}

export function GripIcon() {
  return (
    <Svg>
      <circle cx="9" cy="6" r="1" fill="currentColor" />
      <circle cx="15" cy="6" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="18" r="1" fill="currentColor" />
      <circle cx="15" cy="18" r="1" fill="currentColor" />
    </Svg>
  )
}

export function ClockIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}

export function SparkIcon() {
  return (
    <Svg>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19" />
    </Svg>
  )
}

export function CopyIcon() {
  return (
    <Svg>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  )
}

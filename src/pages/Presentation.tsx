import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_COLORS } from '../types'
import { LockIcon, ClockIcon } from '../components/ui'

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

const slideVariants = {
  enter: { opacity: 0, x: -48, filter: 'blur(6px)' },
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: 48, filter: 'blur(6px)' },
}

export default function Presentation() {
  const { id } = useParams()
  const { getMeeting } = useStore()
  const meeting = getMeeting(id!)
  const [index, setIndex] = useState(-1) // -1 = title slide
  const [startedAt] = useState(() => Date.now())
  const now = useNow(1000)

  const points = meeting?.points ?? []
  const last = points.length - 1

  const elapsed = Math.floor((now - startedAt) / 1000)
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  const budget = useMemo(() => points.reduce((a, p) => a + p.timeEstimate, 0), [points])
  const overBudget = elapsed > budget * 60

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // RTL deck: "next" moves toward the left arrow
      if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'Enter') setIndex((i) => Math.min(i + 1, last))
      if (e.key === 'ArrowRight') setIndex((i) => Math.max(i - 1, -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  if (!meeting) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <Link to="/" className="btn btn-ghost">
          الاجتماع غير موجود — رجوع
        </Link>
      </main>
    )
  }

  const point = index >= 0 ? points[index] : null
  const color = point ? AGENDA_TYPE_COLORS[point.type] : 'var(--color-violet-400)'

  return (
    <main className="flex min-h-dvh flex-col">
      {/* Progress rail */}
      <div className="fixed inset-x-0 top-0 z-10 h-1 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-l from-violet-500 to-cyan-400"
          animate={{ width: `${((index + 1) / (points.length + 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ float: 'inline-start' }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <Link to={`/meeting/${meeting.id}`} className="btn btn-ghost !py-1.5 text-xs">
          إنهاء العرض
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className={`chip tnum ${overBudget ? '!border-rose-400/50 text-rose-400' : 'text-mist-300'}`} dir="ltr">
            <ClockIcon /> {mm}:{ss}
          </span>
          <span className="chip tnum text-mist-500" dir="ltr">
            {index + 1} / {points.length}
          </span>
        </div>
      </header>

      {/* Slide */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pb-28">
        <AnimatePresence mode="wait">
          {point === null ? (
            <motion.section
              key="title"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl text-center"
            >
              <p className="chip mb-6 !border-violet-500/30 text-violet-400">وضع العرض</p>
              <h1 className="grad-text text-balance text-4xl font-bold leading-tight sm:text-6xl">
                {meeting.title || 'الاجتماع'}
              </h1>
              {meeting.objective && <p className="mt-6 text-lg text-mist-300">{meeting.objective}</p>}
              <p className="mt-10 text-sm text-mist-600">اضغط مسافة أو السهم ⬅ للبدء</p>
            </motion.section>
          ) : (
            <motion.section
              key={point.id}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-3xl"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="chip font-bold" style={{ color, borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}>
                  {AGENDA_TYPE_LABELS[point.type]}
                </span>
                <span className="chip tnum text-mist-500">
                  <ClockIcon /> {point.timeEstimate} دقيقة
                </span>
                {point.visibility === 'private' && (
                  <span className="chip text-amber-400">
                    <LockIcon /> بند خاص
                  </span>
                )}
              </div>
              <h2 className="text-balance text-3xl font-bold leading-tight sm:text-5xl">{point.title}</h2>
              {point.goal && <p className="mt-4 text-lg text-mist-300">{point.goal}</p>}

              {point.talkingPoints.filter((t) => t.trim()).length > 0 && (
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } } }}
                  className="mt-8 flex flex-col gap-3"
                >
                  {point.talkingPoints
                    .filter((t) => t.trim())
                    .map((tp, i) => (
                      <motion.li
                        key={i}
                        variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="flex items-start gap-3 text-lg"
                      >
                        <span className="mt-2.5 size-2 shrink-0 rounded-full" style={{ background: color }} />
                        {tp}
                      </motion.li>
                    ))}
                </motion.ul>
              )}

              {point.expectedOutcome && (
                <p className="mt-8 inline-block rounded-2xl bg-white/5 px-5 py-3 text-base text-mist-300">
                  <span className="font-bold text-mist-100">الهدف: </span>
                  {point.expectedOutcome}
                </p>
              )}

              {point.privateNotes && (
                <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <LockIcon /> ملاحظاتك الخاصة
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-mist-300">{point.privateNotes}</p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <footer className="fixed inset-x-0 bottom-0 flex items-center justify-center gap-3 pb-6 pt-4">
        <button className="btn btn-ghost" onClick={() => setIndex((i) => Math.max(i - 1, -1))} disabled={index <= -1}>
          السابق
        </button>
        {index >= last ? (
          <Link to={`/meeting/${meeting.id}/close`} className="btn btn-primary">
            إنهاء وتسجيل النتائج
          </Link>
        ) : (
          <button className="btn btn-primary" onClick={() => setIndex((i) => Math.min(i + 1, last))}>
            التالي
          </button>
        )}
      </footer>
    </main>
  )
}

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SharePayload } from '../types'
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_COLORS } from '../types'
import { ClockIcon } from './ui'

gsap.registerPlugin(ScrollTrigger)

function pluralizePoints(n: number): string {
  if (n === 1) return 'بند واحد'
  if (n === 2) return 'بندان'
  if (n >= 3 && n <= 10) return `${n} بنود`
  return `${n} بندًا`
}

function fmtLongDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso + 'T00:00:00'))
  } catch {
    return iso
  }
}

/**
 * The premium animated agenda view rendered from a SharePayload.
 * Cinematic sequencing (hero timeline + scroll reveals) is GSAP;
 * it only ever sees public data.
 */
export default function SharedAgendaView({ payload }: { payload: SharePayload }) {
  const root = useRef<HTMLDivElement>(null)
  const total = payload.points.reduce((a, p) => a + (p.timeEstimate || 0), 0)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Hero: staged cinematic entrance
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('[data-hero-kicker]', { y: 24, opacity: 0, duration: 0.6 })
          .from('[data-hero-title]', { y: 34, opacity: 0, duration: 0.8 }, '-=0.3')
          .from('[data-hero-meta] > *', { y: 18, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.4')
          .from('[data-hero-line]', { scaleX: 0, transformOrigin: '100% 50%', duration: 0.9, ease: 'power2.inOut' }, '-=0.2')

        // Agenda cards: reveal on scroll
        gsap.utils.toArray<HTMLElement>('[data-agenda-card]').forEach((card) => {
          gsap.from(card, {
            y: 44,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 88%' },
          })
        })

        gsap.from('[data-agenda-foot]', {
          opacity: 0,
          y: 24,
          duration: 0.7,
          scrollTrigger: { trigger: '[data-agenda-foot]', start: 'top 92%' },
        })
      })
      return () => mm.revert()
    }, root)
    return () => ctx.revert()
  }, [payload])

  return (
    <div ref={root}>
      {/* Hero */}
      <section className="mx-auto flex min-h-[62dvh] max-w-3xl flex-col items-center justify-center px-6 pt-16 text-center">
        <p data-hero-kicker className="chip mb-5 !border-violet-500/30 text-violet-400">
          دعوة إلى اجتماع
        </p>
        <h1 data-hero-title className="grad-text text-balance text-4xl font-bold leading-tight sm:text-5xl">
          {payload.title || 'جدول أعمال الاجتماع'}
        </h1>
        <div data-hero-meta className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-mist-300">
          {payload.withWhom && <span className="chip">مع {payload.withWhom}</span>}
          <span className="chip">{fmtLongDate(payload.date)}</span>
          <span className="chip tnum">{payload.time}</span>
          {payload.location && <span className="chip">{payload.location}</span>}
          <span className="chip">
            <ClockIcon /> <span className="tnum">{total}</span> دقيقة · <span className="tnum">{pluralizePoints(payload.points.length)}</span>
          </span>
        </div>
        {payload.objective && (
          <p data-hero-meta className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-mist-300">
            {payload.objective}
          </p>
        )}
        <div data-hero-line className="mt-10 h-px w-40 bg-gradient-to-l from-transparent via-violet-400/70 to-transparent" />
      </section>

      {/* Agenda timeline */}
      <section className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <ol className="relative flex flex-col gap-6">
          {payload.points.map((p, i) => {
            const color = AGENDA_TYPE_COLORS[p.type]
            return (
              <li key={i} data-agenda-card className="bento relative overflow-hidden p-6 sm:p-7">
                <div className="absolute inset-y-0 start-0 w-1" style={{ background: color, opacity: 0.85 }} aria-hidden />
                <div className="flex items-start gap-4">
                  <span
                    className="tnum grid size-10 shrink-0 place-items-center rounded-2xl text-base font-bold"
                    style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold" style={{ color }}>
                        {AGENDA_TYPE_LABELS[p.type]}
                      </span>
                      <span className="tnum inline-flex items-center gap-1 text-mist-500">
                        <ClockIcon /> {p.timeEstimate} دقيقة
                      </span>
                    </div>
                    <h2 className="text-xl font-bold leading-snug">{p.title}</h2>
                    {p.goal && <p className="mt-2 text-sm leading-relaxed text-mist-300">{p.goal}</p>}
                    {p.talkingPoints.length > 0 && (
                      <ul className="mt-4 flex flex-col gap-2">
                        {p.talkingPoints.map((tp, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm text-mist-100">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                            {tp}
                          </li>
                        ))}
                      </ul>
                    )}
                    {p.expectedOutcome && (
                      <p className="mt-4 rounded-xl bg-white/4 px-4 py-2.5 text-sm text-mist-300">
                        <span className="font-semibold text-mist-100">النتيجة المرجوة: </span>
                        {p.expectedOutcome}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        {payload.points.length === 0 && (
          <div className="bento p-10 text-center text-mist-500">لا توجد بنود مشتركة في هذا الجدول بعد.</div>
        )}

        <footer data-agenda-foot className="mt-12 pb-16 text-center">
          {payload.sharedNotes && (
            <p className="mx-auto mb-8 max-w-xl text-pretty text-sm leading-relaxed text-mist-300">{payload.sharedNotes}</p>
          )}
          <p className="text-xs text-mist-600">
            أُعدّ هذا الجدول بعناية عبر <span className="grad-text font-bold">جاهز</span>
          </p>
        </footer>
      </section>
    </div>
  )
}

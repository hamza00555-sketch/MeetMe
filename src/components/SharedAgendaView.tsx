import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import type { SharePayload } from '../types'

gsap.registerPlugin(ScrollTrigger, SplitText)

function fmtLongDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso + 'T00:00:00'))
  } catch {
    return iso
  }
}

function pluralizePoints(n: number): string {
  if (n === 1) return 'بند واحد'
  if (n === 2) return 'بندان'
  if (n >= 3 && n <= 10) return `${n} بنود`
  return `${n} بندًا`
}

interface Props {
  payload: SharePayload
  /** Enable Lenis smooth scrolling — only for the standalone public page. */
  smoothScroll?: boolean
}

/**
 * The public agenda as a premium animated list. GSAP drives the cinematic
 * sequencing: SplitText word-by-word title reveal, per-item scroll reveals,
 * and a progress line drawn along the list as the reader scrolls.
 * It only ever sees public data.
 */
export default function SharedAgendaView({ payload, smoothScroll = false }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Smooth scrolling, wired into ScrollTrigger's clock
    let lenis: Lenis | null = null
    let raf: ((time: number) => void) | null = null
    try {
      if (smoothScroll && !reduce) {
        lenis = new Lenis({ duration: 1.1 })
        lenis.on('scroll', ScrollTrigger.update)
        raf = (time: number) => lenis!.raf(time * 1000)
        gsap.ticker.add(raf)
        gsap.ticker.lagSmoothing(0)
      }
    } catch {
      lenis = null
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        try {
        // Hero: cinematic staged entrance
        const title = root.current!.querySelector('[data-hero-title]')
        const split = title ? new SplitText(title, { type: 'words' }) : null
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.from('[data-hero-mark]', { y: 24, opacity: 0, scale: 0.85, duration: 0.6 })
        tl.from('[data-hero-kicker]', { y: 20, opacity: 0, duration: 0.55 }, '-=0.3')
        if (split && split.words.length) {
          tl.from(
            split.words,
            { y: 40, opacity: 0, filter: 'blur(8px)', duration: 0.7, stagger: 0.09 },
            '-=0.25',
          )
        }
        tl.from('[data-hero-meta] > *', { y: 16, opacity: 0, duration: 0.45, stagger: 0.07 }, '-=0.35')
          .from('[data-hero-obj]', { y: 16, opacity: 0, duration: 0.5 }, '-=0.2')
          .from('[data-hero-hint]', { opacity: 0, duration: 0.6 }, '-=0.1')

        // Progress line drawn alongside the list while scrolling
        gsap.fromTo(
          '[data-progress]',
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: 'top center',
            ease: 'none',
            scrollTrigger: { trigger: '[data-list]', start: 'top 72%', end: 'bottom 72%', scrub: 0.6 },
          },
        )

        // Each list item slides in; its number lights up as the line reaches it
        gsap.utils.toArray<HTMLElement>('[data-item]').forEach((item) => {
          gsap.from(item.querySelector('[data-item-body]'), {
            x: -36,
            opacity: 0,
            filter: 'blur(5px)',
            duration: 0.65,
            ease: 'power3.out',
            scrollTrigger: { trigger: item, start: 'top 85%' },
          })
          const num = item.querySelector('[data-num]')!
          ScrollTrigger.create({
            trigger: item,
            start: 'top 72%',
            onEnter: () => num.classList.add('is-active'),
            onLeaveBack: () => num.classList.remove('is-active'),
          })
        })

        gsap.from('[data-agenda-foot]', {
          opacity: 0,
          y: 20,
          duration: 0.7,
          scrollTrigger: { trigger: '[data-agenda-foot]', start: 'top 94%' },
        })

        return () => split?.revert()
        } catch {
          // An animation failure must never hide the agenda — undo any
          // partially-applied tween state and show everything as-is.
          try {
            gsap.set(root.current!.querySelectorAll('[data-hero-mark],[data-hero-kicker],[data-hero-title],[data-hero-meta] > *,[data-hero-obj],[data-hero-hint],[data-item-body],[data-progress],[data-agenda-foot]'), { clearProps: 'all' })
          } catch {
            /* leave the DOM untouched */
          }
          return undefined
        }
      })
      return () => mm.revert()
    }, root)

    return () => {
      ctx.revert()
      if (raf) gsap.ticker.remove(raf)
      lenis?.destroy()
    }
  }, [payload, smoothScroll])

  return (
    <div ref={root}>
      {/* Hero */}
      <section className="mx-auto flex min-h-[52dvh] max-w-2xl flex-col items-center justify-center px-6 pt-16 text-center">
        <img data-hero-mark src="/mark.png" alt="" className="mb-5 size-16 drop-shadow-[0_10px_30px_rgba(125,240,255,0.25)]" />
        <p data-hero-kicker className="chip mb-5 !border-violet-500/30 text-violet-400">
          دعوة إلى اجتماع
        </p>
        <h1 data-hero-title className="text-balance text-4xl font-bold leading-tight text-mist-100 sm:text-5xl">
          {payload.title || 'جدول أعمال الاجتماع'}
        </h1>
        <div data-hero-meta className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-mist-300">
          {payload.withWhom && <span className="chip">مع {payload.withWhom}</span>}
          <span className="chip">{fmtLongDate(payload.date)}</span>
          <span className="chip tnum">{payload.time}</span>
          {payload.location && <span className="chip">{payload.location}</span>}
          <span className="chip tnum">{pluralizePoints(payload.points.length)}</span>
        </div>
        {payload.objective && (
          <p data-hero-obj className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-mist-300">
            {payload.objective}
          </p>
        )}
        <div data-hero-hint className="mt-12 flex flex-col items-center gap-2 text-mist-600">
          <span className="text-xs">جدول الأعمال</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4 animate-bounce" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* Agenda list */}
      <section className="mx-auto max-w-2xl px-5 pb-10 pt-10 sm:px-6">
        <ol data-list className="relative flex flex-col">
          {/* rail + animated progress line, aligned with the numbers */}
          <div className="absolute inset-y-0 start-[19px] w-px bg-white/8" aria-hidden />
          <div
            data-progress
            className="absolute inset-y-0 start-[18.5px] w-0.5 rounded-full bg-gradient-to-b from-violet-500 to-cyan-400"
            aria-hidden
          />

          {payload.points.map((p, i) => (
            <li key={i} data-item className="relative flex gap-5 pb-10 last:pb-0">
              <span data-num className="share-num tnum relative z-10 mt-0.5 grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold">
                {i + 1}
              </span>
              <div data-item-body className="pane min-w-0 flex-1 px-5 py-4">
                <h2 className="text-xl font-bold leading-snug sm:text-2xl">{p.title}</h2>
                {p.details.trim() && (
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-mist-300">{p.details}</p>
                )}
              </div>
            </li>
          ))}
        </ol>

        {payload.points.length === 0 && (
          <div className="bento p-10 text-center text-mist-500">لا توجد بنود مشتركة في هذا الجدول بعد.</div>
        )}

        <footer data-agenda-foot className="mt-16 pb-16 text-center">
          {payload.sharedNotes && (
            <p className="mx-auto mb-8 max-w-xl text-pretty text-sm leading-relaxed text-mist-300">{payload.sharedNotes}</p>
          )}
          <p className="text-xs text-mist-600">
            أُعدّ هذا الجدول بعناية عبر <span className="grad-text font-bold">لقاء</span>
          </p>
        </footer>
      </section>
    </div>
  )
}

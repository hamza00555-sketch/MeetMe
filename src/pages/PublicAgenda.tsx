import { Component, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import type { SharePayload } from '../types'
import { decodeSharePayload, fetchSharePayload } from '../share'
import SharedAgendaView from '../components/SharedAgendaView'

/** If the animated view ever crashes, show the agenda as a plain list instead of a blank page. */
class ViewBoundary extends Component<{ payload: SharePayload; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    const p = this.props.payload
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold">{p.title || 'جدول أعمال الاجتماع'}</h1>
        <p className="mt-2 text-mist-500">
          {p.withWhom && <>مع {p.withWhom} · </>}
          {p.date} · <span className="tnum">{p.time}</span>
        </p>
        {p.objective && <p className="mt-4 text-mist-300">{p.objective}</p>}
        <ol className="mt-8 flex flex-col gap-4">
          {p.points.map((pt, i) => (
            <li key={i} className="pane p-4">
              <span className="font-bold">
                {i + 1}. {pt.title}
              </span>
              {pt.details.trim() && <p className="mt-1 whitespace-pre-wrap text-sm text-mist-300">{pt.details}</p>}
            </li>
          ))}
        </ol>
      </main>
    )
  }
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: SharePayload }

export default function PublicAgenda() {
  // /s/:id → fetched from the share API; /share/:payload → legacy self-contained link
  const { id, payload } = useParams()
  const [state, setState] = useState<State>(() => {
    if (payload) {
      const data = decodeSharePayload(payload)
      return data ? { status: 'ready', data } : { status: 'error' }
    }
    return { status: 'loading' }
  })

  useEffect(() => {
    if (!id) return
    let alive = true
    fetchSharePayload(id).then((data) => {
      if (alive) setState(data ? { status: 'ready', data } : { status: 'error' })
    })
    return () => {
      alive = false
    }
  }, [id])

  if (state.status === 'loading') {
    return (
      <main className="grid min-h-dvh place-items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 text-mist-500"
        >
          <img src="/mark.png" alt="" className="size-16 animate-pulse" />
          <p className="text-sm">يفتح الدعوة…</p>
        </motion.div>
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="text-4xl">🔗</p>
          <h1 className="mt-4 text-xl font-bold">الرابط غير صالح أو انتهى</h1>
          <p className="mt-2 text-sm text-mist-500">اطلب من منظّم الاجتماع إرسال الرابط من جديد.</p>
        </div>
      </main>
    )
  }

  return (
    <ViewBoundary payload={state.data}>
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <SharedAgendaView payload={state.data} smoothScroll />
      </motion.main>
    </ViewBoundary>
  )
}

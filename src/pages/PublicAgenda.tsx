import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import type { SharePayload } from '../types'
import { decodeSharePayload, fetchSharePayload } from '../share'
import SharedAgendaView from '../components/SharedAgendaView'

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
          <span className="size-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
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
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <SharedAgendaView payload={state.data} smoothScroll />
    </motion.main>
  )
}

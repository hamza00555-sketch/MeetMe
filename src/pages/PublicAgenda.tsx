import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { decodeSharePayload } from '../share'
import SharedAgendaView from '../components/SharedAgendaView'

export default function PublicAgenda() {
  const { payload } = useParams()
  const data = payload ? decodeSharePayload(payload) : null

  if (!data) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="text-4xl">🔗</p>
          <h1 className="mt-4 text-xl font-bold">الرابط غير صالح</h1>
          <p className="mt-2 text-sm text-mist-500">تأكد من نسخ رابط المشاركة كاملًا.</p>
        </div>
      </main>
    )
  }

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <SharedAgendaView payload={data} />
    </motion.main>
  )
}

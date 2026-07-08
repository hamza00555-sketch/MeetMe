import { motion } from 'motion/react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store'
import { emptyMeeting } from '../types'
import type { Meeting } from '../types'
import { Page, EmptyState, PlusIcon, EyeIcon, SparkIcon, SaveIndicator } from '../components/ui'

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const listItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso + 'T00:00:00'))
  } catch {
    return iso
  }
}

function MeetingCard({ m }: { m: Meeting }) {
  const shared = m.points.filter((p) => p.visibility === 'shared').length
  return (
    <motion.div variants={listItem}>
      <Link to={`/meeting/${m.id}`} className="bento bento-hover block p-5">
        <div className="mb-1 flex items-center gap-2 text-xs text-mist-500">
          <span>{fmtDate(m.date)}</span>
          <span className="tnum">{m.time}</span>
          {m.status === 'closed' && <span className="chip !py-0.5 text-mint-400">مُغلق</span>}
        </div>
        <h3 className="truncate text-lg font-bold">{m.title || 'اجتماع بلا عنوان'}</h3>
        {m.withWhom && <p className="mt-0.5 truncate text-sm text-mist-500">مع {m.withWhom}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-mist-500">
          <span className="chip">
            <span className="tnum">{m.points.length}</span> بنود · <span className="tnum">{shared}</span> في الرابط
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Dashboard() {
  const { meetings, upsertMeeting } = useStore()
  const navigate = useNavigate()

  const todayIso = new Date().toISOString().slice(0, 10)
  const today = meetings.filter((m) => m.date === todayIso && m.status !== 'closed')
  const upcoming = meetings.filter((m) => m.date > todayIso && m.status !== 'closed').sort((a, b) => a.date.localeCompare(b.date))
  const past = meetings.filter((m) => m.date < todayIso || m.status === 'closed')
  const next = today[0] ?? upcoming[0]

  function createMeeting() {
    const m = emptyMeeting()
    upsertMeeting(m)
    navigate(`/meeting/${m.id}`)
  }

  return (
    <Page>
      <header className="mb-8 flex items-center justify-between gap-3 pt-4">
        <div>
          <p className="text-sm text-mist-500">
            {new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </p>
          <h1 className="mt-1">
            <img src="/logo.png" alt="لقاء" className="h-14 w-auto sm:h-16" />
          </h1>
        </div>
        <SaveIndicator />
      </header>

      {/* Bento hero row */}
      <motion.div variants={listStagger} initial="hidden" animate="show" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div variants={listItem} className="bento p-5 sm:col-span-2">
          {next ? (
            <div className="flex h-full flex-col items-start justify-center gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">الاجتماع القادم</p>
              <h2 className="mt-1 truncate text-xl font-bold sm:text-2xl">{next.title || 'اجتماع بلا عنوان'}</h2>
              <p className="mt-1 text-sm text-mist-500">
                {fmtDate(next.date)} · <span className="tnum">{next.time}</span>
                {next.withWhom && <> · مع {next.withWhom}</>}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/meeting/${next.id}`} className="btn btn-primary">
                  تجهيز الاجتماع
                </Link>
                <Link to={`/meeting/${next.id}/preview`} className="btn btn-ghost">
                  <EyeIcon /> معاينة الرابط
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-start justify-center gap-3 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">ابدأ هنا</p>
              <h2 className="text-xl font-bold sm:text-2xl">حضّر اجتماعك الأول</h2>
              <p className="text-sm text-mist-500">بنود واضحة تكتبها في ثوانٍ، ورابط مشاركة أنيق يراه الطرف الآخر.</p>
              <button onClick={createMeeting} className="btn btn-primary">
                <PlusIcon /> اجتماع جديد
              </button>
            </div>
          )}
        </motion.div>

        <motion.div variants={listItem} className="bento flex flex-col justify-between p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
            <SparkIcon /> إجراءات سريعة
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={createMeeting} className="btn btn-primary w-full">
              <PlusIcon /> اجتماع جديد
            </button>
          </div>
        </motion.div>
      </motion.div>

      {today.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold text-mist-300">اجتماعات اليوم</h2>
          <motion.div variants={listStagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {today.map((m) => (
              <MeetingCard key={m.id} m={m} />
            ))}
          </motion.div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold text-mist-300">القادمة</h2>
          <motion.div variants={listStagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcoming.map((m) => (
              <MeetingCard key={m.id} m={m} />
            ))}
          </motion.div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-mist-300">السابقة</h2>
          <div className="grid grid-cols-1 gap-4 opacity-70 md:grid-cols-2">
            {past.map((m) => (
              <MeetingCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {meetings.length === 0 && (
        <EmptyState
          icon="📋"
          title="لا توجد اجتماعات بعد"
          hint="أنشئ اجتماعك الأول واكتب بنوده في ثوانٍ."
        />
      )}
    </Page>
  )
}

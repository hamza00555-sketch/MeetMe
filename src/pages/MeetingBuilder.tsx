import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion, Reorder } from 'motion/react'
import { useStore } from '../store'
import { emptyPoint } from './../types'
import type { AgendaPoint, Meeting } from '../types'
import { readiness, readinessLabel, totalMinutes } from '../readiness'
import { shareUrl } from '../share'
import AgendaEditorCard from '../components/AgendaEditorCard'
import { Page, TopBar, ScoreRing, PlusIcon, PlayIcon, LinkIcon, EyeIcon, CheckIcon, ClockIcon } from '../components/ui'

export default function MeetingBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getMeeting, updateMeeting, deleteMeeting } = useStore()
  const meeting = getMeeting(id!)
  const [copied, setCopied] = useState(false)

  if (!meeting) {
    return (
      <Page>
        <TopBar title="الاجتماع غير موجود" back="/" />
        <p className="text-mist-500">ربما تم حذفه. عُد إلى لوحة التحكم.</p>
      </Page>
    )
  }

  const r = readiness(meeting)
  const patch = (p: Partial<Meeting>) => updateMeeting(meeting.id, p)

  function patchPoint(pointId: string, p: Partial<AgendaPoint>) {
    updateMeeting(meeting!.id, (m) => ({
      ...m,
      points: m.points.map((pt) => (pt.id === pointId ? { ...pt, ...p } : pt)),
    }))
  }

  function addPoint() {
    updateMeeting(meeting!.id, (m) => ({ ...m, points: [...m.points, emptyPoint()] }))
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl(meeting!))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — preview page offers the link too
      navigate(`/meeting/${meeting!.id}/preview`)
    }
  }

  return (
    <Page>
      <TopBar
        title={meeting.title || 'اجتماع جديد'}
        back="/"
        actions={
          <div className="flex gap-2">
            <Link to={`/meeting/${meeting.id}/present`} className="btn btn-primary max-sm:!px-3" title="وضع العرض">
              <PlayIcon /> <span className="max-sm:hidden">عرض</span>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Details + readiness column */}
        <div className="flex flex-col gap-4 lg:order-2">
          <div className="bento flex items-center gap-4 p-5">
            <ScoreRing score={r.score} label={readinessLabel(r.score)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">جاهزية الاجتماع</p>
              <ul className="mt-1.5 flex flex-col gap-1 text-xs text-mist-500">
                {r.hints.length === 0 ? (
                  <li className="flex items-center gap-1.5 text-mint-400">
                    <CheckIcon /> كل شيء جاهز، بالتوفيق!
                  </li>
                ) : (
                  r.hints.map((h) => (
                    <li key={h} className="flex items-start gap-1.5">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-400" />
                      {h}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="bento flex flex-col gap-3 p-5">
            <label>
              <span className="mb-1 block text-xs font-semibold text-mist-500">عنوان الاجتماع</span>
              <input className="field" value={meeting.title} onChange={(e) => patch({ title: e.target.value })} placeholder="مثال: مراجعة خطة التسويق" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-mist-500">مع من؟</span>
              <input className="field" value={meeting.withWhom} onChange={(e) => patch({ withWhom: e.target.value })} placeholder="أسماء الحضور" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1 block text-xs font-semibold text-mist-500">التاريخ</span>
                <input type="date" className="field tnum" value={meeting.date} onChange={(e) => patch({ date: e.target.value })} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-mist-500">الوقت</span>
                <input type="time" className="field tnum" value={meeting.time} onChange={(e) => patch({ time: e.target.value })} />
              </label>
            </div>
            <label>
              <span className="mb-1 block text-xs font-semibold text-mist-500">المكان / الرابط</span>
              <input className="field" value={meeting.location} onChange={(e) => patch({ location: e.target.value })} placeholder="قاعة الاجتماعات، Zoom…" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-mist-500">الهدف الرئيسي</span>
              <textarea className="field min-h-16 resize-y" value={meeting.objective} onChange={(e) => patch({ objective: e.target.value })} placeholder="ما القرار أو النتيجة الأهم من هذا الاجتماع؟" />
            </label>
            <label>
              <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                <EyeIcon /> ملاحظات مشتركة — تظهر في رابط المشاركة
              </span>
              <textarea className="field min-h-16 resize-y" value={meeting.sharedNotes} onChange={(e) => patch({ sharedNotes: e.target.value })} placeholder="سياق أو تمهيد يراه الطرف الآخر" />
            </label>
          </div>

          <div className="bento flex flex-col gap-2 p-5">
            <p className="mb-1 text-xs font-semibold text-mist-500">المشاركة والمتابعة</p>
            <Link to={`/meeting/${meeting.id}/preview`} className="btn btn-ghost w-full">
              <EyeIcon /> معاينة ما سيراه الآخرون
            </Link>
            <button onClick={copyShareLink} className="btn btn-ghost w-full">
              {copied ? <CheckIcon /> : <LinkIcon />} {copied ? 'تم نسخ الرابط!' : 'نسخ رابط المشاركة'}
            </button>
            <Link to={`/meeting/${meeting.id}/close`} className="btn btn-ghost w-full">
              <CheckIcon /> إغلاق الاجتماع وتسجيل النتائج
            </Link>
            <button
              className="btn btn-danger mt-2 w-full"
              onClick={() => {
                if (confirm('حذف هذا الاجتماع نهائيًا؟')) {
                  deleteMeeting(meeting.id)
                  navigate('/')
                }
              }}
            >
              حذف الاجتماع
            </button>
          </div>
        </div>

        {/* Agenda column */}
        <div className="lg:order-1 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-mist-300">جدول الأعمال</h2>
            <span className="chip">
              <ClockIcon /> المجموع <span className="tnum">{totalMinutes(meeting)}</span> دقيقة
            </span>
          </div>

          {meeting.points.length === 0 && (
            <div className="bento mb-4 p-8 text-center text-sm text-mist-500">
              ابدأ بإضافة أول بند — حدد نوعه وهدفه ونقاط الحديث، وقرر إن كان خاصًا أو مشتركًا.
            </div>
          )}

          <Reorder.Group
            axis="y"
            values={meeting.points}
            onReorder={(points) => patch({ points })}
            className="flex flex-col gap-3"
          >
            <AnimatePresence initial={false}>
              {meeting.points.map((p, i) => (
                <AgendaEditorCard
                  key={p.id}
                  point={p}
                  index={i}
                  onChange={(patchP) => patchPoint(p.id, patchP)}
                  onDelete={() => updateMeeting(meeting.id, (m) => ({ ...m, points: m.points.filter((x) => x.id !== p.id) }))}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>

          <motion.button
            layout
            onClick={addPoint}
            className="btn btn-ghost mt-4 w-full border-dashed !border-white/15 py-4"
          >
            <PlusIcon /> إضافة بند جديد
          </motion.button>
        </div>
      </div>
    </Page>
  )
}

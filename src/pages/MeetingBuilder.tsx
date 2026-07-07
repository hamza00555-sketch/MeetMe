import { useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, Reorder } from 'motion/react'
import { useStore } from '../store'
import { newPoint } from '../types'
import type { AgendaPoint, Meeting } from '../types'
import { deliverInvite, getOrganizer, setOrganizer } from '../share'
import AgendaEditorCard from '../components/AgendaEditorCard'
import { Page, TopBar, PlusIcon, LinkIcon, EyeIcon, CheckIcon } from '../components/ui'

type ShareState = 'idle' | 'busy' | 'done' | 'error'

export default function MeetingBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getMeeting, updateMeeting, deleteMeeting } = useStore()
  const meeting = getMeeting(id!)
  const [draft, setDraft] = useState('')
  const [organizer, setOrganizerState] = useState(getOrganizer)
  const [shareState, setShareState] = useState<ShareState>('idle')
  const quickAddRef = useRef<HTMLInputElement>(null)

  if (!meeting) {
    return (
      <Page>
        <TopBar title="الاجتماع غير موجود" back="/" />
        <p className="text-mist-500">ربما تم حذفه. عُد إلى لوحة التحكم.</p>
      </Page>
    )
  }

  const patch = (p: Partial<Meeting>) => updateMeeting(meeting.id, p)
  const sharedCount = meeting.points.filter((p) => p.visibility === 'shared').length

  function patchPoint(pointId: string, p: Partial<AgendaPoint>) {
    updateMeeting(meeting!.id, (m) => ({
      ...m,
      points: m.points.map((pt) => (pt.id === pointId ? { ...pt, ...p } : pt)),
    }))
  }

  function quickAdd() {
    const title = draft.trim()
    if (!title) return
    updateMeeting(meeting!.id, (m) => ({ ...m, points: [...m.points, newPoint(title)] }))
    setDraft('')
    quickAddRef.current?.focus()
  }

  async function share() {
    if (shareState === 'busy') return
    setShareState('busy')
    try {
      await deliverInvite(meeting!, organizer)
      setShareState('done')
      setTimeout(() => setShareState('idle'), 2500)
    } catch {
      setShareState('error')
      setTimeout(() => setShareState('idle'), 4000)
    }
  }

  return (
    <Page>
      <TopBar
        title={meeting.title || 'اجتماع جديد'}
        back="/"
        actions={
          <Link to={`/meeting/${meeting.id}/preview`} className="btn btn-ghost max-sm:!px-3">
            <EyeIcon /> <span className="max-sm:hidden">معاينة ما سيراه الآخرون</span>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
        {/* 1 — Meeting details */}
        <div className="lg:col-start-3 lg:row-start-1">
          <div className="bento flex flex-col gap-3 p-4 sm:p-5">
            <label>
              <span className="mb-1 block text-xs font-semibold text-mist-500">عنوان الاجتماع</span>
              <input className="field" value={meeting.title} onChange={(e) => patch({ title: e.target.value })} placeholder="مثال: مراجعة خطة التسويق" />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-mist-500">مع من؟</span>
              <input className="field" value={meeting.withWhom} onChange={(e) => patch({ withWhom: e.target.value })} placeholder="أسماء الحضور" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="min-w-0">
                <span className="mb-1 block text-xs font-semibold text-mist-500">التاريخ</span>
                <input type="date" className="field tnum" value={meeting.date} onChange={(e) => patch({ date: e.target.value })} />
              </label>
              <label className="min-w-0">
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
              <textarea className="field min-h-16 resize-y" value={meeting.objective} onChange={(e) => patch({ objective: e.target.value })} placeholder="ما أهم نتيجة تريدها من هذا الاجتماع؟" />
            </label>
          </div>
        </div>

        {/* 2 — Agenda points */}
        <div className="lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-mist-300">بنود الاجتماع</h2>
            {meeting.points.length > 0 && (
              <span className="chip">
                <span className="tnum">{meeting.points.length}</span> بنود · <span className="tnum">{sharedCount}</span> في الدعوة
              </span>
            )}
          </div>

          {/* Quick add */}
          <div className="bento mb-3 flex items-center gap-2 p-2 ps-4">
            <span className="text-violet-400">
              <PlusIcon />
            </span>
            <input
              ref={quickAddRef}
              className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-mist-600"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
              placeholder="اكتب بندًا واضغط Enter…"
            />
            <button className="btn btn-ghost !py-1.5 text-xs" onClick={quickAdd} disabled={!draft.trim()}>
              إضافة
            </button>
          </div>

          <Reorder.Group
            axis="y"
            values={meeting.points}
            onReorder={(points) => patch({ points })}
            className="flex flex-col gap-2.5"
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

          {meeting.points.length === 0 && (
            <div className="bento p-8 text-center text-sm text-mist-500">
              اكتب بنود اجتماعك فوق، بندًا بندًا — وحدد أي البنود تبقى خاصة لك وأيها تُشارك.
            </div>
          )}
        </div>

        {/* 3 — Share (last) */}
        <div className="lg:col-start-3 lg:row-start-2">
          <div className="bento flex flex-col gap-2 p-4 sm:p-5">
            <p className="mb-1 text-xs font-semibold text-mist-500">المشاركة</p>
            <label>
              <span className="mb-1 block text-xs font-semibold text-mist-500">اسمك في الدعوة</span>
              <input
                className="field"
                value={organizer}
                onChange={(e) => {
                  setOrganizerState(e.target.value)
                  setOrganizer(e.target.value)
                }}
                placeholder="حمزة"
              />
            </label>
            <button onClick={share} className="btn btn-primary mt-1 w-full" disabled={shareState === 'busy'}>
              {shareState === 'done' ? <CheckIcon /> : <LinkIcon />}
              {shareState === 'busy'
                ? 'يجهّز الدعوة…'
                : shareState === 'done'
                  ? 'تمت مشاركة الدعوة!'
                  : 'مشاركة الدعوة'}
            </button>
            {shareState === 'error' && (
              <p className="text-[11.5px] leading-relaxed text-rose-400">
                تعذّر إنشاء رابط الدعوة — تحقق من اتصالك بالإنترنت وحاول مرة أخرى.
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2 border-t border-white/5 pt-3">
              <Link to={`/meeting/${meeting.id}/close`} className="btn btn-ghost w-full">
                <CheckIcon /> ما بعد الاجتماع
              </Link>
              <button
                className="btn btn-danger w-full"
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
        </div>
      </div>
    </Page>
  )
}

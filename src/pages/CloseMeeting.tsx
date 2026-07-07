import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useStore } from '../store'
import type { Meeting } from '../types'
import { newId } from '../types'
import { Page, TopBar, PlusIcon, TrashIcon, CheckIcon, LockIcon } from '../components/ui'

export default function CloseMeeting() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getMeeting, updateMeeting } = useStore()
  const meeting = getMeeting(id!)

  if (!meeting) {
    return (
      <Page>
        <TopBar title="الاجتماع غير موجود" back="/" />
      </Page>
    )
  }

  const patch = (p: Partial<Meeting>) => updateMeeting(meeting.id, p)
  const doneCount = meeting.points.filter((p) => p.done).length

  function togglePoint(pointId: string) {
    updateMeeting(meeting!.id, (m) => ({
      ...m,
      points: m.points.map((p) => (p.id === pointId ? { ...p, done: !p.done } : p)),
    }))
  }

  return (
    <Page>
      <TopBar title={`ما بعد: ${meeting.title || 'الاجتماع'}`} back={`/meeting/${meeting.id}`} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Point checklist */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-mist-300">علّم على البنود المنجزة</h2>
            {meeting.points.length > 0 && (
              <span className="chip tnum">
                {doneCount} / {meeting.points.length}
              </span>
            )}
          </div>
          {meeting.points.length === 0 && <div className="bento p-6 text-sm text-mist-500">لا توجد بنود في هذا الاجتماع.</div>}
          {meeting.points.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => togglePoint(p.id)}
              className="bento bento-hover flex items-center gap-3 p-4 text-start"
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-lg border transition-colors ${p.done ? 'border-mint-400 bg-mint-400/20 text-mint-400' : 'border-white/15 text-transparent'}`}
              >
                <CheckIcon />
              </span>
              <span className={`min-w-0 flex-1 font-semibold ${p.done ? 'line-through opacity-60' : ''}`}>
                {p.title || `بند ${i + 1}`}
              </span>
              {p.visibility === 'private' && (
                <span className="text-amber-400" title="بند خاص">
                  <LockIcon />
                </span>
              )}
            </motion.button>
          ))}
        </section>

        {/* Follow-up */}
        <section className="flex flex-col gap-4">
          <div className="bento p-5">
            <h2 className="mb-3 text-sm font-bold text-cyan-400">مهام المتابعة</h2>
            <div className="flex flex-col gap-3">
              {meeting.actionItems.map((a) => (
                <div key={a.id} className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/2 p-3">
                  <div className="flex items-center gap-2">
                    <button
                      className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${a.done ? 'border-mint-400 bg-mint-400/20 text-mint-400' : 'border-white/15 text-transparent'}`}
                      onClick={() => patch({ actionItems: meeting.actionItems.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)) })}
                      aria-label="اكتملت"
                    >
                      <CheckIcon />
                    </button>
                    <input
                      className={`field ${a.done ? 'line-through opacity-60' : ''}`}
                      value={a.title}
                      onChange={(e) => patch({ actionItems: meeting.actionItems.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)) })}
                      placeholder="المهمة"
                    />
                    <button className="text-mist-600 hover:text-rose-400" onClick={() => patch({ actionItems: meeting.actionItems.filter((x) => x.id !== a.id) })} aria-label="حذف المهمة">
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="field !py-1.5 text-xs"
                      value={a.owner}
                      onChange={(e) => patch({ actionItems: meeting.actionItems.map((x) => (x.id === a.id ? { ...x, owner: e.target.value } : x)) })}
                      placeholder="المسؤول"
                    />
                    <input
                      type="date"
                      className="field tnum !py-1.5 text-xs"
                      value={a.due}
                      onChange={(e) => patch({ actionItems: meeting.actionItems.map((x) => (x.id === a.id ? { ...x, due: e.target.value } : x)) })}
                    />
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost self-start !py-1.5 text-xs" onClick={() => patch({ actionItems: [...meeting.actionItems, { id: newId(), title: '', owner: '', due: '', done: false }] })}>
                <PlusIcon /> مهمة
              </button>
            </div>
          </div>

          <div className="bento p-5">
            <h2 className="mb-3 text-sm font-bold text-mist-300">ملاحظة ختامية</h2>
            <textarea className="field min-h-24 resize-y" value={meeting.followUpNotes} onChange={(e) => patch({ followUpNotes: e.target.value })} placeholder="أي شيء تريد تذكّره بعد الاجتماع" />
          </div>

          <button
            onClick={() => {
              patch({ status: 'closed' })
              navigate('/')
            }}
            className="btn btn-primary w-full py-3"
          >
            <CheckIcon /> {meeting.status === 'closed' ? 'حفظ والعودة' : 'إغلاق الاجتماع'}
          </button>
        </section>
      </div>
    </Page>
  )
}

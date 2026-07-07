import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useStore } from '../store'
import type { AgendaPoint, Meeting, PointOutcome } from '../types'
import { newId, AGENDA_TYPE_COLORS } from '../types'
import { Page, TopBar, PlusIcon, TrashIcon, CheckIcon } from '../components/ui'

const OUTCOMES: Array<{ key: PointOutcome; label: string; color: string }> = [
  { key: 'decided', label: 'تم القرار', color: 'var(--color-mint-400)' },
  { key: 'task', label: 'تحوّل لمهمة', color: 'var(--color-cyan-400)' },
  { key: 'postponed', label: 'مؤجّل', color: 'var(--color-amber-400)' },
  { key: 'dropped', label: 'أُلغي', color: 'var(--color-mist-600)' },
]

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

  function setOutcome(point: AgendaPoint, outcome: PointOutcome) {
    updateMeeting(meeting!.id, (m) => {
      let next: Meeting = {
        ...m,
        points: m.points.map((p) => (p.id === point.id ? { ...p, outcome: p.outcome === outcome ? 'pending' : outcome } : p)),
      }
      // Converting a point into a task creates a linked action item once.
      if (outcome === 'task' && point.outcome !== 'task' && !m.actionItems.some((a) => a.fromPointId === point.id)) {
        next = {
          ...next,
          actionItems: [...next.actionItems, { id: newId(), title: point.title, owner: '', due: '', done: false, fromPointId: point.id }],
        }
      }
      // Marking as decided seeds a linked decision from the expected outcome.
      if (outcome === 'decided' && point.outcome !== 'decided' && !m.decisions.some((d) => d.fromPointId === point.id)) {
        next = {
          ...next,
          decisions: [...next.decisions, { id: newId(), text: point.expectedOutcome || point.title, fromPointId: point.id }],
        }
      }
      return next
    })
  }

  function closeMeeting() {
    patch({ status: 'closed' })
    navigate('/')
  }

  return (
    <Page>
      <TopBar title={`إغلاق: ${meeting.title || 'الاجتماع'}`} back={`/meeting/${meeting.id}`} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Point outcomes */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-mist-300">ماذا حدث لكل بند؟</h2>
          {meeting.points.length === 0 && <div className="bento p-6 text-sm text-mist-500">لا توجد بنود في هذا الاجتماع.</div>}
          {meeting.points.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="bento relative overflow-hidden p-4"
            >
              <div className="absolute inset-y-0 start-0 w-1" style={{ background: AGENDA_TYPE_COLORS[p.type], opacity: 0.8 }} />
              <p className="ps-2 font-semibold">{p.title || `بند ${i + 1}`}</p>
              <div className="mt-3 flex flex-wrap gap-2 ps-2">
                {OUTCOMES.map((o) => {
                  const active = p.outcome === o.key
                  return (
                    <button
                      key={o.key}
                      onClick={() => setOutcome(p, o.key)}
                      className="chip transition-all"
                      style={
                        active
                          ? { background: `color-mix(in srgb, ${o.color} 18%, transparent)`, borderColor: `color-mix(in srgb, ${o.color} 50%, transparent)`, color: o.color }
                          : undefined
                      }
                    >
                      {active && <CheckIcon />} {o.label}
                    </button>
                  )
                })}
              </div>
              {p.outcome !== 'pending' && (
                <input
                  className="field mt-3"
                  value={p.outcomeNote}
                  onChange={(e) =>
                    updateMeeting(meeting.id, (m) => ({
                      ...m,
                      points: m.points.map((x) => (x.id === p.id ? { ...x, outcomeNote: e.target.value } : x)),
                    }))
                  }
                  placeholder="تفاصيل إضافية (اختياري)"
                />
              )}
            </motion.div>
          ))}
        </section>

        {/* Decisions, tasks, follow-up */}
        <section className="flex flex-col gap-4">
          <div className="bento p-5">
            <h2 className="mb-3 text-sm font-bold text-mint-400">القرارات</h2>
            <div className="flex flex-col gap-2">
              {meeting.decisions.map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  <span className="mt-0.5 text-mint-400">
                    <CheckIcon />
                  </span>
                  <input
                    className="field"
                    value={d.text}
                    onChange={(e) => patch({ decisions: meeting.decisions.map((x) => (x.id === d.id ? { ...x, text: e.target.value } : x)) })}
                  />
                  <button className="text-mist-600 hover:text-rose-400" onClick={() => patch({ decisions: meeting.decisions.filter((x) => x.id !== d.id) })} aria-label="حذف القرار">
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button className="btn btn-ghost self-start !py-1.5 text-xs" onClick={() => patch({ decisions: [...meeting.decisions, { id: newId(), text: '' }] })}>
                <PlusIcon /> قرار
              </button>
            </div>
          </div>

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
            <h2 className="mb-3 text-sm font-bold text-mist-300">ملاحظات المتابعة</h2>
            <textarea className="field min-h-24 resize-y" value={meeting.followUpNotes} onChange={(e) => patch({ followUpNotes: e.target.value })} placeholder="أي شيء تريد تذكّره بعد الاجتماع" />
          </div>

          <button onClick={closeMeeting} className="btn btn-primary w-full py-3">
            <CheckIcon /> {meeting.status === 'closed' ? 'حفظ والعودة' : 'إغلاق الاجتماع'}
          </button>
        </section>
      </div>
    </Page>
  )
}

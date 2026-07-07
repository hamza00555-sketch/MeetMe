import { useState } from 'react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'motion/react'
import type { AgendaPoint, AgendaType } from '../types'
import { AGENDA_TYPE_LABELS, AGENDA_TYPE_COLORS } from '../types'
import { EyeIcon, LockIcon, TrashIcon, GripIcon, ClockIcon, PlusIcon } from './ui'

interface Props {
  point: AgendaPoint
  index: number
  onChange: (patch: Partial<AgendaPoint>) => void
  onDelete: () => void
}

export default function AgendaEditorCard({ point, index, onChange, onDelete }: Props) {
  const [open, setOpen] = useState(!point.title)
  const controls = useDragControls()
  const color = AGENDA_TYPE_COLORS[point.type]
  const isShared = point.visibility === 'shared'

  function setTalkingPoint(i: number, value: string) {
    const next = [...point.talkingPoints]
    next[i] = value
    onChange({ talkingPoints: next })
  }

  return (
    <Reorder.Item
      value={point}
      dragListener={false}
      dragControls={controls}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="bento relative overflow-hidden"
      style={{ boxShadow: undefined }}
    >
      {/* type accent bar on the start edge */}
      <div className="absolute inset-y-0 start-0 w-1" style={{ background: color, opacity: 0.8 }} aria-hidden />

      <div className="flex items-center gap-2 p-4 pe-3 ps-5">
        <button
          className="cursor-grab touch-none text-mist-600 hover:text-mist-300 active:cursor-grabbing"
          onPointerDown={(e) => controls.start(e)}
          aria-label="اسحب لإعادة الترتيب"
        >
          <GripIcon />
        </button>
        <span className="tnum grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
          {index + 1}
        </span>
        <button className="min-w-0 flex-1 text-start" onClick={() => setOpen((o) => !o)}>
          <span className={`block truncate font-semibold ${point.title ? '' : 'text-mist-600'}`}>
            {point.title || 'بند جديد…'}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-mist-500">
            <span style={{ color }}>{AGENDA_TYPE_LABELS[point.type]}</span>
            <span className="tnum inline-flex items-center gap-1">
              <ClockIcon /> {point.timeEstimate} د
            </span>
          </span>
        </button>
        <button
          className={`chip shrink-0 transition-colors ${isShared ? '!border-cyan-400/40 text-cyan-400' : 'text-mist-500'}`}
          onClick={() => onChange({ visibility: isShared ? 'private' : 'shared' })}
          title={isShared ? 'ظاهر في رابط المشاركة — اضغط لجعله خاصًا' : 'خاص — اضغط لمشاركته'}
        >
          {isShared ? <EyeIcon /> : <LockIcon />}
          <span className="hidden sm:inline">{isShared ? 'مشترك' : 'خاص'}</span>
        </button>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-mist-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 border-t border-white/5 p-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-mist-500">عنوان البند</span>
                <input className="field" value={point.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="مثال: خطة إطلاق الربع القادم" autoFocus={!point.title} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold text-mist-500">النوع</span>
                <select className="field" value={point.type} onChange={(e) => onChange({ type: e.target.value as AgendaType })}>
                  {(Object.keys(AGENDA_TYPE_LABELS) as AgendaType[]).map((t) => (
                    <option key={t} value={t}>
                      {AGENDA_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold text-mist-500">
                  الوقت المقدّر — <span className="tnum">{point.timeEstimate}</span> دقيقة
                </span>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={point.timeEstimate}
                  onChange={(e) => onChange({ timeEstimate: Number(e.target.value) })}
                  className="w-full accent-(--color-violet-500)"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-mist-500">الهدف من هذا البند</span>
                <input className="field" value={point.goal} onChange={(e) => onChange({ goal: e.target.value })} placeholder="ماذا تريد أن تحقق من هذا البند؟" />
              </label>

              <div className="sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-mist-500">نقاط الحديث</span>
                <div className="flex flex-col gap-2">
                  {point.talkingPoints.map((tp, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                      <input className="field" value={tp} onChange={(e) => setTalkingPoint(i, e.target.value)} placeholder={`نقطة ${i + 1}`} />
                      <button
                        className="text-mist-600 hover:text-rose-400"
                        onClick={() => onChange({ talkingPoints: point.talkingPoints.filter((_, j) => j !== i) })}
                        aria-label="حذف النقطة"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-ghost self-start !py-1.5 text-xs" onClick={() => onChange({ talkingPoints: [...point.talkingPoints, ''] })}>
                    <PlusIcon /> نقطة حديث
                  </button>
                </div>
              </div>

              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-mist-500">النتيجة المتوقعة</span>
                <input className="field" value={point.expectedOutcome} onChange={(e) => onChange({ expectedOutcome: e.target.value })} placeholder="مثال: الاتفاق على موعد الإطلاق" />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <LockIcon /> ملاحظات خاصة — لا تظهر في رابط المشاركة أبدًا
                </span>
                <textarea
                  className="field min-h-20 resize-y"
                  value={point.privateNotes}
                  onChange={(e) => onChange({ privateNotes: e.target.value })}
                  placeholder="أرقام، حجج تفاوض، تحفظات…"
                />
              </label>

              <div className="flex justify-end sm:col-span-2">
                <button className="btn btn-danger !py-1.5 text-xs" onClick={onDelete}>
                  <TrashIcon /> حذف البند
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

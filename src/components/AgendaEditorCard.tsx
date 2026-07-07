import { useState } from 'react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'motion/react'
import type { AgendaPoint } from '../types'
import { EyeIcon, LockIcon, TrashIcon, GripIcon } from './ui'

interface Props {
  point: AgendaPoint
  index: number
  onChange: (patch: Partial<AgendaPoint>) => void
  onDelete: () => void
}

export default function AgendaEditorCard({ point, index, onChange, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const controls = useDragControls()
  const isShared = point.visibility === 'shared'
  const hasDetails = point.details.trim().length > 0

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
    >
      <div
        className="absolute inset-y-0 start-0 w-1"
        style={{ background: isShared ? 'var(--color-cyan-400)' : 'var(--color-amber-400)', opacity: 0.7 }}
        aria-hidden
      />

      <div className="flex items-center gap-2 p-3 pe-3 ps-4">
        <button
          className="cursor-grab touch-none text-mist-600 hover:text-mist-300 active:cursor-grabbing"
          onPointerDown={(e) => controls.start(e)}
          aria-label="اسحب لإعادة الترتيب"
        >
          <GripIcon />
        </button>
        <span className="tnum grid size-6 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-bold text-mist-300">
          {index + 1}
        </span>
        <input
          className="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-mist-600"
          value={point.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="عنوان البند…"
        />
        <button
          className={`chip shrink-0 transition-colors ${isShared ? '!border-cyan-400/40 text-cyan-400' : '!border-amber-400/40 text-amber-400'}`}
          onClick={() => onChange({ visibility: isShared ? 'private' : 'shared' })}
          title={isShared ? 'ظاهر في رابط المشاركة — اضغط لجعله خاصًا' : 'خاص — اضغط لمشاركته'}
        >
          {isShared ? <EyeIcon /> : <LockIcon />}
          <span className="hidden sm:inline">{isShared ? 'مشترك' : 'خاص'}</span>
        </button>
        <button className="text-mist-600 hover:text-rose-400" onClick={onDelete} aria-label="حذف البند">
          <TrashIcon />
        </button>
        <button
          className="flex items-center gap-1 text-mist-600 hover:text-mist-300"
          onClick={() => setOpen((o) => !o)}
          aria-label="تفاصيل إضافية"
        >
          {hasDetails && !open && <span className="size-1.5 rounded-full bg-violet-400" />}
          <motion.span animate={{ rotate: open ? 180 : 0 }} className="block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 p-4 ps-12">
              <textarea
                className="field min-h-20 resize-y"
                value={point.details}
                onChange={(e) => onChange({ details: e.target.value })}
                placeholder={isShared ? 'تفاصيل إضافية — تظهر في رابط المشاركة' : 'تفاصيل إضافية — بند خاص، لن تظهر لأحد'}
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

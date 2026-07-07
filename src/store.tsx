import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Meeting } from './types'

const STORAGE_KEY = 'meetme.meetings.v2'
const LEGACY_KEY = 'meetme.meetings.v1'

/** Converts a v1 point (type/goal/talking points/…) into the flat v2 shape. */
function migratePoint(p: Record<string, unknown>) {
  const lines: string[] = []
  if (typeof p.goal === 'string' && p.goal.trim()) lines.push(p.goal.trim())
  if (Array.isArray(p.talkingPoints)) {
    for (const t of p.talkingPoints) if (typeof t === 'string' && t.trim()) lines.push(`• ${t.trim()}`)
  }
  if (typeof p.expectedOutcome === 'string' && p.expectedOutcome.trim())
    lines.push(`النتيجة المتوقعة: ${p.expectedOutcome.trim()}`)
  if (p.visibility === 'private' && typeof p.privateNotes === 'string' && p.privateNotes.trim())
    lines.push(p.privateNotes.trim())
  return {
    id: String(p.id ?? Math.random().toString(36).slice(2)),
    title: typeof p.title === 'string' ? p.title : '',
    details: lines.join('\n'),
    visibility: p.visibility === 'private' ? 'private' : 'shared',
    done: p.outcome === 'decided' || p.outcome === 'task',
  }
}

function migrateV1(): Meeting[] | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const migrated = parsed.map((m: Record<string, unknown>) => ({
      id: String(m.id ?? Math.random().toString(36).slice(2)),
      title: typeof m.title === 'string' ? m.title : '',
      withWhom: typeof m.withWhom === 'string' ? m.withWhom : '',
      date: typeof m.date === 'string' ? m.date : new Date().toISOString().slice(0, 10),
      time: typeof m.time === 'string' ? m.time : '10:00',
      location: typeof m.location === 'string' ? m.location : '',
      objective: typeof m.objective === 'string' ? m.objective : '',
      sharedNotes: typeof m.sharedNotes === 'string' ? m.sharedNotes : '',
      points: Array.isArray(m.points) ? m.points.map(migratePoint) : [],
      actionItems: Array.isArray(m.actionItems)
        ? m.actionItems.map((a: Record<string, unknown>) => ({
            id: String(a.id ?? Math.random().toString(36).slice(2)),
            title: typeof a.title === 'string' ? a.title : '',
            owner: typeof a.owner === 'string' ? a.owner : '',
            due: typeof a.due === 'string' ? a.due : '',
            done: Boolean(a.done),
          }))
        : [],
      followUpNotes: typeof m.followUpNotes === 'string' ? m.followUpNotes : '',
      status: m.status === 'closed' ? 'closed' : 'draft',
      createdAt: typeof m.createdAt === 'number' ? m.createdAt : Date.now(),
      updatedAt: typeof m.updatedAt === 'number' ? m.updatedAt : Date.now(),
    })) as Meeting[]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    localStorage.removeItem(LEGACY_KEY)
    return migrated
  } catch {
    return null
  }
}

interface StoreValue {
  meetings: Meeting[]
  saveState: 'idle' | 'saving' | 'saved'
  getMeeting: (id: string) => Meeting | undefined
  upsertMeeting: (m: Meeting) => void
  updateMeeting: (id: string, patch: Partial<Meeting> | ((m: Meeting) => Meeting)) => void
  deleteMeeting: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

function load(): Meeting[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return migrateV1() ?? []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>(load)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const first = useRef(true)

  // Debounced auto-save: mark "saving" immediately, persist shortly after the
  // last change, then settle into "saved".
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings))
      } catch {
        // storage full or unavailable — keep working in memory
      }
      setSaveState('saved')
      if (settleTimer.current) clearTimeout(settleTimer.current)
      settleTimer.current = setTimeout(() => setSaveState('idle'), 2000)
    }, 500)
  }, [meetings])

  const getMeeting = useCallback((id: string) => meetings.find((m) => m.id === id), [meetings])

  const upsertMeeting = useCallback((m: Meeting) => {
    setMeetings((prev) => {
      const i = prev.findIndex((x) => x.id === m.id)
      const stamped = { ...m, updatedAt: Date.now() }
      if (i === -1) return [stamped, ...prev]
      const next = [...prev]
      next[i] = stamped
      return next
    })
  }, [])

  const updateMeeting = useCallback(
    (id: string, patch: Partial<Meeting> | ((m: Meeting) => Meeting)) => {
      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m
          const next = typeof patch === 'function' ? patch(m) : { ...m, ...patch }
          return { ...next, updatedAt: Date.now() }
        }),
      )
    },
    [],
  )

  const deleteMeeting = useCallback((id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const value = useMemo(
    () => ({ meetings, saveState, getMeeting, upsertMeeting, updateMeeting, deleteMeeting }),
    [meetings, saveState, getMeeting, upsertMeeting, updateMeeting, deleteMeeting],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

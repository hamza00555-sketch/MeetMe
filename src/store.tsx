import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Meeting } from './types'

const STORAGE_KEY = 'meetme.meetings.v1'

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
    if (!raw) return []
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

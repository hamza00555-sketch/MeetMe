export type Visibility = 'private' | 'shared'

export interface AgendaPoint {
  id: string
  title: string
  details: string
  visibility: Visibility
  done: boolean
}

export interface ActionItem {
  id: string
  title: string
  owner: string
  due: string // ISO date or ''
  done: boolean
}

export type MeetingStatus = 'draft' | 'closed'

export interface Meeting {
  id: string
  title: string
  withWhom: string
  date: string // ISO date yyyy-mm-dd
  time: string // HH:mm
  location: string
  objective: string
  sharedNotes: string
  points: AgendaPoint[]
  actionItems: ActionItem[]
  followUpNotes: string
  status: MeetingStatus
  createdAt: number
  updatedAt: number
}

/** The payload embedded in a public share link — shared points only, no private fields. */
export interface SharePayload {
  v: 2
  title: string
  withWhom: string
  date: string
  time: string
  location: string
  objective: string
  sharedNotes: string
  points: Array<{
    title: string
    details: string
  }>
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function newPoint(title = ''): AgendaPoint {
  return { id: newId(), title, details: '', visibility: 'shared', done: false }
}

export function emptyMeeting(): Meeting {
  const iso = new Date().toISOString().slice(0, 10)
  return {
    id: newId(),
    title: '',
    withWhom: '',
    date: iso,
    time: '10:00',
    location: '',
    objective: '',
    sharedNotes: '',
    points: [],
    actionItems: [],
    followUpNotes: '',
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

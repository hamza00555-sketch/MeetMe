export type AgendaType = 'discussion' | 'decision' | 'update' | 'brainstorm' | 'review'

export type Visibility = 'private' | 'shared'

export type PointOutcome = 'pending' | 'decided' | 'postponed' | 'task' | 'dropped'

export interface AgendaPoint {
  id: string
  title: string
  type: AgendaType
  goal: string
  talkingPoints: string[]
  expectedOutcome: string
  timeEstimate: number // minutes
  visibility: Visibility
  privateNotes: string
  outcome: PointOutcome
  outcomeNote: string
}

export interface ActionItem {
  id: string
  title: string
  owner: string
  due: string // ISO date or ''
  done: boolean
  fromPointId?: string
}

export interface Decision {
  id: string
  text: string
  fromPointId?: string
}

export type MeetingStatus = 'draft' | 'ready' | 'closed'

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
  decisions: Decision[]
  actionItems: ActionItem[]
  followUpNotes: string
  status: MeetingStatus
  createdAt: number
  updatedAt: number
}

/** The payload embedded in a public share link — shared points only, no private fields. */
export interface SharePayload {
  v: 1
  title: string
  withWhom: string
  date: string
  time: string
  location: string
  objective: string
  sharedNotes: string
  points: Array<{
    title: string
    type: AgendaType
    goal: string
    talkingPoints: string[]
    expectedOutcome: string
    timeEstimate: number
  }>
}

export const AGENDA_TYPE_LABELS: Record<AgendaType, string> = {
  discussion: 'نقاش',
  decision: 'قرار',
  update: 'تحديث',
  brainstorm: 'عصف ذهني',
  review: 'مراجعة',
}

export const AGENDA_TYPE_COLORS: Record<AgendaType, string> = {
  discussion: 'var(--c-discussion)',
  decision: 'var(--c-decision)',
  update: 'var(--c-update)',
  brainstorm: 'var(--c-brainstorm)',
  review: 'var(--c-review)',
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function emptyPoint(): AgendaPoint {
  return {
    id: newId(),
    title: '',
    type: 'discussion',
    goal: '',
    talkingPoints: [],
    expectedOutcome: '',
    timeEstimate: 10,
    visibility: 'shared',
    privateNotes: '',
    outcome: 'pending',
    outcomeNote: '',
  }
}

export function emptyMeeting(): Meeting {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
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
    decisions: [],
    actionItems: [],
    followUpNotes: '',
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

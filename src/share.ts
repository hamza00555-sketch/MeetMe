import type { Meeting, SharePayload } from './types'

/**
 * Builds the public payload from a meeting. Only points whose visibility is
 * 'shared' are included, and only their public fields — private points never
 * enter the payload, so neither the link nor the invite message can leak them.
 */
export function buildSharePayload(m: Meeting): SharePayload {
  return {
    v: 2,
    title: m.title,
    withWhom: m.withWhom,
    date: m.date,
    time: m.time,
    location: m.location,
    objective: m.objective,
    sharedNotes: m.sharedNotes,
    points: m.points
      .filter((p) => p.visibility === 'shared')
      .map((p) => ({
        title: p.title,
        details: p.details,
      })),
  }
}

// base64url over UTF-8 — kept so old self-contained links keep opening.
function decodeB64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const parsed = JSON.parse(decodeB64Url(encoded))
    if (parsed && parsed.v === 2 && Array.isArray(parsed.points)) return parsed as SharePayload
    return null
  } catch {
    return null
  }
}

/**
 * Creates a short share link (…/s/ab12cd) by storing the public payload via
 * the share API. Returns null when the API is unreachable (e.g. local dev),
 * in which case callers fall back to longShareUrl.
 */
export async function createShortLink(m: Meeting): Promise<string | null> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildSharePayload(m)),
    })
    if (!res.ok) return null
    const { id } = await res.json()
    if (typeof id !== 'string' || !id) return null
    return `${location.origin}/s/${id}`
  } catch {
    return null
  }
}

export async function fetchSharePayload(id: string): Promise<SharePayload | null> {
  try {
    const res = await fetch(`/api/share?id=${encodeURIComponent(id)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data && data.v === 2 && Array.isArray(data.points)) return data as SharePayload
    return null
  } catch {
    return null
  }
}

/**
 * Creates the short link and hands the invite message to the native share
 * sheet (touch devices) or the clipboard. On iOS Safari the clipboard must be
 * written inside the original tap gesture, so we pass a *promise* into
 * ClipboardItem instead of awaiting the network first.
 * Resolves to how it was delivered; rejects if the link couldn't be created.
 */
export async function deliverInvite(m: Meeting, organizer: string): Promise<'shared' | 'copied'> {
  const textPromise = createShortLink(m).then((url) => {
    if (!url) throw new Error('short-link-failed')
    return buildInviteMessage(m, organizer, url)
  })

  if (typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ text: await textPromise })
      return 'shared'
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'shared' // user closed the sheet
      await textPromise // if the link itself failed, surface that error instead
      // share unsupported/failed with a valid link — fall through to clipboard
    }
  }

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/plain': textPromise.then((t) => new Blob([t], { type: 'text/plain' })) }),
    ])
  } else {
    await navigator.clipboard.writeText(await textPromise)
  }
  return 'copied'
}

/* ---- Organizer profile (local, personal app) ---- */

const ORGANIZER_KEY = 'meetme.profile.name'

export function getOrganizer(): string {
  try {
    return localStorage.getItem(ORGANIZER_KEY) || 'حمزة'
  } catch {
    return 'حمزة'
  }
}

export function setOrganizer(name: string) {
  try {
    localStorage.setItem(ORGANIZER_KEY, name)
  } catch {
    // storage unavailable — name just won't persist
  }
}

/* ---- Invite message ---- */

function fmtInviteDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(iso + 'T00:00:00'),
    )
  } catch {
    return iso
  }
}

/**
 * The friendly text the user actually sends: greeting, meeting header,
 * shared agenda titles, then the link. Built from the public payload only.
 */
export function buildInviteMessage(m: Meeting, organizer: string, url: string): string {
  const p = buildSharePayload(m)
  const lines: string[] = []

  lines.push(p.withWhom.trim() ? `مرحبًا ${p.withWhom.trim()} 👋` : 'مرحبًا 👋')
  lines.push(`دعوة لاجتماع «${p.title.trim() || 'بدون عنوان'}» مع ${organizer.trim() || 'حمزة'}`)

  const when = [`📅 ${fmtInviteDate(p.date)}`, `🕙 ${p.time}`]
  if (p.location.trim()) when.push(`📍 ${p.location.trim()}`)
  lines.push(when.join(' · '))

  if (p.objective.trim()) {
    lines.push('')
    lines.push(p.objective.trim())
  }

  const titled = p.points.filter((pt) => pt.title.trim())
  if (titled.length > 0) {
    lines.push('')
    lines.push('محاور الاجتماع:')
    titled.forEach((pt, i) => lines.push(`${i + 1}. ${pt.title.trim()}`))
  }

  lines.push('')
  lines.push('التفاصيل كاملة من هنا:')
  lines.push(url)

  return lines.join('\n')
}

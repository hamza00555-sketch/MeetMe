import type { Meeting, SharePayload } from './types'

/**
 * Builds the public payload from a meeting. Only points whose visibility is
 * 'shared' are included, and only their public fields — private notes and
 * private points never enter the payload, so the link cannot leak them.
 */
export function buildSharePayload(m: Meeting): SharePayload {
  return {
    v: 1,
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
        type: p.type,
        goal: p.goal,
        talkingPoints: p.talkingPoints.filter((t) => t.trim()),
        expectedOutcome: p.expectedOutcome,
        timeEstimate: p.timeEstimate,
      })),
  }
}

// base64url over UTF-8 so Arabic text survives the round-trip.
function encodeB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeB64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function shareUrl(m: Meeting): string {
  const payload = encodeB64Url(JSON.stringify(buildSharePayload(m)))
  return `${location.origin}${import.meta.env.BASE_URL}#/share/${payload}`
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const parsed = JSON.parse(decodeB64Url(encoded))
    if (parsed && parsed.v === 1 && Array.isArray(parsed.points)) return parsed as SharePayload
    return null
  } catch {
    return null
  }
}

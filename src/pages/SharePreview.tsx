import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../store'
import { buildSharePayload, buildInviteMessage, createShortLink, longShareUrl, getOrganizer } from '../share'
import SharedAgendaView from '../components/SharedAgendaView'
import { Page, TopBar, LinkIcon, CheckIcon, LockIcon } from '../components/ui'

export default function SharePreview() {
  const { id } = useParams()
  const { getMeeting } = useStore()
  const meeting = getMeeting(id!)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!meeting) {
    return (
      <Page>
        <TopBar title="الاجتماع غير موجود" back="/" />
      </Page>
    )
  }

  const payload = buildSharePayload(meeting)
  const hiddenCount = meeting.points.length - payload.points.length

  async function copyInvite() {
    if (busy) return
    setBusy(true)
    try {
      const short = await createShortLink(meeting!)
      const url = short ?? longShareUrl(meeting!)
      await navigator.clipboard.writeText(buildInviteMessage(meeting!, getOrganizer(), url))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page className="!max-w-none !px-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <TopBar
          title="معاينة ما سيراه الآخرون"
          back={`/meeting/${meeting.id}`}
          actions={
            <button onClick={copyInvite} className="btn btn-primary" disabled={busy}>
              {copied ? <CheckIcon /> : <LinkIcon />} {busy ? 'يجهّز الدعوة…' : copied ? 'تم النسخ!' : 'نسخ رسالة الدعوة'}
            </button>
          }
        />
        <p className="mb-2 flex flex-wrap items-center gap-2 text-sm text-mist-500">
          هذا بالضبط ما سيراه من يفتح الرابط.
          {hiddenCount > 0 && (
            <span className="chip text-amber-400">
              <LockIcon /> <span className="tnum">{hiddenCount}</span> بنود خاصة لن تظهر
            </span>
          )}
        </p>
      </div>

      {/* Framed live preview */}
      <div className="mx-auto mt-4 max-w-5xl px-2 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-950/60">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-rose-400/60" />
            <span className="size-2.5 rounded-full bg-amber-400/60" />
            <span className="size-2.5 rounded-full bg-mint-400/60" />
            <span className="ms-3 truncate text-xs text-mist-600" dir="ltr">
              {location.origin}/s/••••••
            </span>
          </div>
          <SharedAgendaView payload={payload} />
        </div>
      </div>
    </Page>
  )
}

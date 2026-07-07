import { put, head } from '@vercel/blob'
import { randomBytes } from 'node:crypto'

const MAX_BODY = 64 * 1024 // a share payload is a few KB; reject anything absurd

function newShareId(): string {
  return randomBytes(6).toString('base64url').replace(/[-_]/g, 'x').slice(0, 7).toLowerCase()
}

function isValidPayload(p: unknown): boolean {
  if (!p || typeof p !== 'object') return false
  const o = p as Record<string, unknown>
  return o.v === 2 && Array.isArray(o.points) && o.points.length <= 100
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'POST') {
      const body = req.body
      if (JSON.stringify(body ?? '').length > MAX_BODY || !isValidPayload(body)) {
        res.status(400).json({ error: 'invalid payload' })
        return
      }
      // retry on the (unlikely) id collision — put refuses to overwrite
      for (let attempt = 0; attempt < 3; attempt++) {
        const id = newShareId()
        try {
          await put(`shares/${id}.json`, JSON.stringify(body), {
            access: 'public',
            addRandomSuffix: false,
            allowOverwrite: false,
            contentType: 'application/json',
          })
          res.status(200).json({ id })
          return
        } catch (e: any) {
          if (attempt === 2) throw e
        }
      }
      return
    }

    if (req.method === 'GET') {
      const id = String(req.query?.id ?? '')
      if (!/^[a-z0-9]{5,12}$/.test(id)) {
        res.status(400).json({ error: 'bad id' })
        return
      }
      const blob = await head(`shares/${id}.json`).catch(() => null)
      if (!blob) {
        res.status(404).json({ error: 'not found' })
        return
      }
      const data = await fetch(blob.url).then((r) => r.json())
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400')
      res.status(200).json(data)
      return
    }

    res.status(405).json({ error: 'method not allowed' })
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? 'server error' })
  }
}

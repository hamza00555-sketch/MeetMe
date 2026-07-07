import type { Meeting, AgendaPoint } from './types'

export interface ReadinessDetail {
  score: number // 0..100
  hints: string[]
}

function pointScore(p: AgendaPoint): number {
  let s = 0
  if (p.title.trim()) s += 30
  if (p.goal.trim()) s += 25
  if (p.talkingPoints.filter((t) => t.trim()).length > 0) s += 25
  if (p.expectedOutcome.trim()) s += 15
  if (p.timeEstimate > 0) s += 5
  return s
}

/**
 * Readiness = 30% meeting basics (title, person, objective)
 *           + 70% average agenda-point completeness.
 * A meeting with no agenda points can never exceed the basics share.
 */
export function readiness(m: Meeting): ReadinessDetail {
  const hints: string[] = []

  let basics = 0
  if (m.title.trim()) basics += 12
  else hints.push('أضِف عنوانًا للاجتماع')
  if (m.withWhom.trim()) basics += 8
  else hints.push('حدّد مع من الاجتماع')
  if (m.objective.trim()) basics += 10
  else hints.push('اكتب الهدف الرئيسي للاجتماع')

  const pts = m.points
  let agenda = 0
  if (pts.length === 0) {
    hints.push('أضِف أول نقطة إلى جدول الأعمال')
  } else {
    const avg = pts.reduce((acc, p) => acc + pointScore(p), 0) / pts.length
    agenda = Math.round((avg / 100) * 70)
    if (pts.some((p) => !p.goal.trim())) hints.push('بعض النقاط بلا هدف واضح')
    if (pts.some((p) => p.talkingPoints.filter((t) => t.trim()).length === 0))
      hints.push('أضِف نقاط حديث لكل بند')
    if (pts.some((p) => !p.expectedOutcome.trim())) hints.push('حدّد النتيجة المتوقعة لكل بند')
    if (!pts.some((p) => p.visibility === 'shared'))
      hints.push('لا توجد بنود مشتركة — رابط المشاركة سيكون فارغًا')
  }

  return { score: Math.min(100, basics + agenda), hints: hints.slice(0, 3) }
}

export function readinessLabel(score: number): string {
  if (score >= 85) return 'جاهز تمامًا'
  if (score >= 60) return 'شبه جاهز'
  if (score >= 30) return 'يحتاج عملًا'
  return 'في البداية'
}

export function totalMinutes(m: Meeting): number {
  return m.points.reduce((acc, p) => acc + (p.timeEstimate || 0), 0)
}

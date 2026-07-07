# جاهز — MeetMe

تطبيق ويب عصري لتحضير الاجتماعات: أجندة واضحة، نقاط حديث، ملاحظات خاصة ومشتركة، رابط مشاركة أنيق، ووضع عرض أثناء الاجتماع.

A premium, Arabic-first (RTL) meeting-preparation web app.

## Features (MVP)

- **Dashboard** — today's & upcoming meetings, readiness score, quick actions.
- **Meeting Builder** — bento-style agenda cards with drag-and-drop ordering; each point has a title, type, goal, talking points, expected outcome, time estimate, and private/shared visibility. Changes auto-save to localStorage.
- **Share Preview** — see exactly what the other party will see before sharing.
- **Public Shared Agenda** — a cinematic, GSAP-animated agenda page. The share link *encodes only shared points into the URL itself*, so private notes can never leak — no backend required.
- **Presentation Mode** — full-screen deck with keyboard navigation, elapsed timer vs. time budget, and your private notes visible only to you.
- **Close Meeting** — mark each point's outcome, record decisions, convert points into action items, add follow-up notes.

## Design

- Premium dark interface, bento cards, IBM Plex Sans Arabic typography.
- Motion for React for UI animation; GSAP (+ScrollTrigger) for the cinematic shared page.
- Native RTL via logical CSS properties; `prefers-reduced-motion` respected everywhere.
- Mobile-first responsive layout.

## Run

```bash
npm install
npm run dev     # develop
npm run build   # type-check + production build
npm run preview # serve the build
```

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Motion for React · GSAP · React Router (hash routing so share links work on any static host).

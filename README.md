# لقاء (Liqa)

تطبيق ويب بسيط وأنيق لتحضير الاجتماعات: تكتب بنود اجتماعك كسطور سريعة، تحدد الخاص والمشترك منها، وترسل رابطًا أنيقًا يعرضها كقائمة متحركة للطرف الآخر.

A simple, premium, Arabic-first (RTL) meeting-preparation web app.

## Features

- **Dashboard** — today's & upcoming meetings, quick actions.
- **Meeting Builder** — todo-style quick add (type + Enter), drag-and-drop ordering; each point is just a title + optional details + a private/shared toggle. Changes auto-save to localStorage.
- **Share Preview** — see exactly what the other party will see before sharing.
- **Public Shared Agenda** — a premium animated *list*: SplitText word-by-word title reveal, a progress line drawn alongside the list as you scroll, per-item reveals, Lenis smooth scrolling. The share link *encodes only shared points into the URL itself*, so private points can never leak — no backend required.
- **After the meeting** — check off covered points, add follow-up tasks, and a closing note.

## Design

- Premium dark interface, bento cards, IBM Plex Sans Arabic typography.
- Motion for React for UI animation; GSAP (ScrollTrigger + SplitText) for the cinematic shared page.
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

Vite · React 19 · TypeScript · Tailwind CSS v4 · Motion for React · GSAP 3.13+ · Lenis · React Router (hash routing so share links work on any static host).

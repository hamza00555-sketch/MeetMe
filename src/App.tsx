import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Dashboard from './pages/Dashboard'
import MeetingBuilder from './pages/MeetingBuilder'
import SharePreview from './pages/SharePreview'
import PublicAgenda from './pages/PublicAgenda'
import CloseMeeting from './pages/CloseMeeting'

export default function App() {
  const location = useLocation()
  return (
    <>
      <div className="app-bg" aria-hidden />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/meeting/:id" element={<MeetingBuilder />} />
          <Route path="/meeting/:id/preview" element={<SharePreview />} />
          <Route path="/meeting/:id/close" element={<CloseMeeting />} />
          <Route path="/s/:id" element={<PublicAgenda />} />
          <Route path="/share/:payload" element={<PublicAgenda />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

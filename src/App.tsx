import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { Landing } from './pages/Landing'
import { Onboarding } from './pages/Onboarding'
import { Discover } from './pages/Discover'
import { MeetupDetail } from './pages/MeetupDetail'
import { Dashboard } from './pages/Dashboard'
import { Stores } from './pages/Stores'
import { HowItWorks } from './pages/HowItWorks'
import { useApp } from './context/AppContext'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function RequireProfile({ children }: { children: React.ReactNode }) {
  const { hasProfile } = useApp()
  if (!hasProfile) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/meetup/:id" element={<MeetupDetail />} />
          <Route
            path="/dashboard"
            element={
              <RequireProfile>
                <Dashboard />
              </RequireProfile>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

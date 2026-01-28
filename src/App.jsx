import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { authService } from './services/authService'
import './App.css'
import Landing from './pages/Landing'
import LandingV2 from './pages/LandingV2'
import VideoAnalysis from './pages/VideoAnalysis'
import History from './pages/History'
import Settings from './pages/Settings'


import FooterBar from './components/FooterBar'

function App() {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || ''
  })
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey)
    }
  }, [apiKey])

  useEffect(() => {
    // Get initial session
    authService.getSession().then((session) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = authService.onAuthStateChange((session) => {
      setSession(session)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Smashing through data...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing V2 - rendered outside main layout (no header/footer) */}
        <Route path="/landing-v2" element={<LandingV2 session={session} />} />

        {/* All other routes with standard layout */}
        <Route path="*" element={
          !session ? <Navigate to="/landing-v2" replace /> : (
            <div className="app">
              <header className="header">
                <div className="container">
                  <div className="header-content">
                    <NavLink to="/" className="logo-link">
                      <h1 className="logo">Smashers.ai</h1>
                    </NavLink>
                    <nav className="nav">
                      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
                        Analyse
                      </NavLink>
                      <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        History
                      </NavLink>
                      <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        Settings
                      </NavLink>
                      {session && (
                        <button
                          className="nav-link logout-btn"
                          onClick={() => authService.signOut()}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Logout
                        </button>
                      )}
                    </nav>
                  </div>
                </div>
              </header>

              <main className="main">
                <div className="container">
                  <Routes>
                    <Route path="/landing" element={<Landing session={session} />} />
                    <Route path="/" element={<VideoAnalysis apiKey={apiKey} session={session} />} />
                    <Route path="/history" element={<History apiKey={apiKey} session={session} />} />
                    <Route path="/settings" element={<Settings apiKey={apiKey} setApiKey={setApiKey} session={session} />} />
                  </Routes>
                </div>
              </main>
              <FooterBar />
            </div>
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App

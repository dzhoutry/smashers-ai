import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom'
import { authService } from './services/authService'
import { getUserProfile } from './services/userProfileService'
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
  const [profile, setProfile] = useState({
    avatarStyle: 'adventurer',
    avatarId: 'seed',
    avatarBackground: ['b6e3f4'],
    avatarBackgroundType: 'solid'
  })
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey)
    }
  }, [apiKey])

  useEffect(() => {
    // Get initial session
    authService.getSession().then((session) => {
      setSession(session)
      if (session) {
        getUserProfile().then(setProfile)
      }
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = authService.onAuthStateChange((session) => {
      setSession(session)
      if (session) {
        getUserProfile().then(setProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const avatarUrl = profile ? `https://api.dicebear.com/9.x/${profile.avatarStyle || 'adventurer'}/svg?seed=${profile.avatarId || 'seed'}&backgroundColor=${(profile.avatarBackground || ['b6e3f4']).join(',')}&backgroundType=${profile.avatarBackgroundType || 'solid'}` : '';

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
                      <a
                        href="https://forms.gle/ynDKUB2TXf7wX3ju8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link"
                      >
                        Feedback
                      </a>

                      {session && (
                        <div className="nav-profile-container" ref={dropdownRef}>
                          <button
                            className="nav-profile-btn"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            title="Profile & Settings"
                          >
                            <img src={avatarUrl} alt="Profile" className="nav-avatar" />
                          </button>

                          {isDropdownOpen && (
                            <div className="profile-dropdown">
                              <div className="dropdown-header">
                                <span className="dropdown-player-name">{profile.displayName || 'Athlete'}</span>
                              </div>
                              <div className="dropdown-divider"></div>
                              <Link
                                to="/settings"
                                className="dropdown-item"
                                onClick={() => setIsDropdownOpen(false)}
                              >
                                <span className="material-symbols-outlined">settings</span>
                                Settings
                              </Link>
                              <button
                                className="dropdown-item logout-item"
                                onClick={() => {
                                  authService.signOut()
                                  setIsDropdownOpen(false)
                                }}
                              >
                                <span className="material-symbols-outlined">logout</span>
                                Logout
                              </button>
                            </div>
                          )}
                        </div>
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

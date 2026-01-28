import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
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

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey)
    }
  }, [apiKey])

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing V2 - rendered outside main layout (no header/footer) */}
        <Route path="/landing-v2" element={<LandingV2 />} />

        {/* All other routes with standard layout */}
        <Route path="*" element={
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
                  </nav>
                </div>
              </div>
            </header>

            <main className="main">
              <div className="container">
                <Routes>
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/" element={<VideoAnalysis apiKey={apiKey} />} />
                  <Route path="/history" element={<History apiKey={apiKey} />} />
                  <Route path="/settings" element={<Settings apiKey={apiKey} setApiKey={setApiKey} />} />
                </Routes>
              </div>
            </main>
            <FooterBar />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App

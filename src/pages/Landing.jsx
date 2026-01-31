import { useState } from 'react'
import './Landing.css'
import AuthModal from '../components/AuthModal'

function Landing() {
    // For the overlay modal (Login button in header)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [activeTab, setActiveTab] = useState('signup')

    const handleLoginClick = () => {
        setActiveTab('login')
        setShowAuthModal(true)
    }

    return (
        <div className="landing-page">
            {/* Black Sidebar */}
            <div className="landing-sidebar">
                <div className="sidebar-logo">
                    <div className="logo-main">SMASHERS</div>
                    <div className="logo-suffix">.AI</div>
                </div>
                <div className="system-status">
                    <span className="status-dot"></span>
                    <span className="status-text">SYSTEM_READY /// V.1.0 ALPHA</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="landing-main">
                {/* Header with Login Button */}
                <header className="landing-header">
                    <nav className="landing-nav">
                        <a href="#" className="landing-nav-link">HOW IT WORKS</a>
                        <a href="#" className="landing-nav-link">PRICING</a>
                        <button className="landing-login-btn" onClick={handleLoginClick}>
                            LOGIN
                        </button>
                    </nav>
                </header>

                {/* Hero Section */}
                <div className="landing-hero">
                    <div className="hero-content">
                        <div className="hero-badge">SMASHERS.AI</div>

                        <h1 className="hero-title">
                            <span className="title-line">RECORD.</span>
                            <span className="title-line">ANALYSE.</span>
                            <span className="title-line title-accent">EVOLVE.</span>
                        </h1>

                        {/* Inline Auth Modal */}
                        <div className="hero-auth-container">
                            <div className="auth-label-group">
                                <span className="auth-indicator">|</span>
                                <span className="auth-text">ENTER DETAILS TO START</span>
                            </div>
                            <AuthModal mode="signup" inline={true} />
                        </div>

                        <div className="hero-footer">
                            <div className="footer-item">
                                <span className="checkmark">✓</span>
                                <span className="footer-text">NO SIGNUP REQUIRED</span>
                            </div>
                            <div className="footer-item">
                                <span className="sparkle">✦</span>
                                <span className="footer-text">POWERED BY GEMINI</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="landing-footer">
                    <p>© 2024 SMASHERS.AI</p>
                    <div className="footer-dots">
                        <span className="dot green"></span>
                        <span className="dot black"></span>
                        <span className="dot white"></span>
                    </div>
                </footer>
            </div>

            {/* Modal for explicit Login click (overlay mode) */}
            {activeTab === 'login' && showAuthModal && (
                <AuthModal
                    mode="login"
                    onClose={() => setShowAuthModal(false)}
                />
            )}
        </div>
    )
}

export default Landing

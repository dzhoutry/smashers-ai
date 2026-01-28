import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingV2.css'
import AuthModal from '../components/AuthModal'

function LandingV2({ session }) {
    const navigate = useNavigate()

    useEffect(() => {
        if (session) {
            navigate('/')
        }
    }, [session, navigate])

    return (
        <div className="landing-v2">
            {/* Left Sidebar */}
            <div className="landing-v2-sidebar">
                <div className="sidebar-pattern"></div>
                <div className="sidebar-logo-container">
                    <span className="sidebar-logo-main">SMASHERS</span>
                </div>
                <div className="sidebar-status">
                    SYSTEM_READY /// V.2.0
                </div>
            </div>

            {/* Right Content */}
            <div className="landing-v2-content">
                {/* Hero Section */}
                <div className="landing-v2-hero">
                    <div className="hero-container">
                        <div className="hero-badge">Smashers.AI</div>

                        <h2 className="hero-headline">
                            Record.<br />
                            Analyse.<br />
                            <span className="hero-accent">Evolve.</span>
                        </h2>

                        {/* Auth Section */}
                        <div className="auth-section">
                            <AuthModal mode="signup" inline={true} />

                            <div className="hero-badges">
                                <span className="badge-item">
                                    <span className="badge-icon">✓</span> Beta Access
                                </span>
                                <span className="badge-item">
                                    <span className="badge-icon">⚡</span> Powered by Gemini
                                </span>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    )
}

export default LandingV2

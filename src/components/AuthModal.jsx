import { useState } from 'react'
import './AuthModal.css'

function AuthModal({ mode, onClose, inline = false }) {
    const [activeTab, setActiveTab] = useState(mode) // 'signup' or 'login'
    const [email, setEmail] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleTabChange = (tab) => {
        setActiveTab(tab)
        setShowPassword(false)
    }

    const modalContent = (
        <div className={`auth-modal-content ${inline ? 'inline' : ''}`} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="auth-modal-header">
                <h2 className="auth-modal-title">
                    {activeTab === 'signup' ? 'SIGN UP' : 'LOGIN'}
                </h2>
                {!inline && (
                    <button className="auth-modal-close" onClick={onClose}>
                        ✕
                    </button>
                )}
            </div>

            {/* Tab Switcher */}
            <div className="auth-tabs">
                <button
                    className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                    onClick={() => handleTabChange('signup')}
                >
                    Sign Up
                </button>
                <button
                    className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                    onClick={() => handleTabChange('login')}
                >
                    Login
                </button>
            </div>

            {/* Body */}
            <div className="auth-modal-body">


                {/* Email Input */}
                <div className="auth-form-group">
                    <label className="auth-label">EMAIL</label>
                    <div className="auth-input-wrapper">
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (e.target.value === '') setShowPassword(false)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && email.length > 0) {
                                    setShowPassword(true)
                                }
                            }}
                        />
                        {!showPassword && email.length > 0 && (
                            <button className="auth-next-inline" onClick={() => setShowPassword(true)}>
                                →
                            </button>
                        )}
                    </div>
                </div>

                {showPassword && (
                    <>
                        <div className="auth-form-group">
                            <label className="auth-label">PASSWORD</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type="password"
                                    className="auth-input"
                                    placeholder="••••••••"
                                    disabled
                                />
                                <button className="auth-next-inline" disabled>
                                    →
                                </button>
                            </div>
                        </div>

                        {activeTab === 'login' && (
                            <div className="auth-footer-link">
                                <a href="#">Forgot password?</a>
                            </div>
                        )}
                    </>
                )}

                {/* Divider */}
                <div className="auth-divider">
                    <span>OR</span>
                </div>

                {/* Google Auth Button */}
                <button className="auth-google-btn" disabled>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4" />
                        <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853" />
                        <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05" />
                        <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335" />
                    </svg>
                    CONTINUE WITH GOOGLE
                </button>
            </div>
        </div>
    );

    if (inline) {
        return modalContent;
    }

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            {modalContent}
        </div>
    )
}

export default AuthModal

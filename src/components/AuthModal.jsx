import { useState } from 'react'
import { authService } from '../services/authService'
import './AuthModal.css'

function AuthModal({ mode, onClose, inline = false }) {
    const [activeTab, setActiveTab] = useState(mode) // 'signup' or 'login'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleTabChange = (tab) => {
        setActiveTab(tab)
        setShowPassword(false)
        setError(null)
        setIsSuccess(false)
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        setError(null)
        setIsSuccess(false)

        try {
            if (activeTab === 'signup') {
                await authService.signUp(email, password)
                setIsSuccess(true)
            } else if (activeTab === 'forgot') {
                await authService.resetPassword(email)
                setIsSuccess(true)
            } else {
                await authService.signIn(email, password)
                if (onClose) onClose()
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        setLoading(true)
        setError(null)
        try {
            await authService.signInWithGoogle()
            if (onClose) onClose()
            // Redirect happens automatically
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    const modalContent = (
        <div className={`auth-modal-content ${inline ? 'inline' : ''}`} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="auth-modal-header">
                <h2 className="auth-modal-title">
                    {activeTab === 'signup' ? 'SIGN UP' : activeTab === 'forgot' ? 'RESET PASSWORD' : 'LOGIN'}
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
                    className={`auth-tab ${activeTab === 'login' || activeTab === 'forgot' ? 'active' : ''}`}
                    onClick={() => handleTabChange('login')}
                >
                    Login
                </button>
            </div>

            {/* Body */}
            <div className="auth-modal-body">
                {activeTab === 'forgot' && !isSuccess && (
                    <p className="auth-mode-description">
                        Enter your email to receive password reset link.
                    </p>
                )}

                {isSuccess ? (
                    <div className="auth-success-state">
                        <div className="success-icon">{activeTab === 'forgot' ? '📩' : '✉️'}</div>
                        <h3 className="success-title">{activeTab === 'forgot' ? 'RESET LINK SENT' : 'CHECK YOUR INBOX'}</h3>
                        <p className="success-message">
                            {activeTab === 'forgot'
                                ? <>We've sent a password reset link to <strong>{email}</strong>.</>
                                : <>We've sent a verification link to <strong>{email}</strong>. Please confirm your email to activate your account.</>
                            }
                        </p>
                        <button className="auth-submit-btn" onClick={() => {
                            setIsSuccess(false)
                            if (activeTab === 'forgot') handleTabChange('login')
                        }}>
                            BACK TO LOGIN
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {error && <div className="auth-error-message">{error}</div>}

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
                                            e.preventDefault()
                                            if (activeTab === 'forgot') {
                                                handleSubmit()
                                            } else {
                                                setShowPassword(true)
                                            }
                                        }
                                    }}
                                    required
                                />
                                {(activeTab === 'forgot' || !showPassword) && email.length > 0 && (
                                    <button
                                        type="button"
                                        className="auth-next-inline"
                                        onClick={() => {
                                            if (activeTab === 'forgot') {
                                                handleSubmit()
                                            } else {
                                                setShowPassword(true)
                                            }
                                        }}
                                        disabled={loading}
                                    >
                                        {loading ? '...' : '→'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {showPassword && activeTab !== 'forgot' && (
                            <>
                                <div className="auth-form-group">
                                    <label className="auth-label">PASSWORD</label>
                                    <div className="auth-input-wrapper">
                                        <input
                                            type="password"
                                            className="auth-input"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoFocus
                                            required
                                        />
                                        <button type="submit" className="auth-next-inline" disabled={loading}>
                                            {loading ? '...' : '→'}
                                        </button>
                                    </div>
                                </div>

                                {activeTab === 'login' && (
                                    <div className="auth-footer-link">
                                        <button
                                            type="button"
                                            className="link-btn"
                                            onClick={() => handleTabChange('forgot')}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'forgot' && (
                            <div className="auth-footer-link">
                                <button
                                    type="button"
                                    className="link-btn"
                                    onClick={() => handleTabChange('login')}
                                >
                                    Back to login
                                </button>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="auth-divider">
                            <span>OR</span>
                        </div>

                        {/* Google Auth Button */}
                        <button
                            type="button"
                            className="auth-google-btn"
                            onClick={handleGoogleAuth}
                            disabled={loading}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4" />
                                <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853" />
                                <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05" />
                                <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335" />
                            </svg>
                            CONTINUE WITH GOOGLE
                        </button>
                    </form>
                )}
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

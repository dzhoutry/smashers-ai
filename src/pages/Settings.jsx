import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { testApiKey } from '../services/geminiService';
import { getUserProfile, updateUserProfile, calculatePlayerStats } from '../services/userProfileService';
import { exportHistory, clearHistory } from '../services/storageService';
import AvatarPickerModal from '../components/AvatarPickerModal';
import './Settings.css';

function Settings({ apiKey, setApiKey, session }) {
    const [activeTab, setActiveTab] = useState('account');
    const [profile, setProfile] = useState({
        displayName: 'Guest Player',
        email: '',
        bio: '',
        preferences: { darkMode: false, publicProfile: false },
        plan: { tier: 'ALPHA SMASHER' }
    });
    const [playerStats, setPlayerStats] = useState({ rank: 'ROOKIE', level: 1 });
    const [pendingProfile, setPendingProfile] = useState(null);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    // API Key State
    const [apiInputValue, setApiInputValue] = useState(apiKey);
    const [testStatus, setTestStatus] = useState(null);
    const [apiSaved, setApiSaved] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    // Security State
    const [newPassword, setNewPassword] = useState('');
    const [securityStatus, setSecurityStatus] = useState(null); // { type: 'success' | 'error', message: '' }
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isGoogleUser = session?.user?.app_metadata?.provider === 'google';
    const currentAuthEmail = session?.user?.email || '';

    useEffect(() => {
        setApiInputValue(apiKey);
    }, [apiKey]);

    useEffect(() => {
        getUserProfile().then(p => {
            setProfile(p);
            setPendingProfile(p);
        });
        calculatePlayerStats().then(setPlayerStats);
    }, []);

    const handleProfileUpdate = (field, value) => {
        // Handle nested updates for preferences
        if (field.startsWith('preferences.')) {
            const prefKey = field.split('.')[1];
            setPendingProfile(prev => ({
                ...prev,
                preferences: { ...prev.preferences, [prefKey]: value }
            }));
        } else {
            setPendingProfile(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSecurityStatus(null);
        try {
            const updated = await updateUserProfile(pendingProfile);
            setProfile(updated);
            setPendingProfile(updated);
            calculatePlayerStats().then(setPlayerStats);
            setSecurityStatus({ type: 'success', message: 'Profile updated successfully!' });
            setTimeout(() => setSecurityStatus(null), 3000);
        } catch (err) {
            setSecurityStatus({ type: 'error', message: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarSelect = async (data) => {
        const updated = await updateUserProfile(data);
        setProfile(updated);
        setPendingProfile(updated);
        setIsAvatarModalOpen(false);
    };

    const hasChanges = pendingProfile && (
        pendingProfile.displayName !== profile.displayName ||
        pendingProfile.bio !== profile.bio ||
        pendingProfile.email !== profile.email ||
        JSON.stringify(pendingProfile.preferences) !== JSON.stringify(profile.preferences)
    );

    const handleSaveApiKey = () => {
        setApiKey(apiInputValue);
        setApiSaved(true);
        setTestStatus(null);
        setTimeout(() => setApiSaved(false), 2000);
    };

    const handleTestApiKey = async () => {
        if (!apiInputValue) {
            setTestStatus('invalid');
            return;
        }
        setTestStatus('testing');
        const isValid = await testApiKey(apiInputValue);
        setTestStatus(isValid ? 'valid' : 'invalid');
    };

    const handleClearApiKey = () => {
        setApiInputValue('');
        setApiKey('');
        setTestStatus(null);
        localStorage.removeItem('gemini_api_key');
    };

    const handleExportHistory = async () => {
        const data = await exportHistory();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smashers-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClearHistory = async () => {
        if (window.confirm('Are you sure you want to delete all analysis history? This cannot be undone.')) {
            await clearHistory();
            alert('History cleared.');
        }
    };

    const handleUpdateEmail = async () => {
        if (pendingProfile.email === currentAuthEmail) return;

        setIsLoading(true);
        setSecurityStatus(null);
        try {
            await authService.updateUserEmail(pendingProfile.email);
            setSecurityStatus({
                type: 'success',
                message: 'Confirmation link sent to your new email!'
            });
        } catch (err) {
            setSecurityStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) {
            setSecurityStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
            return;
        }

        setIsLoading(true);
        setSecurityStatus(null);
        try {
            await authService.updateUserPassword(newPassword);
            setSecurityStatus({ type: 'success', message: 'Password updated successfully!' });
            setNewPassword('');
        } catch (err) {
            setSecurityStatus({ type: 'error', message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (!pendingProfile) return <div className="settings-page">Loading...</div>;

    const avatarUrl = `https://api.dicebear.com/9.x/${pendingProfile.avatarStyle || 'adventurer'}/svg?seed=${pendingProfile.avatarId || 'seed'}&backgroundColor=${(pendingProfile.avatarBackground || ['b6e3f4']).join(',')}&backgroundType=${pendingProfile.avatarBackgroundType || 'solid'}`;

    return (
        <div className="settings-page">
            <AvatarPickerModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSelect={handleAvatarSelect}
                currentStyle={pendingProfile.avatarStyle}
                currentId={pendingProfile.avatarId}
                currentBackground={pendingProfile.avatarBackground}
                currentBackgroundType={pendingProfile.avatarBackgroundType}
            />
            <header className="page-header-container">
                <h1 className="page-title">Settings</h1>
            </header>

            <div className="settings-layout">
                {/* Tabs Navigation */}
                <nav className="settings-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        Account
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Security
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'integrations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('integrations')}
                    >
                        Integrations
                    </button>
                </nav>

                <div className="settings-grid">
                    {/* Left Column: Avatar & Plan (Always Visible) */}
                    <div className="settings-sidebar">
                        {/* Avatar Card */}
                        <div className="profile-card">
                            <div className="avatar-container group">
                                <div className="avatar-placeholder">
                                    <img src={avatarUrl} alt="User Avatar" className="avatar-display-img" />
                                </div>
                                <button className="update-avatar-btn" onClick={() => setIsAvatarModalOpen(true)} title="Update Avatar">
                                    <span className="material-symbols-outlined">edit</span>
                                </button>
                            </div>
                            <div className="profile-meta">
                                <h3 className="meta-label">Athlete Rank</h3>
                                <div className="rank-badge-container">
                                    <span className="rank-badge">{playerStats.rank}</span>
                                    <span className="rank-level">Level {playerStats.level}</span>
                                </div>
                            </div>
                        </div>

                        {/* Plan Card */}
                        <div className="plan-card">
                            <h3 className="meta-label">Plan Details</h3>
                            <p className="plan-name">{pendingProfile.plan.tier}</p>
                            <button className="manage-plan-btn">
                                Manage Subscription
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Tab Content */}
                    <div className="settings-content">
                        {activeTab === 'account' && (
                            <div className="account-view space-y-12">
                                <section className="settings-section">
                                    <h2 className="section-title">
                                        <span className="material-symbols-outlined icon-lg">person</span>
                                        Personal Information
                                    </h2>

                                    {securityStatus && (
                                        <div className={`alert alert-${securityStatus.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1.5rem' }}>
                                            {securityStatus.message}
                                        </div>
                                    )}

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>
                                                Player Name
                                                <div className="tooltip-trigger">
                                                    <span className="material-symbols-outlined help-icon">help</span>
                                                    <div className="tooltip-box">
                                                        If this name matches the "Player Name" in your analysis history, your rank and level will automatically sync here!
                                                    </div>
                                                </div>
                                            </label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={pendingProfile.displayName}
                                                onChange={(e) => handleProfileUpdate('displayName', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address {isGoogleUser && <span className="label-note">(Managed by Google)</span>}</label>
                                            <div className="input-with-button">
                                                <input
                                                    type="email"
                                                    className="input-field"
                                                    value={pendingProfile.email}
                                                    onChange={(e) => handleProfileUpdate('email', e.target.value)}
                                                    placeholder="Enter email..."
                                                    disabled={isGoogleUser || isLoading}
                                                />
                                                {!isGoogleUser && pendingProfile.email !== currentAuthEmail && (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={handleUpdateEmail}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? '...' : 'Update'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Athlete Bio</label>
                                            <textarea
                                                className="input-field textarea"
                                                rows="4"
                                                value={pendingProfile.bio}
                                                onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>
                                </section>

                                <div className="divider-dashed"></div>

                                <section className="settings-section">
                                    <h2 className="section-title">
                                        <span className="material-symbols-outlined icon-lg">settings_suggest</span>
                                        Preferences
                                    </h2>
                                    <div className="preferences-list">
                                        <div className="preference-item">
                                            <div>
                                                <h4 className="pref-title">Dark Mode</h4>
                                                <p className="pref-desc">Enable high-contrast dark aesthetic</p>
                                            </div>
                                            <button
                                                className={`toggle-switch ${pendingProfile.preferences.darkMode ? 'on' : 'off'}`}
                                                onClick={() => handleProfileUpdate('preferences.darkMode', !pendingProfile.preferences.darkMode)}
                                            >
                                                <div className="toggle-thumb"></div>
                                            </button>
                                        </div>
                                        <div className="preference-item">
                                            <div>
                                                <h4 className="pref-title">Public Profile</h4>
                                                <p className="pref-desc">Allow others to see your stats and highlights</p>
                                            </div>
                                            <button
                                                className={`toggle-switch ${pendingProfile.preferences.publicProfile ? 'on' : 'off'}`}
                                                onClick={() => handleProfileUpdate('preferences.publicProfile', !pendingProfile.preferences.publicProfile)}
                                            >
                                                <div className="toggle-thumb"></div>
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <div className="action-footer">
                                    {hasChanges ? (
                                        <div className="footer-actions fade-in">
                                            <button
                                                className="btn-save"
                                                onClick={handleSaveProfile}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                className="btn-discard"
                                                onClick={() => setPendingProfile(profile)}
                                                disabled={isSaving}
                                            >
                                                Discard Changes
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="btn-delete-account" onClick={handleClearHistory}>
                                            Delete Account
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="security-view space-y-12">
                                <section className="settings-section">
                                    <h2 className="section-title">
                                        <span className="material-symbols-outlined icon-lg">lock</span>
                                        Security Settings
                                    </h2>

                                    {securityStatus && (
                                        <div className={`alert alert-${securityStatus.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1.5rem' }}>
                                            {securityStatus.message}
                                        </div>
                                    )}

                                    {isGoogleUser ? (
                                        <p className="card-description">
                                            Your account is managed by Google. Password changes should be handled through your Google Account settings.
                                        </p>
                                    ) : (
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>New Password</label>
                                                <div className="input-with-button">
                                                    <input
                                                        type="password"
                                                        className="input-field"
                                                        placeholder="••••••••"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        disabled={isLoading}
                                                    />
                                                    {newPassword && (
                                                        <button
                                                            className="btn-save fade-in"
                                                            onClick={handleUpdatePassword}
                                                            disabled={isLoading}
                                                        >
                                                            {isLoading ? 'Updating...' : 'Update Password'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <div className="divider-dashed"></div>

                                <section className="settings-section">
                                    <h2 className="section-title">
                                        <span className="material-symbols-outlined icon-lg">history</span>
                                        Account Actions
                                    </h2>
                                    <div className="preferences-list">
                                        <div className="preference-item">
                                            <div>
                                                <h4 className="pref-title">Export History</h4>
                                                <p className="pref-desc">Download a copy of your analysis data</p>
                                            </div>
                                            <button className="btn btn-secondary" onClick={handleExportHistory}>
                                                Export JSON
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <div className="action-footer">
                                    <button className="btn-delete-account" onClick={handleClearHistory}>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'integrations' && (
                            <section className="settings-section">
                                <h2 className="section-title">API Configuration</h2>
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Gemini API Key</h3>
                                        <p className="card-description">
                                            Your API key is stored locally in your browser and never sent to any server except Google's Gemini API.
                                        </p>
                                    </div>

                                    <div className="api-key-field">
                                        <label htmlFor="api-key" className="label">API Key</label>
                                        <div className="input-row">
                                            <input
                                                id="api-key"
                                                type={showApiKey ? "text" : "password"}
                                                className="input"
                                                value={apiInputValue}
                                                onChange={(e) => setApiInputValue(e.target.value)}
                                                placeholder="Enter your Gemini API key"
                                            />
                                            <button
                                                className="toggle-visibility-btn"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                title={showApiKey ? "Hide API Key" : "Show API Key"}
                                            >
                                                <span className="material-symbols-outlined">
                                                    {showApiKey ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                        <p className="helper-text">
                                            Get your API key from{' '}
                                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                                                Google AI Studio
                                            </a>
                                        </p>
                                    </div>

                                    <div className="api-key-actions">
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSaveApiKey}
                                            disabled={apiInputValue === apiKey}
                                        >
                                            {apiSaved ? '✓ Saved' : 'Save Key'}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={handleTestApiKey}
                                            disabled={!apiInputValue || testStatus === 'testing'}
                                        >
                                            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                                        </button>
                                        {apiKey && (
                                            <button className="btn btn-secondary" onClick={handleClearApiKey}>
                                                Clear Key
                                            </button>
                                        )}
                                    </div>

                                    {testStatus === 'valid' && (
                                        <div className="test-result success">
                                            ✓ API key is valid and working
                                        </div>
                                    )}
                                    {testStatus === 'invalid' && (
                                        <div className="test-result error">
                                            ✗ API key is invalid or connection failed
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;

import { useState, useEffect } from 'react';
import { testApiKey } from '../services/geminiService';
import { getUserProfile, updateUserProfile } from '../services/userProfileService';
import { exportHistory, clearHistory } from '../services/storageService';
import AvatarPickerModal from '../components/AvatarPickerModal';
import './Settings.css';

function Settings({ apiKey, setApiKey }) {
    const [activeTab, setActiveTab] = useState('account');
    const [profile, setProfile] = useState({
        displayName: 'Guest Player',
        email: '',
        bio: '',
        preferences: { darkMode: false, publicProfile: false },
        plan: { tier: 'Free Tier' }
    });
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    // API Key State
    const [apiInputValue, setApiInputValue] = useState(apiKey);
    const [testStatus, setTestStatus] = useState(null);
    const [apiSaved, setApiSaved] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        setApiInputValue(apiKey);
    }, [apiKey]);

    useEffect(() => {
        getUserProfile().then(setProfile);
    }, []);

    const handleProfileUpdate = async (field, value) => {
        // Handle nested updates for preferences
        let updated;
        if (field.startsWith('preferences.')) {
            const prefKey = field.split('.')[1];
            updated = await updateUserProfile({
                preferences: { ...profile.preferences, [prefKey]: value }
            });
        } else {
            updated = await updateUserProfile({ [field]: value });
        }
        setProfile(updated);
    };

    const handleAvatarSelect = async (data) => {
        const updated = await updateUserProfile(data);
        setProfile(updated);
        setIsAvatarModalOpen(false);
    };

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

    const avatarUrl = `https://api.dicebear.com/9.x/${profile.avatarStyle || 'adventurer'}/svg?seed=${profile.avatarId || 'seed'}&backgroundColor=${(profile.avatarBackground || ['b6e3f4']).join(',')}&backgroundType=${profile.avatarBackgroundType || 'solid'}`;

    return (
        <div className="settings-page">
            <AvatarPickerModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSelect={handleAvatarSelect}
                currentStyle={profile.avatarStyle}
                currentId={profile.avatarId}
                currentBackground={profile.avatarBackground}
                currentBackgroundType={profile.avatarBackgroundType}
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
                                    {/* <span className="material-symbols-outlined emoji-avatar">🏸</span> */}
                                    <img src={avatarUrl} alt="User Avatar" className="avatar-display-img" />
                                </div>
                                <button className="update-avatar-btn" onClick={() => setIsAvatarModalOpen(true)} title="Update Avatar">
                                    <span className="material-symbols-outlined">edit</span>
                                </button>
                            </div>
                            <div className="profile-meta">
                                <h3 className="meta-label">Athlete Rank</h3>
                                <div className="rank-badge-container">
                                    <span className="rank-badge">PRO</span>
                                    <span className="rank-level">Level 42</span>
                                </div>
                            </div>
                        </div>

                        {/* Plan Card */}
                        <div className="plan-card">
                            <h3 className="meta-label">Plan Details</h3>
                            <p className="plan-name">{profile.plan.tier}</p>
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
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Display Name</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={profile.displayName}
                                                onChange={(e) => handleProfileUpdate('displayName', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                className="input-field"
                                                value={profile.email}
                                                onChange={(e) => handleProfileUpdate('email', e.target.value)}
                                                placeholder="Enter email..."
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Athlete Bio</label>
                                            <textarea
                                                className="input-field textarea"
                                                rows="4"
                                                value={profile.bio}
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
                                                className={`toggle-switch ${profile.preferences.darkMode ? 'on' : 'off'}`}
                                                onClick={() => handleProfileUpdate('preferences.darkMode', !profile.preferences.darkMode)}
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
                                                className={`toggle-switch ${profile.preferences.publicProfile ? 'on' : 'off'}`}
                                                onClick={() => handleProfileUpdate('preferences.publicProfile', !profile.preferences.publicProfile)}
                                            >
                                                <div className="toggle-thumb"></div>
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <div className="action-footer">
                                    <button className="btn-save">
                                        Save Changes
                                    </button>
                                    <button className="btn-discard">
                                        Cancel
                                    </button>
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

import { useState, useEffect } from 'react';
import { testApiKey } from '../services/geminiService';
import './Settings.css';

function Settings({ apiKey, setApiKey }) {
    const [inputValue, setInputValue] = useState(apiKey);
    const [testStatus, setTestStatus] = useState(null); // null, 'testing', 'valid', 'invalid'
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setApiKey(inputValue);
        setSaved(true);
        setTestStatus(null);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleTest = async () => {
        if (!inputValue) {
            setTestStatus('invalid');
            return;
        }

        setTestStatus('testing');
        const isValid = await testApiKey(inputValue);
        setTestStatus(isValid ? 'valid' : 'invalid');
    };

    const handleClear = () => {
        setInputValue('');
        setApiKey('');
        setTestStatus(null);
        localStorage.removeItem('gemini_api_key');
    };

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-description">
                    Configure your API key and preferences.
                </p>
            </div>

            <div className="settings-section">
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
                                type="password"
                                className="input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Enter your Gemini API key"
                            />
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
                            onClick={handleSave}
                            disabled={inputValue === apiKey}
                        >
                            {saved ? '✓ Saved' : 'Save Key'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleTest}
                            disabled={!inputValue || testStatus === 'testing'}
                        >
                            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </button>
                        {apiKey && (
                            <button className="btn btn-secondary" onClick={handleClear}>
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
            </div>

            <div className="settings-section">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">About</h3>
                    </div>
                    <div className="about-content">
                        <p>
                            <strong>Smashers.ai</strong> uses Google's Gemini AI to provide
                            detailed feedback on your badminton gameplay. Upload videos or paste
                            YouTube links to get analysis of your footwork, technique, shot selection,
                            and more.
                        </p>
                        <p className="about-note">
                            <strong>Token Usage:</strong> Video analysis uses approximately 258 tokens
                            per second of video at $0.075 per million tokens.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;

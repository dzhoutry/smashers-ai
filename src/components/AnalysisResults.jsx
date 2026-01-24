import { useState } from 'react';
import VideoInput from './VideoInput'; // Not used here? Ah, maybe wait. No, we need VideoPlayer.
import VideoPlayer from './VideoPlayer';
import KeyFrameExtractor from './KeyFrameExtractor';
import './AnalysisResults.css';

function AnalysisResults({ analysis, videoSource, onTimestampClick, modelId, onNewAnalysis }) {
    const [activeTab, setActiveTab] = useState('technical');

    if (!analysis) return null;

    const parseTimestamp = (ts) => {
        const parts = ts.replace(/[\[\]]/g, '').split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    const renderTextWithTimestamps = (text) => {
        if (!text) return null;
        const parts = text.split(/(\[\d{1,2}:\d{2}\])/g);
        return parts.map((part, i) => {
            if (/^\[\d{1,2}:\d{2}\]$/.test(part)) {
                return (
                    <button
                        key={i}
                        className="timestamp-btn"
                        onClick={() => onTimestampClick && onTimestampClick(parseTimestamp(part))}
                    >
                        {part}
                    </button>
                );
            }
            return part;
        });
    };

    const renderScore = (score) => {
        const colors = {
            high: 'var(--color-accent)',
            medium: 'var(--color-warning)',
            low: 'var(--color-error)'
        };
        const level = score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';

        return (
            <div className="score-display" style={{ '--score-color': colors[level] }}>
                <div className="score-segments">
                    {[...Array(10)].map((_, index) => (
                        <div
                            key={index}
                            className={`score-segment ${index < score ? 'filled' : 'empty'}`}
                        />
                    ))}
                </div>
                <span className="score-value">{score}/10</span>
            </div>
        );
    };

    const renderPillarContent = (pillarData) => {
        if (!pillarData) return <p className="no-data">No analysis data available for this section.</p>;

        // pillarData is now an object of sub-categories (e.g., { racketSkills: {}, footworkTechnique: {} })
        // We filter out any keys that aren't objects or don't have scores (in case of future schema changes)
        const subCategories = Object.entries(pillarData).filter(([_, val]) => val && typeof val === 'object' && val.hasOwnProperty('score'));

        if (subCategories.length === 0) {
            // Fallback for old data or empty response
            return <p className="no-data">Detailed sub-category analysis not available.</p>;
        }

        return (
            <div className="pillar-container">
                {subCategories.map(([key, data]) => (
                    <div key={key} className="sub-category-block">
                        <div className="sub-category-header">
                            <h3 className="sub-category-title">{formatTitle(key)}</h3>
                            {renderScore(data.score)}
                        </div>

                        <div className="pillar-grid">
                            {/* Observations */}
                            <div className="pillar-card observations">
                                <h4>Key Observations</h4>
                                <ul>
                                    {data.observations?.map((obs, i) => (
                                        <li key={i}>{renderTextWithTimestamps(obs)}</li>
                                    )) || <li>No observations recorded.</li>}
                                </ul>
                            </div>

                            {/* Successes */}
                            <div className="pillar-card successes">
                                <h4>Successes & Strengths</h4>
                                <ul>
                                    {data.successes?.map((item, i) => (
                                        <li key={i}>
                                            <span className="icon success">✓</span>
                                            {renderTextWithTimestamps(item)}
                                        </li>
                                    )) || <li>No strengths recorded.</li>}
                                </ul>
                            </div>

                            {/* Improvements */}
                            <div className="pillar-card improvements">
                                <h4>Areas for Improvement</h4>
                                <ul>
                                    {data.improvements?.map((item, i) => (
                                        <li key={i}>
                                            <span className="icon improvement">↑</span>
                                            {renderTextWithTimestamps(item)}
                                        </li>
                                    )) || <li>No improvements recorded.</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const formatTitle = (key) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    return (
        <div className="analysis-results">
            {/* Header with Title and New Analysis Button */}
            <div className="results-header-bar">
                <div className="header-left">
                    <h2 className="results-title">ANALYSIS RESULTS</h2>
                    <div className="video-meta">
                        Video ID: #{videoSource?.videoId || 'LOCAL'} • Duration: {videoSource?.file ? 'Local File' : 'YouTube'}
                    </div>
                </div>
                <div className="header-actions">
                    {onNewAnalysis && (
                        <button className="btn btn-new-analysis" onClick={onNewAnalysis}>
                            ← NEW ANALYSIS
                        </button>
                    )}
                </div>
            </div>
            {/* Summary Section - 3 Columns */}
            <div className="summary-section sticky-header">
                {/* Overall Score */}
                <div className="summary-card overall-score-card">
                    <div className="card-label">Overall Score</div>
                    <div className="score-display-large">
                        <span className="score-number">{analysis.overallScore}</span>
                        <span className="score-max">/10</span>
                    </div>
                </div>

                {/* Confidence Card */}
                {analysis.confidence && (
                    <div className="summary-card confidence-card">
                        <div className="card-label">AI Confidence</div>
                        <div className="confidence-display">
                            <span className={`confidence-text ${analysis.confidence.score.toLowerCase()}`}>
                                {analysis.confidence.score.toUpperCase()}
                            </span>
                            {/* Optional: Add visual indicator here if desired, but sticking to text for now as per mockup */}
                        </div>
                        <p className="confidence-details">
                            {analysis.confidence.reason}
                        </p>
                    </div>
                )}

                {/* Model Badge */}
                {modelId && (
                    <div className="summary-card model-badge-card">
                        <div className="card-header-row">
                            <span className="card-label">AI Model</span>
                            <span className={`model-tag ${modelId.includes('pro') ? 'pro' : 'flash'}`}>
                                {modelId.includes('pro') ? 'GEMINI 3 PRO' : 'GEMINI 2.0 FLASH'}
                            </span>
                        </div>
                        <p className="model-description">
                            {modelId.includes('pro')
                                ? 'High-precision analysis (10 FPS) with multi-modal reasoning engine enabled.'
                                : 'Standard analysis engine.'}
                        </p>
                        <div className="process-status">
                            <span className="status-dot"></span> PROCESSING COMPLETE
                        </div>
                    </div>
                )}
            </div>

            {/* Video Section - Prominent */}
            <div className="result-video-section">
                {videoSource && (
                    <div className="video-main-wrapper">
                        <VideoPlayer videoSource={videoSource} />
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'technical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('technical')}
                >
                    Technical Skills
                </button>
                <button
                    className={`tab ${activeTab === 'tactical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tactical')}
                >
                    Tactical Skills
                </button>
                <button
                    className={`tab ${activeTab === 'physicality' ? 'active' : ''}`}
                    onClick={() => setActiveTab('physicality')}
                >
                    Physicality
                </button>
            </div>

            <div className="tab-content">
                {/* Key Moments Gallery (Only for file uploads, shown on all tabs or just technical?) 
                    Let's keep it visible on all tabs if it's available, or maybe just put it above the tabs? 
                    For now, staying inside tab content but conditionally rendering based on active tab seems fine, 
                    OR we can just have it always at the top of tab content.
                    Let's render it only on the Technical tab for now as it was before, or maybe better on all?
                    The previous implementation had it inside the 'technical' condition.
                    Let's keep it specific to Technical for now to avoid clutter, or maybe move it out.
                    Actually, visual evidence is useful for all. But let's stick to the request.
                    I'll put it in Technical for now to match strict pillar separation, or maybe just render it conditionally.
                */}
                {activeTab === 'technical' && videoSource?.type === 'file' && videoSource.file && (
                    <KeyFrameExtractor
                        videoFile={videoSource.file}
                        analysis={analysis}
                        onTimestampClick={onTimestampClick}
                    />
                )}

                {activeTab === 'technical' && renderPillarContent(analysis.technicalSkills)}
                {activeTab === 'tactical' && renderPillarContent(analysis.tacticalSkills)}
                {activeTab === 'physicality' && renderPillarContent(analysis.physicality)}
            </div>

            {/* Progress Notes */}
            {analysis.progressNotes && (
                <div className="progress-notes">
                    <h4>Progress Notes</h4>
                    <p>{renderTextWithTimestamps(analysis.progressNotes)}</p>
                </div>
            )}
        </div>
    );
}

function formatTitle(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

export default AnalysisResults;

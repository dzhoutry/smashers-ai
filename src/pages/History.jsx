import { useState, useEffect } from 'react';
import { getAnalysisHistory, deleteAnalysis, clearHistory } from '../services/storageService';
import AnalysisResults from '../components/AnalysisResults';
import './History.css';

function History({ apiKey }) {
    const [analyses, setAnalyses] = useState([]);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const history = await getAnalysisHistory();
        setAnalyses(history);
    };

    const handleDelete = async (id) => {
        await deleteAnalysis(id);
        await loadHistory();
        if (selectedAnalysis?.id === id) {
            setSelectedAnalysis(null);
        }
    };

    const handleClear = async () => {
        await clearHistory();
        await loadHistory();
        setSelectedAnalysis(null);
        setShowClearConfirm(false);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="history-page">
            <div className="page-header">
                <div className="header-row">
                    <div>
                        <h1 className="page-title">Analysis History</h1>
                        <p className="page-description">
                            View and compare your past gameplay analyses.
                        </p>
                    </div>
                    {analyses.length > 0 && (
                        <div className="header-actions">
                            {showClearConfirm ? (
                                <div className="confirm-clear">
                                    <span>Clear all history?</span>
                                    <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-danger" onClick={handleClear}>
                                        Confirm
                                    </button>
                                </div>
                            ) : (
                                <button className="btn btn-secondary" onClick={() => setShowClearConfirm(true)}>
                                    Clear History
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {analyses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No analyses yet</h3>
                    <p>Start by analysing a video on the <a href="/">Analyse</a> page.</p>
                </div>
            ) : (
                <div className="history-layout">
                    <div className="history-list">
                        {analyses.map((analysis) => (
                            <div
                                key={analysis.id}
                                className={`history-card ${selectedAnalysis?.id === analysis.id ? 'selected' : ''}`}
                                onClick={() => setSelectedAnalysis(analysis)}
                            >
                                <div className="history-card-header">
                                    <span className="history-date">{formatDate(analysis.createdAt)}</span>
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(analysis.id);
                                        }}
                                        title="Delete analysis"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="history-card-body">
                                    <div className="player-name-title">
                                        {analysis.playerName || 'Unknown Player'}
                                    </div>
                                    <div className="video-source">
                                        {analysis.videoSource?.type === 'youtube' ? (
                                            <a
                                                href={`https://youtube.com/watch?v=${analysis.videoSource.videoId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="video-link"
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                                            >
                                                <div className="youtube-icon-mini">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </div>
                                                <span style={{ textDecoration: 'underline' }}>
                                                    {analysis.videoSource?.videoTitle || analysis.videoSource?.videoId}
                                                </span>
                                            </a>
                                        ) : (
                                            <>📁 {analysis.videoSource?.fileName || 'Local Video'}</>
                                        )}
                                    </div>
                                    <p className="player-desc">{analysis.playerDescription}</p>
                                    {analysis.analysis?.overallScore && (
                                        <div className="history-score-row">
                                            <div className="score-badge">
                                                Score: {analysis.analysis.overallScore}/10
                                            </div>
                                            {analysis.modelId && (
                                                <span className={`model-tag ${analysis.modelId.includes('pro') ? 'pro' : 'flash'}`}>
                                                    {analysis.modelId.includes('pro') ? 'PRO' : 'FLASH'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedAnalysis && (
                        <div className="history-detail">
                            <div className="detail-header">
                                <h3>{formatDate(selectedAnalysis.createdAt)}</h3>
                                <p className="detail-player">{selectedAnalysis.playerDescription}</p>
                            </div>
                            <AnalysisResults
                                analysis={selectedAnalysis.analysis}
                                modelId={selectedAnalysis.modelId}
                                playerName={selectedAnalysis.playerName}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default History;

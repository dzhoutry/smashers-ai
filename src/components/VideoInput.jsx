import { useState, useRef } from 'react';
import { validateVideoFile } from '../services/videoService';
import { validateYouTubeUrl } from '../utils/timeParser';
import './VideoInput.css';

import { Youtube, ArrowRight } from 'lucide-react';

function VideoInput({ onVideoSelect }) {
    const [activeTab, setActiveTab] = useState('upload');
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);

    const handleFileSelect = (file) => {
        const validation = validateVideoFile(file);

        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        setSelectedFile(file);
        setError(null);
        onVideoSelect({ type: 'file', file });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => {
        setDragActive(false);
    };

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleYouTubeSubmit = () => {
        const validation = validateYouTubeUrl(youtubeUrl);

        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        setError(null);
        onVideoSelect({ type: 'youtube', videoId: validation.videoId, url: youtubeUrl });
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setYoutubeUrl('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="video-input">
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('upload'); clearSelection(); }}
                >
                    Upload File
                </button>
                <button
                    className={`tab ${activeTab === 'youtube' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('youtube'); clearSelection(); }}
                >
                    YouTube URL
                </button>
            </div>

            {activeTab === 'upload' && (
                <div className="upload-section">
                    {selectedFile ? (
                        <div className="file-selected">
                            <div className="file-info">
                                <span className="file-icon">📁</span>
                                <div className="file-details">
                                    <span className="file-name">{selectedFile.name}</span>
                                    <span className="file-size">
                                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                                    </span>
                                </div>
                            </div>
                            <button className="btn btn-secondary" onClick={clearSelection}>
                                Change
                            </button>
                        </div>
                    ) : (
                        <div
                            className={`drop-zone ${dragActive ? 'active' : ''}`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="drop-zone-content">
                                <span className="drop-icon">📹</span>
                                <p className="drop-text">
                                    Drop your video here or <span className="browse-link">browse</span>
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm"
                                    onChange={handleInputChange}
                                    className="file-input"
                                />
                            </div>
                        </div>
                    )}
                    <div className="upload-tips">
                        <span className="tip">💡 720p+ recommended for best analysis</span>
                        <span className="tip">📁 Max file size: 2GB</span>
                    </div>
                </div>
            )}

            {activeTab === 'youtube' && (
                <div className="youtube-section">
                    <div className="youtube-header">
                        <div className="youtube-icon-box">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                        <h3 className="youtube-title">YouTube Link</h3>
                    </div>

                    <p className="helper-text-above">
                        PASTE URL HERE (PUBLIC VIDEO)
                    </p>

                    <div className="youtube-input-row">
                        <input
                            type="url"
                            className="input"
                            placeholder="https://youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleYouTubeSubmit()}
                        />
                    </div>

                    <button
                        className="btn analyse-btn"
                        onClick={handleYouTubeSubmit}
                        disabled={!youtubeUrl}
                    >
                        Analyse Video <ArrowRight size={24} />
                    </button>
                </div>
            )}

            {error && (
                <div className="input-error">{error}</div>
            )}
        </div>
    );
}

export default VideoInput;

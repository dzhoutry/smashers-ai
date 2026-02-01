import { useState, useCallback, useRef, useEffect } from 'react';
import VideoInput from '../components/VideoInput';
import VideoPlayer from '../components/VideoPlayer';
import VideoTrimmer from '../components/VideoTrimmer';
import PlayerDescription from '../components/PlayerDescription';
import AnalysisResults from '../components/AnalysisResults';
import StepProgressBar from '../components/StepProgressBar';
import { analyzeVideo, MODELS } from '../services/geminiService';
import { getVideoDuration } from '../services/videoService';
import { fetchYouTubeMetadata } from '../services/youtubeService';
import { getUserProfile } from '../services/userProfileService';
import { ArrowRight } from 'lucide-react';
import './VideoAnalysis.css';

function VideoAnalysis({ apiKey, session }) {
    // User profile/plan state
    const [profile, setProfile] = useState(null);
    // Video input state
    const [videoSource, setVideoSource] = useState(null); // { type: 'file' | 'youtube', ... }
    const [videoDuration, setVideoDuration] = useState(null);

    // Trimming state
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(null);

    // Player description
    const [playerDescription, setPlayerDescription] = useState('');
    const [playerName, setPlayerName] = useState('');

    // Playback state
    const videoPlayerRef = useRef(null);
    const playerContainerRef = useRef(null);

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [selectedModel, setSelectedModel] = useState(MODELS.FLASH_2_0);
    const [error, setError] = useState(null);

    // Fetch profile on mount to check plan
    useEffect(() => {
        if (session) {
            getUserProfile().then(setProfile);
        }
    }, [session]);

    const isAlphaUser = profile?.plan?.tier === 'ALPHA SMASHER';
    const hasAccess = apiKey || isAlphaUser;

    // Compute current step based on state
    const currentStep = !videoSource ? 1 : !analysisResult ? 2 : 3;

    // Handle video selection
    const handleVideoSelect = useCallback(async (source) => {
        setVideoSource(source);
        setAnalysisResult(null);
        setError(null);

        if (source.type === 'file' && source.file) {
            try {
                const duration = await getVideoDuration(source.file);
                setVideoDuration(duration);
                setEndTime(duration); // Default to full video length
            } catch (e) {
                console.error('Failed to get video duration:', e);
            }
        } else if (source.type === 'youtube') {
            try {
                if (!apiKey) {
                    setError('Please add your API key in Settings to load YouTube metadata.');
                    return;
                }
                const metadata = await fetchYouTubeMetadata(source.videoId, apiKey);
                setVideoDuration(metadata.duration);
                setEndTime(metadata.duration);
                // Store title for history
                setVideoSource(prev => ({ ...prev, title: metadata.title }));
            } catch (e) {
                console.error('Failed to get YouTube metadata:', e);
                setError('Failed to load YouTube video info. Make sure the video is public.');
            }
        }
    }, [apiKey]);

    // Handle deep linking
    const handleTimestampClick = (seconds) => {
        // Seek video
        if (videoPlayerRef.current) {
            videoPlayerRef.current.seekTo(seconds);
        }
        // Scroll to player
        if (playerContainerRef.current) {
            playerContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Handle going back to change video
    const handleChangeVideo = () => {
        setVideoSource(null);
        setVideoDuration(null);
        setStartTime(0);
        setEndTime(null);
        setAnalysisResult(null);
        setError(null);
    };

    // Handle analysis submission
    const handleAnalyze = async () => {
        if (!hasAccess) {
            setError('Please add your Gemini API key in Settings first.');
            return;
        }

        if (!videoSource) {
            setError('Please select a video first.');
            return;
        }

        if (!playerDescription.trim()) {
            setError('Please describe the player to analyse.');
        }


        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);

        try {
            let videoData;

            if (videoSource.type === 'file') {
                videoData = {
                    type: 'file',
                    file: videoSource.file
                };
            } else {
                // YouTube video
                videoData = {
                    type: 'youtube',
                    videoId: videoSource.videoId,
                    startTime,
                    endTime
                };
            }

            setAnalysisProgress(videoSource.type === 'file' ? 'Preparing upload...' : 'Fetching video info...');

            // Get previous analyses for context
            const previousAnalyses = await getAnalysisSummaries(3);

            const result = await analyzeVideo({
                apiKey,
                playerDescription,
                videoData,
                previousAnalyses,
                timeRange: { start: startTime, end: endTime },
                videoDuration,
                model: selectedModel,
                onStatusUpdate: (status) => setAnalysisProgress(status)
            });

            setAnalysisResult(result);

            // Save to history
            await saveAnalysis({
                videoSource: {
                    type: videoSource.type,
                    videoId: videoSource.videoId,
                    fileName: videoSource.file?.name,
                    videoTitle: videoSource.title
                },
                playerDescription,
                playerName,
                startTime,
                endTime,
                analysis: result,
                modelId: selectedModel
            });

        } catch (e) {
            console.error('Analysis failed:', e);
            setError(e.message || 'Analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
            setAnalysisProgress('');
        }
    };

    const canAnalyze = videoSource && playerDescription.trim() && !isAnalyzing && hasAccess;

    // Render config options panel (used in Step 2 and Step 3)
    const renderConfigOptions = (compact = false) => (
        <>
            <VideoTrimmer
                duration={videoDuration}
                startTime={startTime}
                endTime={endTime}
                onStartChange={setStartTime}
                onEndChange={setEndTime}
                videoType={videoSource.type}
            />

            <PlayerDescription
                value={playerDescription}
                onChange={setPlayerDescription}
                playerName={playerName}
                onPlayerNameChange={setPlayerName}
            />

            <div className="model-selector-section">
                <label className="input-label">Analysis Model</label>
                <div className="model-toggle">
                    <button
                        className={`model-toggle-btn ${selectedModel === MODELS.FLASH_2_0 ? 'active' : ''}`}
                        onClick={() => setSelectedModel(MODELS.FLASH_2_0)}
                        disabled={isAnalyzing}
                    >
                        <span className="model-name">2.0 Flash</span>
                        <span className="model-desc">Fast & Efficient</span>
                    </button>
                    <button
                        className={`model-toggle-btn ${selectedModel === MODELS.PRO_3 ? 'active' : ''}`}
                        onClick={() => setSelectedModel(MODELS.PRO_3)}
                        disabled={isAnalyzing}
                    >
                        <span className="model-name">3 Pro Preview</span>
                        <span className="model-desc">High Precision (10 FPS)</span>
                    </button>
                </div>
            </div>

            {isAnalyzing && (
                <div className="analysis-status-box">
                    <span className="analysis-status-text">{analysisProgress || 'Analysing...'}</span>
                    {analysisProgress.includes('%') && (
                        <div className="progress-mini-bar">
                            <div
                                className="progress-mini-fill"
                                style={{ width: analysisProgress.match(/(\d+)%/)?.[1] + '%' }}
                            />
                        </div>
                    )}
                </div>
            )}

            <button
                className="btn btn-primary btn-lg analyze-btn"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
            >
                {isAnalyzing ? (
                    <>
                        <span className="spinner"></span>
                        Analysing...
                    </>
                ) : (
                    <>
                        Analyse Video <ArrowRight size={24} />
                    </>
                )}
            </button>

            {error && (
                <div className="alert alert-error">{error}</div>
            )}
        </>
    );

    return (
        <div className="video-analysis-page">
            <div className="page-header">
                <h1 className="page-title">Analyse Your Game</h1>
                <p className="page-description">
                    Upload a video or paste a YouTube link to get AI-powered feedback on your badminton technique.
                </p>
            </div>

            {!hasAccess && (
                <div className="alert alert-warning">
                    <strong>API Key Required:</strong> Please add your Gemini API key in{' '}
                    <a href="/settings">Settings</a> to use the analysis feature.
                </div>
            )}

            {isAlphaUser && !apiKey && (
                <div className="alert alert-info">
                    <strong>✨ Alpha Smasher:</strong> You are using the shared Gemini API. No local API key required!
                </div>
            )}

            <StepProgressBar currentStep={currentStep} />

            {/* Step 1: Upload - Centered Hero */}
            {currentStep === 1 && (
                <div className="step-upload">
                    <VideoInput onVideoSelect={handleVideoSelect} />
                </div>
            )}

            {/* Step 2: Configure - 2 Column Layout */}
            {currentStep === 2 && (
                <div className="step-configure">
                    <div className="configure-video">
                        <div className="video-header">
                            <button
                                className="btn btn-secondary change-video-btn"
                                onClick={handleChangeVideo}
                            >
                                ← Change Video
                            </button>
                        </div>
                        <div className="player-wrapper" ref={playerContainerRef}>
                            <VideoPlayer ref={videoPlayerRef} videoSource={videoSource} />
                        </div>
                    </div>
                    <div className="configure-options">
                        {renderConfigOptions()}
                    </div>
                </div>
            )}

            {/* Step 3: Results - Full Width */}
            {currentStep === 3 && (
                <div className="step-results">
                    <div className="results-main">
                        <AnalysisResults
                            analysis={analysisResult}
                            videoSource={videoSource}
                            onTimestampClick={handleTimestampClick}
                            modelId={selectedModel}
                            onNewAnalysis={handleChangeVideo}
                            videoPlayerRef={videoPlayerRef}
                            playerContainerRef={playerContainerRef}
                            playerName={playerName}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default VideoAnalysis;

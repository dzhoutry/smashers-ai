import { useState, useEffect } from 'react';
import { parseTimeString, formatSeconds, validateTimeRange } from '../utils/timeParser';
import { formatTokenDisplay } from '../utils/tokenCalculator';
import './VideoTrimmer.css';

function VideoTrimmer({ duration, startTime, endTime, onStartChange, onEndChange, videoType }) {
    const [startInput, setStartInput] = useState(formatSeconds(startTime));
    const [endInput, setEndInput] = useState(formatSeconds(endTime || 0));
    const [error, setError] = useState(null);

    // Update inputs when props change
    useEffect(() => {
        setStartInput(formatSeconds(startTime));
    }, [startTime]);

    useEffect(() => {
        setEndInput(formatSeconds(endTime || 0));
    }, [endTime]);

    const handleStartChange = (value) => {
        setStartInput(value);
        const seconds = parseTimeString(value);

        if (seconds !== null) {
            const validation = validateTimeRange(seconds, endTime, duration);
            if (validation.valid || seconds < endTime) {
                onStartChange(seconds);
                setError(null);
            } else {
                setError(validation.error);
            }
        }
    };

    const handleEndChange = (value) => {
        setEndInput(value);
        const seconds = parseTimeString(value);

        if (seconds !== null) {
            const validation = validateTimeRange(startTime, seconds, duration);
            if (validation.valid) {
                onEndChange(seconds);
                setError(null);
            } else {
                setError(validation.error);
            }
        }
    };

    // Calculate segment duration and tokens
    const segmentDuration = (endTime || 0) - startTime;
    const tokenInfo = segmentDuration > 0 ? formatTokenDisplay(segmentDuration) : null;

    // Progress bar percentage
    const progressStart = duration ? (startTime / duration) * 100 : 0;
    const progressWidth = duration ? (segmentDuration / duration) * 100 : 100;

    return (
        <div className="video-trimmer card">
            <div className="card-header">
                <h4 className="card-title">Analysis Range</h4>
                <p className="card-description">
                    Select a specific segment to focus the analysis on (optional)
                </p>
            </div>

            <div className="time-inputs">
                <div className="time-field">
                    <label className="label">Start Time</label>
                    <input
                        type="text"
                        className="input time-input"
                        value={startInput}
                        onChange={(e) => handleStartChange(e.target.value)}
                        placeholder="0:00"
                    />
                </div>
                <div className="time-separator">to</div>
                <div className="time-field">
                    <label className="label">End Time</label>
                    <input
                        type="text"
                        className="input time-input"
                        value={endInput}
                        onChange={(e) => handleEndChange(e.target.value)}
                        placeholder="5:00"
                    />
                </div>
            </div>

            {duration && (
                <div className="progress-bar-container">
                    <div className="progress-bar">
                        <div
                            className="progress-segment"
                            style={{
                                left: `${progressStart}%`,
                                width: `${progressWidth}%`
                            }}
                        />
                    </div>
                    <div className="progress-labels">
                        <span>0:00</span>
                        <span>{formatSeconds(duration)}</span>
                    </div>
                </div>
            )}

            {tokenInfo && segmentDuration > 0 && (
                <div className="token-display">
                    <div className="token-info">
                        <span className="duration-badge">
                            {tokenInfo.duration} ({segmentDuration}s)
                        </span>
                        <span className="token-estimate">
                            {tokenInfo.summary}
                        </span>
                    </div>
                </div>
            )}

            {error && (
                <div className="trimmer-error">{error}</div>
            )}

            {videoType === 'youtube' && (
                <p className="helper-text youtube-note">
                    Note: YouTube trimming uses URL parameters. The AI will analyse the specified segment.
                </p>
            )}
        </div>
    );
}

export default VideoTrimmer;

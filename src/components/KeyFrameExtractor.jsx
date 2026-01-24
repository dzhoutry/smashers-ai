import { useState, useEffect, useRef } from 'react';
import { extractFrames } from '../utils/frameUtils';
import './KeyFrameExtractor.css';

function KeyFrameExtractor({ videoFile, analysis, onTimestampClick }) {
    const [frames, setFrames] = useState([]);
    const [loading, setLoading] = useState(false);
    const extractedRef = useRef(false);

    useEffect(() => {
        if (!videoFile || !analysis || extractedRef.current) return;

        const extract = async () => {
            setLoading(true);
            try {
                // Collect all timestamps from the analysis
                const allTimestamps = [];
                const regex = /\[(\d{1,2}:\d{2})\]/g;

                const scanText = (text) => {
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        allTimestamps.push(match[0]); // Keep brackets for consistency with frameUtils if needed, or strip there
                    }
                };

                // Scan through detailed technical analysis
                if (analysis.technicalAnalysis) {
                    Object.values(analysis.technicalAnalysis).forEach(section => {
                        section.observations?.forEach(scanText);
                        section.improvements?.forEach(scanText);
                    });
                }

                if (allTimestamps.length > 0) {
                    // Extract frames (frameUtils handles deduping)
                    const extracted = await extractFrames(videoFile, allTimestamps);
                    setFrames(extracted);
                }
            } catch (error) {
                console.error("Frame extraction failed:", error);
            } finally {
                setLoading(false);
                extractedRef.current = true;
            }
        };

        extract();
    }, [videoFile, analysis]);

    if (frames.length === 0 && !loading) return null;

    return (
        <div className="key-frames-container">
            <h3 className="key-frames-title">KEY MOMENTS</h3>

            {loading ? (
                <div className="key-frames-loading">
                    <div className="loading-spinner"></div>
                    <span>Extracting key frames...</span>
                </div>
            ) : (
                <div className="key-frames-gallery">
                    {frames.map((frame, index) => (
                        <div
                            key={index}
                            className="key-frame-card"
                            onClick={() => onTimestampClick(frame.seconds)}
                        >
                            <img src={frame.imageData} alt={`Frame at ${frame.time}`} />
                            <span className="timestamp-badge">{frame.time}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default KeyFrameExtractor;

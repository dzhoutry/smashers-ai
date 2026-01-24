import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const VideoPlayer = forwardRef(({ videoSource }, ref) => {
    const videoRef = useRef(null);
    const [videoUrl, setVideoUrl] = useState(null);

    // Expose seekTo method
    useImperativeHandle(ref, () => ({
        seekTo: (seconds) => {
            if (videoSource.type === 'file' && videoRef.current) {
                videoRef.current.currentTime = seconds;
                videoRef.current.play();
            } else if (videoSource.type === 'youtube') {
                // For YouTube, we need to reload the iframe with ?start=
                // Or use the Iframe API. For simplicity and robustness without external libs,
                // we'll just update the src to auto-play at that time.
                // A better approach would be the full YouTube Player API, but this is lighter.
                const baseUrl = `https://www.youtube.com/embed/${videoSource.videoId}?autoplay=1&start=${Math.floor(seconds)}`;
                setVideoUrl(baseUrl);
            }
        }
    }));

    useEffect(() => {
        if (!videoSource) return;

        if (videoSource.type === 'file' && videoSource.file) {
            const url = URL.createObjectURL(videoSource.file);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (videoSource.type === 'youtube') {
            setVideoUrl(`https://www.youtube.com/embed/${videoSource.videoId}`);
        }
    }, [videoSource]);

    if (!videoSource || !videoUrl) return null;

    if (videoSource.type === 'file') {
        return (
            <div className="video-player-container">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="video-player-native"
                    style={{ width: '100%', border: '4px solid var(--pigment-black)', background: 'black' }}
                />
            </div>
        );
    }

    if (videoSource.type === 'youtube') {
        return (
            <div className="video-player-container" style={{ width: '100%', aspectRatio: '16/9' }}>
                <iframe
                    width="100%"
                    height="100%"
                    src={videoUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ border: '4px solid var(--pigment-black)', background: 'black', width: '100%', height: '100%', objectFit: 'cover' }}
                ></iframe>
            </div>
        );
    }

    return null;
});

export default VideoPlayer;

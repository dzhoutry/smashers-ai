import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const VideoPlayer = forwardRef(({ videoSource, onDurationReceived }, ref) => {
    const videoRef = useRef(null);
    const iframeRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const [videoUrl, setVideoUrl] = useState(null);

    // Expose seekTo method
    useImperativeHandle(ref, () => ({
        seekTo: (seconds) => {
            if (videoSource.type === 'file' && videoRef.current) {
                videoRef.current.currentTime = seconds;
                videoRef.current.play();
            } else if (videoSource.type === 'youtube') {
                if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
                    ytPlayerRef.current.seekTo(seconds, true);
                    ytPlayerRef.current.playVideo();
                } else {
                    // Fallback to reloading if API isn't ready
                    const baseUrl = `https://www.youtube.com/embed/${videoSource.videoId}?autoplay=1&enablejsapi=1&start=${Math.floor(seconds)}`;
                    setVideoUrl(baseUrl);
                }
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
            setVideoUrl(`https://www.youtube.com/embed/${videoSource.videoId}?enablejsapi=1`);

            // Initialize YouTube API if it's not already loaded
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }

            const initPlayer = () => {
                if (window.YT && window.YT.Player && iframeRef.current) {
                    ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
                        events: {
                            'onReady': (event) => {
                                console.log('YT Player Ready');
                                // Report duration back to parent for Alpha users/fallback
                                if (onDurationReceived) {
                                    const duration = event.target.getDuration();
                                    if (duration > 0) {
                                        onDurationReceived(duration);
                                    }
                                }
                            }
                        }
                    });
                }
            };

            if (window.YT && window.YT.Player) {
                initPlayer();
            } else {
                window.onYouTubeIframeAPIReady = initPlayer;
            }
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
                    ref={iframeRef}
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

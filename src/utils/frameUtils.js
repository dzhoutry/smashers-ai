/**
 * Utility functions for extracting frames from video files
 */

/**
 * Extract frames from a video file at specified timestamps
 * @param {File} videoFile - The video file object
 * @param {string[]} timestamps - Array of timestamp strings [MM:SS]
 * @returns {Promise<Array<{time: string, imageData: string}>>}
 */
export async function extractFrames(videoFile, timestamps) {
    if (!videoFile || !timestamps || timestamps.length === 0) return [];

    // Filter unique timestamps to avoid duplicate processing
    const uniqueTimestamps = [...new Set(timestamps)];

    // Parse timestamps to seconds
    const timePoints = uniqueTimestamps.map(ts => {
        const parts = ts.replace(/[\[\]]/g, '').split(':');
        return {
            original: ts,
            seconds: parseInt(parts[0]) * 60 + parseInt(parts[1])
        };
    }).sort((a, b) => a.seconds - b.seconds);

    // Create hidden video element
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;

    // Create canvas for drawing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    return new Promise((resolve, reject) => {
        const frames = [];
        let currentIndex = 0;

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // Start processing
            seekToNext();
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(video.src);
            reject(e);
        };

        const seekToNext = () => {
            if (currentIndex >= timePoints.length) {
                // Done
                URL.revokeObjectURL(video.src);
                resolve(frames);
                return;
            }

            video.currentTime = timePoints[currentIndex].seconds;
        };

        video.onseeked = () => {
            // Draw frame to canvas
            ctx.drawImage(video, 0, 0);

            // Convert to data URL (reduce quality slightly for performance)
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            frames.push({
                time: timePoints[currentIndex].original,
                seconds: timePoints[currentIndex].seconds,
                imageData
            });

            currentIndex++;
            seekToNext();
        };
    });
}

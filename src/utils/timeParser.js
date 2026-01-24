/**
 * Time parsing utilities for video trimming
 */

/**
 * Parse a time string (MM:SS or HH:MM:SS) to seconds
 * @param {string} timeStr - Time string like "5:30" or "1:05:30"
 * @returns {number|null} Seconds or null if invalid
 */
export function parseTimeString(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;

    const trimmed = timeStr.trim();
    const parts = trimmed.split(':').map(p => parseInt(p, 10));

    // Validate all parts are numbers
    if (parts.some(isNaN)) return null;

    if (parts.length === 2) {
        // MM:SS format
        const [mins, secs] = parts;
        if (mins < 0 || secs < 0 || secs >= 60) return null;
        return mins * 60 + secs;
    } else if (parts.length === 3) {
        // HH:MM:SS format
        const [hrs, mins, secs] = parts;
        if (hrs < 0 || mins < 0 || mins >= 60 || secs < 0 || secs >= 60) return null;
        return hrs * 3600 + mins * 60 + secs;
    }

    return null;
}

/**
 * Convert seconds to display format
 * @param {number} totalSeconds 
 * @returns {string} Formatted time string
 */
export function formatSeconds(totalSeconds) {
    if (totalSeconds == null || totalSeconds < 0) return '0:00';

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate a time range
 * @param {number} startSeconds 
 * @param {number} endSeconds 
 * @param {number} maxDuration - Maximum allowed duration in seconds
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTimeRange(startSeconds, endSeconds, maxDuration) {
    if (startSeconds == null) {
        return { valid: false, error: 'Start time is required' };
    }
    if (endSeconds == null) {
        return { valid: false, error: 'End time is required' };
    }
    if (startSeconds < 0) {
        return { valid: false, error: 'Start time cannot be negative' };
    }
    if (endSeconds <= startSeconds) {
        return { valid: false, error: 'End time must be after start time' };
    }
    if (maxDuration && endSeconds > maxDuration) {
        return { valid: false, error: `End time exceeds video duration (${formatSeconds(maxDuration)})` };
    }

    const MAX_SEGMENT = 30 * 60; // 30 minutes max
    if (endSeconds - startSeconds > MAX_SEGMENT) {
        return { valid: false, error: 'Segment cannot exceed 30 minutes' };
    }

    return { valid: true };
}

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url 
 * @returns {string|null} Video ID or null
 */
export function extractYouTubeId(url) {
    if (!url) return null;

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Validate a YouTube URL
 * @param {string} url 
 * @returns {{ valid: boolean, videoId?: string, error?: string }}
 */
export function validateYouTubeUrl(url) {
    const videoId = extractYouTubeId(url);

    if (!videoId) {
        return { valid: false, error: 'Invalid YouTube URL' };
    }

    return { valid: true, videoId };
}

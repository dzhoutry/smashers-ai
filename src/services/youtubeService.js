/**
 * YouTube Data API service
 */

/**
 * Fetch YouTube video metadata (specifically duration)
 * @param {string} videoId 
 * @param {string} apiKey 
 * @returns {Promise<{duration: number}>}
 */
export async function fetchYouTubeMetadata(videoId, apiKey) {
    if (!apiKey) throw new Error('API key is required');

    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch YouTube metadata');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error('YouTube video not found');
    }

    const isoDuration = data.items[0].contentDetails.duration;
    const durationSeconds = parseISO8601Duration(isoDuration);

    return { duration: durationSeconds };
}

/**
 * Parse ISO 8601 duration string (e.g. PT1H2M10S) to seconds
 * @param {string} duration 
 * @returns {number}
 */
function parseISO8601Duration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const [, hours, minutes, seconds] = match.map(x => parseInt(x, 10) || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

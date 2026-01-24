/**
 * Token calculation utilities for Gemini video analysis
 * Based on: 258 tokens per second of video
 * Cost: $0.075 per 1 million tokens
 */

const TOKENS_PER_SECOND = 258;
const COST_PER_MILLION_TOKENS = 0.075;

/**
 * Calculate estimated tokens for a video segment
 * @param {number} durationSeconds - Duration in seconds
 * @returns {number} Estimated token count
 */
export function calculateTokens(durationSeconds) {
    return Math.ceil(durationSeconds * TOKENS_PER_SECOND);
}

/**
 * Calculate estimated cost in USD
 * @param {number} tokens - Token count
 * @returns {number} Cost in USD
 */
export function calculateCost(tokens) {
    return (tokens / 1_000_000) * COST_PER_MILLION_TOKENS;
}

/**
 * Format token and cost for display
 * @param {number} durationSeconds - Duration in seconds
 * @returns {object} Formatted display values
 */
export function formatTokenDisplay(durationSeconds) {
    const tokens = calculateTokens(durationSeconds);
    const cost = calculateCost(tokens);

    return {
        tokens: tokens.toLocaleString(),
        cost: cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`,
        duration: formatDuration(durationSeconds),
        summary: `~${tokens.toLocaleString()} tokens ≈ ${cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`}`
    };
}

/**
 * Format seconds to readable duration
 * @param {number} seconds 
 * @returns {string}
 */
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

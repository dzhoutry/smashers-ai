/**
 * Storage service for analysis history using localStorage
 */

const STORAGE_KEY = 'badminton_analysis_history';

/**
 * Generate a unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get all saved analyses
 * @returns {Array} Array of analysis objects
 */
export function getAnalysisHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading analysis history:', error);
        return [];
    }
}

/**
 * Save a new analysis
 * @param {object} analysis - Analysis data to save
 * @returns {object} Saved analysis with ID
 */
export function saveAnalysis(analysis) {
    const analyses = getAnalysisHistory();
    const newAnalysis = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        ...analysis
    };

    analyses.unshift(newAnalysis); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));

    return newAnalysis;
}

/**
 * Get a single analysis by ID
 * @param {string} id 
 * @returns {object|null}
 */
export function getAnalysisById(id) {
    const analyses = getAnalysisHistory();
    return analyses.find(a => a.id === id) || null;
}

/**
 * Delete an analysis
 * @param {string} id 
 */
export function deleteAnalysis(id) {
    const analyses = getAnalysisHistory();
    const filtered = analyses.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get analysis summaries for AI context
 * Returns condensed versions of past analyses
 * @param {number} limit - Max number of summaries to return
 * @returns {Array}
 */
export function getAnalysisSummaries(limit = 5) {
    const analyses = getAnalysisHistory().slice(0, limit);

    return analyses.map(a => ({
        date: a.createdAt,
        playerDescription: a.playerDescription,
        strengths: a.analysis?.strengths || [],
        gaps: a.analysis?.gaps || [],
        overallScore: a.analysis?.overallScore
    }));
}

/**
 * Export all history as JSON
 * @returns {string} JSON string
 */
export function exportHistory() {
    return JSON.stringify(getAnalysisHistory(), null, 2);
}

/**
 * Clear all history
 */
export function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
}

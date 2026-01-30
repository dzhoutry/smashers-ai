import { supabase } from './supabaseClient';

/**
 * Storage service for analysis history using localStorage and Supabase
 */

const STORAGE_KEY = 'badminton_analysis_history';

/**
 * Generate a unique ID (used for local state before sync)
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get all saved analyses
 * @returns {Promise<Array>} Array of analysis objects
 */
export async function getAnalysisHistory() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            const { data, error } = await supabase
                .from('analyses')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const mappedData = data.map(item => ({
                    id: item.id,
                    createdAt: item.created_at,
                    playerDescription: item.player_description,
                    videoUrl: item.video_url,
                    thumbnailUrl: item.thumbnail_url,
                    analysis: item.analysis,
                    // Unpack metadata
                    playerName: item.metadata?.playerName,
                    videoSource: item.metadata?.videoSource,
                    startTime: item.metadata?.startTime,
                    endTime: item.metadata?.endTime,
                    modelId: item.metadata?.modelId,
                    metadata: item.metadata
                }));
                // Cache in localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedData));
                return mappedData;
            }
        }

        // Fallback to localStorage
        const localData = localStorage.getItem(STORAGE_KEY);
        return localData ? JSON.parse(localData) : [];
    } catch (error) {
        console.error('Error reading analysis history:', error);
        return [];
    }
}

/**
 * Save a new analysis
 * @param {object} analysisData - Analysis data to save
 * @returns {Promise<object>} Saved analysis with ID
 */
export async function saveAnalysis(analysisData) {
    const { data: { session } } = await supabase.auth.getSession();

    let newAnalysis = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        ...analysisData
    };

    // Save to Supabase if logged in
    if (session) {
        try {
            const { data, error } = await supabase
                .from('analyses')
                .insert({
                    user_id: session.user.id,
                    player_description: analysisData.playerDescription,
                    video_url: analysisData.videoUrl || (analysisData.videoSource?.type === 'youtube' ? `https://youtube.com/watch?v=${analysisData.videoSource.videoId}` : null),
                    thumbnail_url: analysisData.thumbnailUrl,
                    analysis: analysisData.analysis,
                    metadata: {
                        playerName: analysisData.playerName,
                        videoSource: analysisData.videoSource,
                        startTime: analysisData.startTime,
                        endTime: analysisData.endTime,
                        modelId: analysisData.modelId,
                        ...analysisData.metadata
                    }
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                newAnalysis = {
                    id: data.id,
                    createdAt: data.created_at,
                    ...analysisData
                };
            }
        } catch (error) {
            console.error('Error saving to Supabase:', error);
        }
    }

    // Always update localStorage cache
    const analyses = await getAnalysisHistory();
    // Use the mapped data from getAnalysisHistory or update local state
    const updatedAnalyses = [newAnalysis, ...analyses.filter(a => a.id !== newAnalysis.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAnalyses));

    return newAnalysis;
}

/**
 * Get a single analysis by ID
 * @param {string} id 
 * @returns {Promise<object|null>}
 */
export async function getAnalysisById(id) {
    const analyses = await getAnalysisHistory();
    return analyses.find(a => a.id === id) || null;
}

/**
 * Delete an analysis
 * @param {string} id 
 */
export async function deleteAnalysis(id) {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        try {
            await supabase
                .from('analyses')
                .delete()
                .eq('id', id)
                .eq('user_id', session.user.id);
        } catch (error) {
            console.error('Error deleting from Supabase:', error);
        }
    }

    const analyses = await getAnalysisHistory();
    const filtered = analyses.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get analysis summaries for AI context
 * Returns condensed versions of past analyses
 * @param {number} limit - Max number of summaries to return
 * @returns {Promise<Array>}
 */
export async function getAnalysisSummaries(limit = 5) {
    const analyses = (await getAnalysisHistory()).slice(0, limit);

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
 * @returns {Promise<string>} JSON string
 */
export async function exportHistory() {
    return JSON.stringify(await getAnalysisHistory(), null, 2);
}

/**
 * Clear all history
 */
export async function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    // Note: We probably don't want to clear Supabase history automatically here 
    // without explicit user intent, but we'll stick to localStorage clear for now.
}

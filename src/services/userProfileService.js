import { supabase } from './supabaseClient';
import { getAnalysisHistory } from './storageService';

/**
 * Service to manage user profile data
 * Persists data to localStorage and syncs with Supabase if logged in
 */

const STORAGE_KEY = 'smashers_user_profile';

const DEFAULT_PROFILE = {
    displayName: 'Guest Player',
    email: '',
    bio: 'Badminton enthusiast ready to smash!',
    preferences: {
        darkMode: false,
        publicProfile: false
    },
    plan: {
        tier: 'ALPHA SMASHER',
        level: 1,
        isPro: false
    },
    avatarStyle: 'adventurer',
    avatarId: 'seed',
    avatarBackground: ['b6e3f4'],
    avatarBackgroundType: 'solid'
};

/**
 * Get the current user profile
 * @returns {Promise<object>} The user profile object
 */
export async function getUserProfile() {
    try {
        // Try to get from Supabase first if logged in
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (data && !error) {
                const profile = {
                    displayName: data.display_name || 'Guest Player',
                    email: data.email,
                    bio: data.bio || DEFAULT_PROFILE.bio,
                    avatarStyle: data.avatar_style || DEFAULT_PROFILE.avatarStyle,
                    avatarId: data.avatar_id || DEFAULT_PROFILE.avatarId,
                    avatarBackground: data.avatar_background || DEFAULT_PROFILE.avatarBackground,
                    avatarBackgroundType: data.avatar_background_type || DEFAULT_PROFILE.avatarBackgroundType,
                    preferences: data.preferences || DEFAULT_PROFILE.preferences,
                    plan: data.plan || DEFAULT_PROFILE.plan
                };
                // Cache in localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
                return profile;
            }
        }

        // Fallback to localStorage
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
            return { ...DEFAULT_PROFILE, ...JSON.parse(localData) };
        }
        return { ...DEFAULT_PROFILE };
    } catch (error) {
        console.error('Error reading user profile:', error);
        return { ...DEFAULT_PROFILE };
    }
}

/**
 * Update the user profile
 * @param {object} updates - Partial profile updates
 * @returns {Promise<object>} The updated profile
 */
export async function updateUserProfile(updates) {
    const current = await getUserProfile();
    const updated = { ...current, ...updates };

    if (updates.preferences) {
        updated.preferences = { ...current.preferences, ...updates.preferences };
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Sync with Supabase if logged in
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const supabaseUpdates = {
                id: session.user.id,
                display_name: updated.displayName,
                bio: updated.bio,
                avatar_style: updated.avatarStyle,
                avatar_id: updated.avatarId,
                avatar_background: updated.avatarBackground,
                avatar_background_type: updated.avatarBackgroundType,
                preferences: updated.preferences,
                plan: updated.plan,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(supabaseUpdates);

            if (error) throw error;
        }
    } catch (error) {
        console.error('Error syncing profile to Supabase:', error);
    }

    return updated;
}

/**
 * Reset profile to defaults
 */
export function resetProfile() {
    localStorage.removeItem(STORAGE_KEY);
    return { ...DEFAULT_PROFILE };
}

/**
 * Calculate dynamic player stats based on analysis history
 * @returns {Promise<{rank: string, level: number, stats: object}>}
 */
export async function calculatePlayerStats() {
    const profile = await getUserProfile();
    const history = await getAnalysisHistory();
    const displayName = profile.displayName.toLowerCase();

    // 1. Calculate Level (Grit/Experience) - Based on total unique analyses
    const totalAnalyses = history.length;
    // Formula: easy to get to 10, harder to 50, very hard to 100
    const calculatedLevel = Math.max(1, Math.floor(2.5 * Math.sqrt(totalAnalyses)));

    // 2. Calculate Rank (Skill) - Based on weighted average of scores
    // Only include analyses where the player name matches the user
    const playerAnalyses = history
        .filter(a => a.playerName?.toLowerCase().includes(displayName) || a.playerDescription?.toLowerCase().includes(displayName))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first

    if (playerAnalyses.length === 0) {
        return {
            rank: 'ROOKIE',
            level: calculatedLevel,
            stats: { count: 0, total: totalAnalyses }
        };
    }

    let weightedSum = 0;
    let weightTotal = 0;

    playerAnalyses.forEach((a, index) => {
        const score = a.analysis?.overallScore || 0;
        const weight = Math.pow(0.9, index); // Exponential weight decay
        weightedSum += score * weight;
        weightTotal += weight;
    });

    const skillScore = weightedSum / weightTotal;

    let rank = 'ROOKIE';
    if (skillScore >= 8) rank = 'PRO';
    else if (skillScore >= 6) rank = 'ADVANCED';
    else if (skillScore >= 4) rank = 'INTERMEDIATE';
    else if (skillScore >= 2) rank = 'AMATEUR';

    return {
        rank,
        level: calculatedLevel,
        stats: {
            skillScore: parseFloat(skillScore.toFixed(1)),
            playerCount: playerAnalyses.length,
            totalCount: totalAnalyses
        }
    };
}

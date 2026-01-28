import { supabase } from './supabaseClient';

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
        tier: 'Free Tier',
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

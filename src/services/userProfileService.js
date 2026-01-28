/**
 * Service to manage user profile data
 * Persists data to localStorage
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
 * @returns {object} The user profile object
 */
export function getUserProfile() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            // Merge with default to ensure new fields are present
            return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
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
 * @returns {object} The updated profile
 */
export function updateUserProfile(updates) {
    const current = getUserProfile();
    const updated = { ...current, ...updates };

    // Deep merge for nested objects like preferences if needed, 
    // but for now simple spread is okay if we are careful.
    // Let's ensure preferences are merged correctly if passed partially
    if (updates.preferences) {
        updated.preferences = { ...current.preferences, ...updates.preferences };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

/**
 * Reset profile to defaults
 */
export function resetProfile() {
    localStorage.removeItem(STORAGE_KEY);
    return { ...DEFAULT_PROFILE };
}

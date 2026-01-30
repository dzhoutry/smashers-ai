import { supabase } from './supabaseClient';

export const authService = {
    /**
     * Sign up a new user
     */
    async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    /**
     * Sign in an existing user
     */
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    prompt: 'select_account'
                }
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Sign out
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Get current session
     */
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    /**
     * Update user email
     */
    async updateUserEmail(newEmail) {
        const { data, error } = await supabase.auth.updateUser({
            email: newEmail
        });
        if (error) throw error;
        return data;
    },

    /**
     * Update user password
     */
    async updateUserPassword(newPassword) {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return data;
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((_event, session) => {
            callback(session);
        });
    }
};

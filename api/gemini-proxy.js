import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL; // Vercel exposes this if set in env
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Helper for CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({}, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Missing Supabase configuration');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Verify user is in ALPHA SMASHER tier
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.plan?.tier !== 'ALPHA SMASHER') {
            return res.status(403).json({ error: 'Access denied: Alpha Smasher plan required' });
        }

        const { model, contents, generationConfig } = req.body;

        if (!GEMINI_API_KEY) {
            console.error('Missing Gemini API Key');
            return res.status(500).json({ error: 'Server configuration error: Missing AI Key' });
        }

        // Retry logic with exponential backoff
        let retryCount = 0;
        const maxRetries = 3;
        let lastError = null;

        while (retryCount <= maxRetries) {
            const response = await fetch(
                `${API_BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents, generationConfig })
                }
            );

            if (response.ok) {
                const data = await response.json();
                return res.status(200).json(data);
            }

            if (response.status === 429) {
                lastError = 'Rate limit exceeded';
                const waitTime = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retryCount++;
                continue;
            }

            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Gemini API error');
        }

        throw new Error(lastError || 'Max retries exceeded');

    } catch (err) {
        console.error('Proxy error:', err);
        return res.status(500).json({ error: err.message });
    }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': '*' } })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header')

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) throw new Error('Unauthorized')

        // Verify user is in ALPHA SMASHER tier
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single()

        if (profileError || profile?.plan?.tier !== 'ALPHA SMASHER') {
            throw new Error('Access denied: Alpha Smasher plan required')
        }

        const { model, contents, generationConfig } = await req.json()

        // Retry logic with exponential backoff
        let retryCount = 0
        const maxRetries = 3
        let lastError = null

        while (retryCount <= maxRetries) {
            const response = await fetch(
                `${API_BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents, generationConfig })
                }
            )

            if (response.ok) {
                const data = await response.json()
                return new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                })
            }

            if (response.status === 429) {
                lastError = 'Rate limit exceeded'
                const waitTime = Math.pow(2, retryCount) * 1000
                await new Promise(resolve => setTimeout(resolve, waitTime))
                retryCount++
                continue
            }

            const errorData = await response.json()
            throw new Error(errorData.error?.message || 'Gemini API error')
        }

        throw new Error(lastError || 'Max retries exceeded')

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        })
    }
})

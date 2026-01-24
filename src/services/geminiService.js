/**
 * Gemini API service for video analysis
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const MODELS = {
    FLASH_2_0: 'gemini-2.0-flash',
    PRO_3: 'gemini-3-pro-preview'
};

const DEFAULT_MODEL = MODELS.FLASH_2_0;

/**
 * Build the analysis prompt for badminton gameplay
 * @param {string} playerDescription 
 * @param {Array} previousAnalyses - Previous analysis summaries for context
 * @param {object} timeRange - Optional { start: number, end: number } in seconds
 * @returns {string}
 */
function buildAnalysisPrompt(playerDescription, previousAnalyses = [], timeRange = null, videoDuration = null) {
    let historyContext = '';

    if (previousAnalyses.length > 0) {
        historyContext = `
## Previous Analysis History
The player has ${previousAnalyses.length} previous analyses. Here are the key findings:

${previousAnalyses.map((a, i) => `
### Analysis ${i + 1} (${new Date(a.date).toLocaleDateString()})
- Technical: ${a.technicalSkills?.score || 'N/A'}/10
- Tactical: ${a.tacticalSkills?.score || 'N/A'}/10
- Physicality: ${a.physicality?.score || 'N/A'}/10
`).join('')}

When analyzing, compare current performance to these past observations and note any improvements or regressions.
`;
    }

    let temporalInstructions = `
## MANDATORY TEMPORAL COVERAGE
This video is ${videoDuration ? formatTime(videoDuration) : 'of unknown duration'} long.
`;

    if (timeRange && (timeRange.start > 0 || (timeRange.end > 0 && timeRange.end < videoDuration))) {
        const startStr = formatTime(timeRange.start || 0);
        const endStr = timeRange.end ? formatTime(timeRange.end) : 'end of video';
        temporalInstructions += `
- **FOCUS**: You are analyzing a specific segment from ${startStr} to ${endStr}.
- **DISTRIBUTION**: You MUST distribute your observations evenly across the beginning, middle, and end of THIS SPECIFIC SEGMENT.
`;
    } else {
        temporalInstructions += `
- **FULL VIDEO ANALYSIS**: You MUST analyse the entire duration from 0:00 to ${videoDuration ? formatTime(videoDuration) : 'the end'}.
- **NO BIAS**: Do NOT focus only on the first few minutes. Scrutinize the middle and final stages of the video with equal depth.
- **PROVE COVERAGE**: You MUST include multiple observations with timestamps from the FINAL 20% of the video duration.
- **FATIGUE CHECK**: Specifically analyse if the player's technique, footwork speed, or shot selection quality changes (e.g., due to fatigue) between the start and the end of the video.
`;
    }

    return `You are an expert badminton coach analyzing gameplay footage. Your task is to provide EXTREMELY DETAILED, actionable feedback for a club or intermediate level player.
You must break down your analysis into specific sub-categories to ensure comprehensive coverage.

${temporalInstructions}

## Player to Analyse
${playerDescription}

${historyContext}

## Analysis Required
Analyse the identified player's performance across these 3 pillars and their sub-dimensions:

### 1. Technical Skills
- **Racket Skills:** quality of clear, drop, smash, drive, lift, net shot, push; spin control; ability to change pace and angle.
- **Control & Precision:** depth to back tramlines, width to sidelines, tightness at net, unforced error rate.
- **Deception & Variation:** holds, slice, delayed hits, ability to disguise shots from same preparation.
- **Footwork Technique:** efficiency of split-steps, chasses, lunging mechanics, recovery steps, balance.
- **Stroke Mechanics:** core rotation, kinetic chain, pronation/supination, hitting point relative to body.

### 2. Tactical Skills
- **Game Understanding:** pattern recognition, exploiting opponent weaknesses, singles/doubles IQ.
- **Shot Selection:** choices under pressure, percentage play vs high risk, adapting to court conditions.
- **Rally Construction:** creating openings through placement/tempo vs rushing for winners.
- **Reading & Anticipation:** reacting to opponent body language, intercepting, moving before shuttle is hit.
- **Formations (if doubles):** rotational discipline, serving/receiving formations, coverage gaps.

### 3. Physicality
- **Speed & Agility:** first-step explosiveness, change of direction, court coverage speed.
- **Explosive Power:** jump height, smash power, acceleration.
- **Endurance:** maintenance of quality movement/strokes late in game, recovery between rallies.
- **Strength & Stability:** lunge stability, core strength, recovery power.
- **Mobility:** reach flexibility, deep lunge capacity, overhead range of motion.
- **Anthropometrics:** utilization of height/reach or compensation for lack thereof.

## Response Format
Respond in valid JSON format with this strict structure.

**CRITICAL: BALANCED ANALYSIS**
For EACH sub-category (e.g., "Racket Skills"), you MUST provide:
1.  **Observations**: 2-3 timestamped observations of what the player actually did.
2.  **Successes**: 2-3 specific points on what the player did well (timestamps optional).
3.  **Improvements**: 2-3 specific actionable tips on what to do better (timestamps optional).
4.  **Balance**: Do NOT output 5 observations and only 1 success. Keep the counts roughly equal. Even for a strong player, find minor improvements. For a weak player, acknowledge basic successes.

**CRITICAL: CITATIONS & FORMATTING**
1.  **Observations**: MUST include a timestamp at the end of the string in the format [MM:SS]. Do NOT prefix with text like "obs".
    - Correct: "Forehand clear reached the back line with good height [02:30]"
    - Incorrect: "obs [02:30] Forehand clear..."
2.  **Successes/Improvements**: Timestamps are allowed but NOT required.

{
  "overallScore": <number 1-10>,
  "confidence": {
    "score": "High" | "Medium" | "Low",
    "reason": "Brief explanation"
  },
  "technicalSkills": {
    "racketSkills": {
       "score": <1-10>,
       "observations": ["Specific observation description [MM:SS]", "Another observation [MM:SS]"],
       "successes": ["Good wrist snap on smashes", "Consistent backhand clears"],
       "improvements": ["Use more finger power for net shots", "Relax grip when defending"]
    },
    "controlPrecision": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "deceptionVariation": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "footworkTechnique": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "strokeMechanics": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] }
  },
  "tacticalSkills": {
    "gameUnderstanding": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "shotSelection": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "rallyConstruction": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "readingAnticipation": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "formations": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] }
  },
  "physicality": {
    "speedAgility": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "explosivePower": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "endurance": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "strengthStability": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "mobility": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] },
    "anthropometrics": { "score": <1-10>, "observations": ["..."], "successes": ["..."], "improvements": ["..."] }
  },
  "progressNotes": "comparison to previous analyses..."
}
`;
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Upload a file to Gemini File API
 * @param {string} apiKey 
 * @param {File} file 
 * @param {function} onProgress - Progress callback for upload
 * @returns {Promise<string>} File URI
 */
async function uploadToGemini(apiKey, file, onProgress) {
    // 1. Initial request to get resumable upload URL
    const uploadUrl = await startResumableUpload(apiKey, file);

    // 2. Perform the actual upload
    const fileResult = await uploadFileData(uploadUrl, file, onProgress);
    const fileUri = fileResult.file.uri;
    const fileName = fileResult.file.name;

    // 3. Wait for the file to be processed (ACTIVE state)
    await waitForFileActive(apiKey, fileName);

    return fileUri;
}

/**
 * Start a resumable upload session
 */
async function startResumableUpload(apiKey, file) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'X-Goog-Upload-Protocol': 'resumable',
                'X-Goog-Upload-Command': 'start',
                'X-Goog-Upload-Header-Content-Length': file.size.toString(),
                'X-Goog-Upload-Header-Content-Type': file.type || 'video/mp4',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file: { displayName: file.name }
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to start upload: ${response.statusText}`);
    }

    const uploadUrl = response.headers.get('X-Goog-Upload-URL');
    if (!uploadUrl) {
        throw new Error('No upload URL returned from API');
    }

    return uploadUrl;
}

/**
 * Upload the actual file data
 */
async function uploadFileData(uploadUrl, file, onProgress) {
    // Note: Standard fetch doesn't support upload progress naturally in all environments 
    // but for simplicity we'll just send the full file here.
    // In a production app, one might use XMLHttpRequest or similar for progress.

    const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'X-Goog-Upload-Command': 'upload, finalize',
            'X-Goog-Upload-Offset': '0',
            'Content-Length': file.size.toString()
        },
        body: file
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Poll for the file to become ACTIVE
 */
async function waitForFileActive(apiKey, fileName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`;

    while (true) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to check file status: ${response.statusText}`);
        }

        const data = await response.json();
        const state = data.state;

        if (state === 'ACTIVE') {
            return;
        }

        if (state === 'FAILED') {
            throw new Error('File processing failed on Gemini servers');
        }

        // Wait 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

/**
 * Analyze a video using Gemini API
 * @param {object} params
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.playerDescription - Description of player to analyze
 * @param {object} params.videoData - Video file or YouTube info
 * @param {Array} params.previousAnalyses - Previous analysis summaries
 * @param {object} params.timeRange - Optional { start, end }
 * @param {number} params.videoDuration - Total duration of the video in seconds
 * @param {string} params.model - Gemini model ID
 * @param {function} params.onStatusUpdate - Progress callback
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeVideo({
    apiKey,
    playerDescription,
    videoData,
    previousAnalyses = [],
    timeRange = null,
    videoDuration = null,
    model = DEFAULT_MODEL,
    onStatusUpdate
}) {
    if (!apiKey) {
        throw new Error('API key is required. Please add your Gemini API key in Settings.');
    }

    const prompt = buildAnalysisPrompt(playerDescription, previousAnalyses, timeRange, videoDuration);

    let parts = [];

    if (videoData.type === 'youtube') {
        const youtubeUrl = buildYouTubeUrl(videoData.videoId, videoData.startTime, videoData.endTime);
        parts.push({
            fileData: {
                fileUri: youtubeUrl,
                mimeType: 'video/mp4'
            }
        });
    } else if (videoData.type === 'file') {
        // Uploaded file - use File API
        if (onStatusUpdate) onStatusUpdate('Uploading video to Google servers...');
        const fileUri = await uploadToGemini(apiKey, videoData.file);

        if (onStatusUpdate) onStatusUpdate('Video uploaded. Processing (this may take a minute)...');
        // The uploadToGemini function already waits for ACTIVE state

        parts.push({
            fileData: {
                fileUri: fileUri,
                mimeType: videoData.file.type || 'video/mp4'
            }
        });
    } else {
        throw new Error('Invalid video data type');
    }

    parts.push({ text: prompt });

    if (onStatusUpdate) onStatusUpdate('Generating analysis...');

    const response = await fetch(
        `${API_BASE}/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json'
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
        throw new Error('No analysis returned from API');
    }

    try {
        return JSON.parse(textContent);
    } catch (e) {
        console.error('Failed to parse API response:', textContent);
        throw new Error('Failed to parse analysis response');
    }
}

/**
 * Build YouTube URL with optional time parameters
 */
function buildYouTubeUrl(videoId, startTime, endTime) {
    let url = `https://www.youtube.com/watch?v=${videoId}`;

    if (startTime != null && startTime > 0) {
        url += `&t=${Math.floor(startTime)}`;
    }

    return url;
}

/**
 * Test API key validity
 * @param {string} apiKey 
 * @returns {Promise<boolean>}
 */
export async function testApiKey(apiKey, model = DEFAULT_MODEL) {
    try {
        const response = await fetch(
            `${API_BASE}/models/${model}?key=${apiKey}`
        );
        return response.ok;
    } catch {
        return false;
    }
}

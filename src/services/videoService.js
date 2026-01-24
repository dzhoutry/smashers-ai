/**
 * Video processing service using ffmpeg.wasm for client-side trimming
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let ffmpegLoaded = false;
let ffmpegLoading = false;

/**
 * Initialize ffmpeg.wasm
 * @param {function} onProgress - Progress callback
 */
export async function initFFmpeg(onProgress) {
    if (ffmpegLoaded) return ffmpeg;
    if (ffmpegLoading) {
        // Wait for existing load to complete
        while (ffmpegLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return ffmpeg;
    }

    ffmpegLoading = true;

    try {
        ffmpeg = new FFmpeg();

        ffmpeg.on('progress', ({ progress }) => {
            if (onProgress) {
                // Progress during actual ffmpeg processing
                onProgress({ phase: 'processing', progress: Math.round(progress * 100) });
            }
        });

        ffmpeg.on('log', ({ message }) => {
            console.log('[ffmpeg]', message);
        });

        if (onProgress) {
            onProgress({ phase: 'loading', progress: 0, message: 'Loading ffmpeg...' });
        }

        // Load ffmpeg core from CDN
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        });

        ffmpegLoaded = true;
        return ffmpeg;
    } finally {
        ffmpegLoading = false;
    }
}

/**
 * Read file as ArrayBuffer with progress
 */
async function readFileWithProgress(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress({ phase: 'reading', progress: percent, message: `Reading file... ${percent}%` });
            }
        };

        reader.onload = () => {
            resolve(new Uint8Array(reader.result));
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Trim a video file to specified start and end times
 * @param {File} file - Video file
 * @param {number} startSeconds - Start time in seconds
 * @param {number} endSeconds - End time in seconds
 * @param {function} onProgress - Progress callback
 * @returns {Promise<Blob>} Trimmed video as Blob
 */
export async function trimVideo(file, startSeconds, endSeconds, onProgress) {
    // Warn user about large files
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 500) {
        console.warn(`Large file detected (${fileSizeMB.toFixed(0)}MB). Trimming may take several minutes.`);
    }

    // Initialize ffmpeg
    await initFFmpeg(onProgress);

    const inputName = 'input' + getExtension(file.name);
    const outputName = 'output.mp4';

    // Read file with progress
    if (onProgress) {
        onProgress({ phase: 'reading', progress: 0, message: 'Reading video file...' });
    }

    const fileData = await readFileWithProgress(file, onProgress);

    // Write to ffmpeg virtual filesystem
    if (onProgress) {
        onProgress({ phase: 'writing', progress: 0, message: 'Preparing for trim...' });
    }

    await ffmpeg.writeFile(inputName, fileData);

    // Calculate duration
    const duration = endSeconds - startSeconds;

    if (onProgress) {
        onProgress({ phase: 'processing', progress: 0, message: 'Trimming video...' });
    }

    // Run ffmpeg command to trim
    // -ss before -i: fast seek (doesn't decode before start point)
    // -c copy: stream copy without re-encoding (very fast)
    await ffmpeg.exec([
        '-ss', startSeconds.toString(),
        '-i', inputName,
        '-t', duration.toString(),
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        outputName
    ]);

    if (onProgress) {
        onProgress({ phase: 'finalizing', progress: 90, message: 'Finalizing...' });
    }

    // Read the output file
    const data = await ffmpeg.readFile(outputName);

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    if (onProgress) {
        onProgress({ phase: 'done', progress: 100, message: 'Complete' });
    }

    return new Blob([data.buffer], { type: 'video/mp4' });
}

/**
 * Check if a file is too large for efficient browser trimming
 * @param {File} file 
 * @returns {{ shouldTrim: boolean, warning?: string }}
 */
export function checkTrimmingFeasibility(file) {
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > 1000) {
        return {
            shouldTrim: false,
            warning: `File is very large (${fileSizeMB.toFixed(0)}MB). Browser-based trimming may be very slow or fail. Consider trimming the video using desktop software first, or upload a shorter segment.`
        };
    }

    if (fileSizeMB > 300) {
        return {
            shouldTrim: true,
            warning: `Large file (${fileSizeMB.toFixed(0)}MB). Trimming may take 1-3 minutes.`
        };
    }

    return { shouldTrim: true };
}

/**
 * Get file extension from filename
 */
function getExtension(filename) {
    const match = filename.match(/\.[^.]+$/);
    return match ? match[0] : '.mp4';
}

/**
 * Convert video file to base64
 * @param {Blob|File} blob 
 * @returns {Promise<string>}
 */
export async function videoToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Remove data URL prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Get video duration using HTML video element
 * @param {File|Blob} file 
 * @returns {Promise<number>} Duration in seconds
 */
export async function getVideoDuration(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error('Failed to load video metadata'));
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Validate video file
 * @param {File} file 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateVideoFile(file) {
    const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
    const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm'];

    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (file.size > MAX_SIZE) {
        return { valid: false, error: 'File size exceeds 2GB limit' };
    }

    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    const typeValid = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(extension);

    if (!typeValid) {
        return { valid: false, error: 'Invalid file format. Allowed: MP4, MOV, AVI, WebM' };
    }

    return { valid: true };
}

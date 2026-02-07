/**
 * Azure Speech configuration is now handled via Edge Function + Token
 * No local secrets required
 */

import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import { getRecordingUrl } from './storageService'
import { supabase } from '../lib/supabase'

// Token caching
let cachedAuthToken = null
let tokenExpirationTime = 0

/**
 * Fetch a valid auth token from our Edge Function
 * Implements client-side caching and safety margin
 */
async function getAuthToken() {
    const now = Date.now()

    // Safety Margin: 5 minutes
    // We strictly discard any token that has less than 5 minutes remaining
    const SAFETY_MARGIN = 5 * 60 * 1000

    if (cachedAuthToken && tokenExpirationTime > (now + SAFETY_MARGIN)) {
        return cachedAuthToken
    }

    try {
        const { data, error } = await supabase.functions.invoke('get-speech-token')

        if (error) throw error

        if (!data.token || !data.region) {
            throw new Error('Invalid response from token service')
        }

        cachedAuthToken = data
        // Use the expiration time provided by the server
        // If server didn't provide it (old version), fallback to conservative 5 mins
        tokenExpirationTime = data.expiresAt || (now + 5 * 60 * 1000)

        return data
    } catch (err) {
        console.error('Failed to get speech token:', err)
        throw err
    }
}

/**
 * Check if Azure Speech is configured (via Edge Function availability)
 */
export function isAzureSpeechConfigured() {
    // We assume it's configured if we have the Supabase client
    // The actual check will happen when we try to fetch a token
    return true
}

/**
 * Transcribe audio from a storage path using Speech SDK
 * Supports audio of ANY length
 * @param {string} storagePath - The path to the audio file in Supabase storage
 * @returns {Promise<{text: string, confidence: number}>} - Transcription result
 */
export async function transcribeAudio(storagePath) {
    try {
        // Step 1: Get signed URL for the audio file
        const audioUrl = await getRecordingUrl(storagePath)
        if (!audioUrl) {
            throw new Error('Could not get audio URL from storage')
        }

        // Step 2: Download the audio file
        const audioResponse = await fetch(audioUrl)
        if (!audioResponse.ok) {
            throw new Error(`Failed to download audio: ${audioResponse.status}`)
        }

        const audioBlob = await audioResponse.blob()

        // Step 3: Convert to ArrayBuffer for SDK
        const arrayBuffer = await audioBlob.arrayBuffer()

        // Step 4: Convert to WAV format (SDK works best with WAV)
        const wavBuffer = await convertToWavBuffer(arrayBuffer)

        // Step 5: Use Speech SDK for transcription
        const result = await transcribeWithSdk(wavBuffer)

        return result

    } catch (error) {
        return {
            text: null,
            confidence: 0,
            error: error.message
        }
    }
}

/**
 * Transcribe audio using Azure Speech SDK with Pronunciation Assessment
 * Returns text, confidence, and detailed pronunciation metrics
 * @param {ArrayBuffer} audioBuffer - WAV audio data
 * @returns {Promise<{text: string, confidence: number, pronunciationAssessment: object, error: string|null}>}
 */
async function transcribeWithSdk(audioBuffer) {
    return new Promise(async (resolve, reject) => {

        let authToken;
        try {
            authToken = await getAuthToken()
        } catch (err) {
            return reject(new Error('Authentication failed: ' + err.message))
        }

        // Create speech config with TOKEN
        const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
            authToken.token,
            authToken.region
        )

        // Configure for English (required for prosody assessment)
        speechConfig.speechRecognitionLanguage = 'en-US'

        // Enable detailed results
        speechConfig.outputFormat = sdk.OutputFormat.Detailed

        // Create Pronunciation Assessment Config (unscripted mode)
        // Using Phoneme granularity to get syllable and phoneme-level scores
        const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
            "",  // referenceText empty = unscripted assessment
            sdk.PronunciationAssessmentGradingSystem.HundredMark,
            sdk.PronunciationAssessmentGranularity.Phoneme,  // Changed from Word to Phoneme for detailed analysis
            false  // enableMiscue
        )

        // Enable prosody assessment (intonation, rhythm, stress)
        pronunciationConfig.enableProsodyAssessment = true


        // Create audio config from WAV buffer
        const audioInputStream = sdk.AudioInputStream.createPushStream()

        // Push the audio data
        audioInputStream.write(audioBuffer)
        audioInputStream.close()

        const audioConfig = sdk.AudioConfig.fromStreamInput(audioInputStream)

        // Create recognizer for continuous recognition
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)

        // Apply pronunciation assessment config to recognizer
        pronunciationConfig.applyTo(recognizer)

        // Collect all recognized text and pronunciation data
        const transcriptions = []
        let totalConfidence = 0
        let recognitionCount = 0

        // Aggregate pronunciation metrics
        const allWords = []
        let totalAccuracy = 0
        let totalFluency = 0
        let totalProsody = 0
        let totalPronScore = 0
        let metricsCount = 0

        // Handle recognized speech (final results)
        recognizer.recognized = (s, e) => {
            if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                const text = e.result.text
                if (text && text.trim()) {
                    transcriptions.push(text)

                    // Extract pronunciation assessment results
                    try {
                        const jsonResult = e.result.properties.getProperty(
                            sdk.PropertyId.SpeechServiceResponse_JsonResult
                        )
                        const details = JSON.parse(jsonResult)

                        // Get confidence
                        if (details?.NBest?.[0]?.Confidence) {
                            totalConfidence += details.NBest[0].Confidence
                            recognitionCount++
                        }

                        // Get pronunciation assessment from NBest
                        const nBest = details?.NBest?.[0]
                        if (nBest?.PronunciationAssessment) {
                            const pa = nBest.PronunciationAssessment

                            totalAccuracy += pa.AccuracyScore || 0
                            totalFluency += pa.FluencyScore || 0
                            totalProsody += pa.ProsodyScore || 0
                            totalPronScore += pa.PronScore || 0
                            metricsCount++

                            // Extract word-level details with syllables and phonemes
                            if (nBest.Words) {
                                for (const word of nBest.Words) {
                                    const wordAssessment = word.PronunciationAssessment || {}

                                    // Extract syllables if available
                                    const syllables = word.Syllables?.map(syl => ({
                                        syllable: syl.Syllable,
                                        accuracyScore: syl.PronunciationAssessment?.AccuracyScore || 0,
                                        offset: syl.Offset,
                                        duration: syl.Duration
                                    })) || []

                                    // Extract phonemes if available
                                    const phonemes = word.Phonemes?.map(ph => ({
                                        phoneme: ph.Phoneme,
                                        accuracyScore: ph.PronunciationAssessment?.AccuracyScore || 0,
                                        offset: ph.Offset,
                                        duration: ph.Duration
                                    })) || []

                                    allWords.push({
                                        word: word.Word,
                                        accuracyScore: wordAssessment.AccuracyScore || 0,
                                        errorType: wordAssessment.ErrorType || 'None',
                                        syllables: syllables,
                                        phonemes: phonemes,
                                        offset: word.Offset,
                                        duration: word.Duration
                                    })
                                }
                            }
                        }
                    } catch (err) {
                    }
                }
            } else if (e.result.reason === sdk.ResultReason.NoMatch) {
            }
        }

        // Handle errors
        recognizer.canceled = (s, e) => {
            if (e.reason === sdk.CancellationReason.Error) {
                recognizer.stopContinuousRecognitionAsync()
                reject(new Error(e.errorDetails))
            } else if (e.reason === sdk.CancellationReason.EndOfStream) {
            }
        }

        // Handle session stopped (recognition complete)
        recognizer.sessionStopped = (s, e) => {
            recognizer.stopContinuousRecognitionAsync()

            const fullText = transcriptions.join(' ').trim()
            const avgConfidence = recognitionCount > 0
                ? totalConfidence / recognitionCount
                : 0.9

            // Calculate average pronunciation metrics
            const avgAccuracy = metricsCount > 0 ? Math.round(totalAccuracy / metricsCount) : 0
            const avgFluency = metricsCount > 0 ? Math.round(totalFluency / metricsCount) : 0
            const avgProsody = metricsCount > 0 ? Math.round(totalProsody / metricsCount) : 0
            const avgPronScore = metricsCount > 0 ? Math.round(totalPronScore / metricsCount) : 0

            // Filter problematic words (errorType !== 'None' or low accuracy)
            const problematicWords = allWords.filter(w =>
                w.errorType !== 'None' || w.accuracyScore < 60
            )

            // ========== PAUSE DETECTION (4+ seconds threshold) ==========
            const PAUSE_THRESHOLD_SECONDS = 4  // Minimum pause to flag as abnormal
            const longPauses = []

            for (let i = 1; i < allWords.length; i++) {
                const prevWord = allWords[i - 1]
                const currWord = allWords[i]

                // Check if both words have timing data
                if (prevWord.offset !== undefined && currWord.offset !== undefined && prevWord.duration !== undefined) {
                    const prevEnd = prevWord.offset + prevWord.duration
                    const gapTicks = currWord.offset - prevEnd
                    const gapSeconds = gapTicks / 10000000  // Convert 100-nanosecond ticks to seconds

                    if (gapSeconds >= PAUSE_THRESHOLD_SECONDS) {
                        longPauses.push({
                            afterWord: prevWord.word,
                            beforeWord: currWord.word,
                            durationSeconds: parseFloat(gapSeconds.toFixed(1)),
                            position: i  // Word index where pause occurred
                        })
                    }
                }
            }

            // Calculate total silence time (all pauses over threshold)
            const totalLongPauseTime = longPauses.reduce((sum, p) => sum + p.durationSeconds, 0)

            resolve({
                text: fullText || '[No speech detected]',
                confidence: avgConfidence,
                pronunciationAssessment: {
                    accuracyScore: avgAccuracy,
                    fluencyScore: avgFluency,
                    prosodyScore: avgProsody,
                    pronunciationScore: avgPronScore,
                    totalWords: allWords.length,
                    errorCount: problematicWords.length,
                    problematicWords: problematicWords,
                    allWords: allWords,
                    longPauses: longPauses,
                    longPauseCount: longPauses.length,
                    totalLongPauseTime: parseFloat(totalLongPauseTime.toFixed(1))
                },
                error: null
            })

            // ========== DETAILED AZURE PRONUNCIATION LOG ==========



            if (allWords.length > 0) {
                allWords.forEach(w => {
                    const wordPadded = w.word.padEnd(22)
                    const scorePadded = String(w.accuracyScore).padStart(3)
                    const errorIcon = w.errorType !== 'None' ? '❌' : '✅'
                })
            }

            if (problematicWords.length > 0) {
                problematicWords.forEach((w, i) => {

                    // Show syllables if available
                    if (w.syllables && w.syllables.length > 0) {
                        const syllableStr = w.syllables
                            .map(s => `"${s.syllable}"(${s.accuracyScore})`)
                            .join(' - ')
                    }

                    // Show weak phonemes if available
                    if (w.phonemes && w.phonemes.length > 0) {
                        const weakPhonemes = w.phonemes.filter(p => p.accuracyScore < 60)
                        if (weakPhonemes.length > 0) {
                            const phonemeStr = weakPhonemes
                                .map(p => `"${p.phoneme}"(${p.accuracyScore})`)
                                .join(', ')
                        }
                    }

                    // Explain error type
                    const explanations = {
                        'Mispronunciation': 'הגייה שגויה של המילה',
                        'UnexpectedBreak': 'הפסקה לא צפויה באמצע המילה',
                        'MissingBreak': 'חסרה הפסקה בין מילים',
                        'Monotone': 'דיבור חד-גוני, חסר אינטונציה'
                    }
                    if (explanations[w.errorType]) {
                    }
                })
            }

            // Log long pauses if any detected
            if (longPauses.length > 0) {
                longPauses.forEach((pause, i) => {
                })
            }


            resolve({
                text: fullText || '[No speech detected]',
                confidence: avgConfidence,
                pronunciationAssessment: {
                    accuracyScore: avgAccuracy,
                    fluencyScore: avgFluency,
                    prosodyScore: avgProsody,
                    pronunciationScore: avgPronScore,
                    totalWords: allWords.length,
                    errorCount: problematicWords.length,
                    problematicWords: problematicWords,
                    allWords: allWords,  // Keep all words for detailed analysis
                    // Pause detection data
                    longPauses: longPauses,
                    longPauseCount: longPauses.length,
                    totalLongPauseTime: parseFloat(totalLongPauseTime.toFixed(1))
                },
                error: null
            })
        }

        // Start continuous recognition
        recognizer.startContinuousRecognitionAsync(
            () => {
            },
            (err) => {
                reject(new Error(err))
            }
        )
    })
}

/**
 * Convert any audio buffer to WAV format for SDK
 * @param {ArrayBuffer} inputBuffer - Original audio data
 * @returns {Promise<ArrayBuffer>} - WAV audio data
 */
async function convertToWavBuffer(inputBuffer) {
    // Create audio context for decoding and resampling
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    try {
        // Decode the audio
        const audioBuffer = await audioContext.decodeAudioData(inputBuffer.slice(0))


        // Convert to WAV format (16kHz mono, 16-bit PCM)
        const wavBuffer = audioBufferToWav(audioBuffer)

        await audioContext.close()

        return wavBuffer
    } catch (error) {
        await audioContext.close()
        throw error
    }
}

/**
 * Convert AudioBuffer to WAV ArrayBuffer
 * @param {AudioBuffer} audioBuffer
 * @returns {ArrayBuffer}
 */
function audioBufferToWav(audioBuffer) {
    const numChannels = 1 // Mono for speech
    const sampleRate = 16000 // 16kHz is optimal for speech recognition
    const bitsPerSample = 16

    // Get audio data (first channel)
    const inputData = audioBuffer.getChannelData(0)
    const inputSampleRate = audioBuffer.sampleRate

    // Resample to 16kHz
    const outputLength = Math.floor(inputData.length * sampleRate / inputSampleRate)
    const outputData = new Float32Array(outputLength)

    // Linear resampling
    for (let i = 0; i < outputLength; i++) {
        const srcIndex = i * inputSampleRate / sampleRate
        const srcIndexFloor = Math.floor(srcIndex)
        const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1)
        const t = srcIndex - srcIndexFloor
        outputData[i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t
    }

    // Convert to 16-bit PCM
    const pcmData = new Int16Array(outputLength)
    for (let i = 0; i < outputLength; i++) {
        const s = Math.max(-1, Math.min(1, outputData[i]))
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }

    // Create WAV file
    const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2)
    const view = new DataView(wavBuffer)

    // WAV header
    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + pcmData.length * 2, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true) // Subchunk1Size
    view.setUint16(20, 1, true) // AudioFormat (PCM)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true) // ByteRate
    view.setUint16(32, numChannels * bitsPerSample / 8, true) // BlockAlign
    view.setUint16(34, bitsPerSample, true)
    writeString(view, 36, 'data')
    view.setUint32(40, pcmData.length * 2, true)

    // Write PCM data
    const pcmView = new Int16Array(wavBuffer, 44)
    pcmView.set(pcmData)

    return wavBuffer
}

/**
 * Helper to write string to DataView
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
    }
}

/**
 * Transcribe multiple audio files
 * @param {Array<{questionId: string, storagePath: string}>} recordings
 * @returns {Promise<Map<string, {text: string, confidence: number}>>}
 */
export async function transcribeMultiple(recordings) {
    const results = new Map()

    // Process sequentially to avoid overloading the SDK
    for (const recording of recordings) {
        if (!recording.storagePath) {
            results.set(recording.questionId, { text: null, confidence: 0, error: 'No audio path' })
            continue
        }

        const result = await transcribeAudio(recording.storagePath)
        results.set(recording.questionId, result)

        // Small delay between transcriptions
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    return results
}

/**
 * Azure Speech-to-Text Service
 * Uses Microsoft Cognitive Services Speech SDK for continuous recognition
 * Supports audio of any length
 */

import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import { getRecordingUrl } from './storageService'

// Azure Speech configuration from environment
const AZURE_SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY
const AZURE_SPEECH_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION

/**
 * Check if Azure Speech is configured
 */
export function isAzureSpeechConfigured() {
    return !!(AZURE_SPEECH_KEY && AZURE_SPEECH_REGION)
}

/**
 * Transcribe audio from a storage path using Speech SDK
 * Supports audio of ANY length
 * @param {string} storagePath - The path to the audio file in Supabase storage
 * @returns {Promise<{text: string, confidence: number}>} - Transcription result
 */
export async function transcribeAudio(storagePath) {
    if (!isAzureSpeechConfigured()) {
        console.warn('⚠️ Azure Speech not configured, skipping transcription')
        return { text: null, confidence: 0, error: 'Azure Speech not configured' }
    }

    console.log('🎤 Starting SDK transcription for:', storagePath)

    try {
        // Step 1: Get signed URL for the audio file
        const audioUrl = await getRecordingUrl(storagePath)
        if (!audioUrl) {
            throw new Error('Could not get audio URL from storage')
        }

        console.log('📥 Fetching audio from:', audioUrl)

        // Step 2: Download the audio file
        const audioResponse = await fetch(audioUrl)
        if (!audioResponse.ok) {
            throw new Error(`Failed to download audio: ${audioResponse.status}`)
        }

        const audioBlob = await audioResponse.blob()
        console.log('📦 Audio downloaded, size:', audioBlob.size, 'bytes')

        // Step 3: Convert to ArrayBuffer for SDK
        const arrayBuffer = await audioBlob.arrayBuffer()

        // Step 4: Convert to WAV format (SDK works best with WAV)
        const wavBuffer = await convertToWavBuffer(arrayBuffer)
        console.log('🔄 Converted to WAV, size:', wavBuffer.byteLength, 'bytes')

        // Step 5: Use Speech SDK for transcription
        const result = await transcribeWithSdk(wavBuffer)

        return result

    } catch (error) {
        console.error('❌ Transcription error:', error)
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
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting Azure Speech SDK transcription with Pronunciation Assessment...')

        // Create speech config
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            AZURE_SPEECH_KEY,
            AZURE_SPEECH_REGION
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

        console.log('🎯 Pronunciation Assessment enabled with prosody')

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
                    console.log('📝 Recognized:', text)
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
                            console.log('🎯 Pronunciation scores:', {
                                accuracy: pa.AccuracyScore,
                                fluency: pa.FluencyScore,
                                prosody: pa.ProsodyScore,
                                pron: pa.PronScore
                            })

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
                        console.warn('⚠️ Could not parse pronunciation assessment:', err.message)
                    }
                }
            } else if (e.result.reason === sdk.ResultReason.NoMatch) {
                console.log('⚠️ No speech detected in segment')
            }
        }

        // Handle errors
        recognizer.canceled = (s, e) => {
            if (e.reason === sdk.CancellationReason.Error) {
                console.error('❌ Recognition error:', e.errorDetails)
                recognizer.stopContinuousRecognitionAsync()
                reject(new Error(e.errorDetails))
            } else if (e.reason === sdk.CancellationReason.EndOfStream) {
                console.log('📌 End of audio stream')
            }
        }

        // Handle session stopped (recognition complete)
        recognizer.sessionStopped = (s, e) => {
            console.log('✅ Recognition session completed')
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

            console.log('📊 Full transcript length:', fullText.length, 'chars')
            console.log('📊 Average confidence:', avgConfidence)
            console.log('📊 Pronunciation Assessment:', {
                accuracy: avgAccuracy,
                fluency: avgFluency,
                prosody: avgProsody,
                totalWords: allWords.length,
                problematicWords: problematicWords.length,
                longPauses: longPauses.length,
                totalLongPauseTime: totalLongPauseTime.toFixed(1) + 's'
            })

            // ========== DETAILED AZURE PRONUNCIATION LOG ==========
            console.log('\n' + '='.repeat(60))
            console.log('🎤 AZURE PRONUNCIATION ASSESSMENT - FULL REPORT')
            console.log('='.repeat(60))

            console.log('\n📈 OVERALL SCORES:')
            console.log(`   • Accuracy Score:      ${avgAccuracy}/100`)
            console.log(`   • Fluency Score:       ${avgFluency}/100`)
            console.log(`   • Prosody Score:       ${avgProsody}/100`)
            console.log(`   • Pronunciation Score: ${avgPronScore}/100`)

            console.log('\n📊 STATISTICS:')
            console.log(`   • Total words:         ${allWords.length}`)
            console.log(`   • Problematic words:   ${problematicWords.length}`)
            console.log(`   • Error rate:          ${allWords.length > 0 ? ((problematicWords.length / allWords.length) * 100).toFixed(1) : 0}%`)

            if (allWords.length > 0) {
                console.log('\n📝 ALL WORDS WITH ACCURACY SCORES:')
                console.log('   Word                    | AccuracyScore | Error Type')
                console.log('   ' + '-'.repeat(55))
                allWords.forEach(w => {
                    const wordPadded = w.word.padEnd(22)
                    const scorePadded = String(w.accuracyScore).padStart(3)
                    const errorIcon = w.errorType !== 'None' ? '❌' : '✅'
                    console.log(`   ${errorIcon} ${wordPadded} | ${scorePadded}  | ${w.errorType}`)
                })
            }

            if (problematicWords.length > 0) {
                console.log('\n⚠️ PROBLEMATIC WORDS DETAIL:')
                problematicWords.forEach((w, i) => {
                    console.log(`   ${i + 1}. "${w.word}"`)
                    console.log(`      • Accuracy Score: ${w.accuracyScore}/100`)
                    console.log(`      • Error Type: ${w.errorType}`)

                    // Show syllables if available
                    if (w.syllables && w.syllables.length > 0) {
                        const syllableStr = w.syllables
                            .map(s => `"${s.syllable}"(${s.accuracyScore})`)
                            .join(' - ')
                        console.log(`      • Syllables: ${syllableStr}`)
                    }

                    // Show weak phonemes if available
                    if (w.phonemes && w.phonemes.length > 0) {
                        const weakPhonemes = w.phonemes.filter(p => p.accuracyScore < 60)
                        if (weakPhonemes.length > 0) {
                            const phonemeStr = weakPhonemes
                                .map(p => `"${p.phoneme}"(${p.accuracyScore})`)
                                .join(', ')
                            console.log(`      • Weak Phonemes: ${phonemeStr}`)
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
                        console.log(`      • הסבר: ${explanations[w.errorType]}`)
                    }
                })
            }

            // Log long pauses if any detected
            if (longPauses.length > 0) {
                console.log('\n⏸️ LONG PAUSES DETECTED (4+ seconds):')
                longPauses.forEach((pause, i) => {
                    console.log(`   ${i + 1}. ${pause.durationSeconds}s pause`)
                    console.log(`      • After: "${pause.afterWord}"`)
                    console.log(`      • Before: "${pause.beforeWord}"`)
                })
                console.log(`   📊 Total long pause time: ${totalLongPauseTime.toFixed(1)} seconds`)
            }

            console.log('\n' + '='.repeat(60) + '\n')

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
        console.log('▶️ Starting continuous recognition with pronunciation assessment...')
        recognizer.startContinuousRecognitionAsync(
            () => {
                console.log('🎙️ Recognition started, processing audio...')
            },
            (err) => {
                console.error('❌ Failed to start recognition:', err)
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

        console.log('⏱️ Audio duration:', audioBuffer.duration.toFixed(1), 'seconds')
        console.log('🎵 Sample rate:', audioBuffer.sampleRate, 'Hz')

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

        console.log(`🎤 Transcribing question ${recording.questionId}...`)
        const result = await transcribeAudio(recording.storagePath)
        results.set(recording.questionId, result)

        // Small delay between transcriptions
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    return results
}

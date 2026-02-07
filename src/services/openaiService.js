/**
 * OpenAI Service - Calls Supabase Edge Functions for secure AI scoring
 * All sensitive API calls are now handled server-side
 * Supports Topic Development, Vocabulary, Language, and Fluency scoring and feedback
 * Module C uses specialized assistants that include video transcript context
 */

import { supabase } from '../lib/supabase'

/**
 * Check if Supabase is configured (required for OpenAI via Edge Functions)
 */
export function isOpenAIConfigured() {
    return !!supabase
}

/**
 * Check if Feedback Assistant is configured
 */
export function isFeedbackAssistantConfigured() {
    return !!supabase
}

/**
 * Check if Vocabulary assistants are configured
 */
export function isVocabularyConfigured() {
    return !!supabase
}

/**
 * Check if Language assistants are configured
 */
export function isLanguageConfigured() {
    return !!supabase
}

/**
 * Check if Fluency assistants are configured
 */
export function isFluencyConfigured() {
    return !!supabase
}

/**
 * Check if Module C Topic Development assistants are configured
 */
export function isModuleCTopicConfigured() {
    return !!supabase
}

/**
 * Helper to call the OpenAI scoring Edge Function
 */
async function callOpenAIFunction(action, params) {
    console.log(`🤖 Calling Edge Function: ${action}`)

    const { data, error } = await supabase.functions.invoke('openai-scoring', {
        body: { action, ...params }
    })

    if (error) {
        console.error(`❌ Edge Function error (${action}):`, error)
        throw new Error(error.message || 'Edge Function error')
    }

    if (data.error) {
        console.error(`❌ OpenAI error (${action}):`, data.error)
        throw new Error(data.error)
    }

    console.log(`✅ ${action} completed`)
    return data
}

/**
 * Score Topic Development using the Assistant
 * @param {string} question - The question asked
 * @param {string} transcript - The student's transcribed answer
 * @returns {Promise<{range: string, score: number, justification: string}>}
 */
export async function scoreTopicDevelopment(question, transcript) {
    if (!isOpenAIConfigured()) {
        console.warn('Supabase not configured, returning mock score')
        return {
            range: '55-75',
            score: 65,
            justification: 'ציון דמו - Supabase לא מוגדר'
        }
    }

    try {
        console.log('🤖 Starting Topic Development analysis...')
        const result = await callOpenAIFunction('scoreTopicDevelopment', { question, transcript })

        console.log('🎯 Parsed result:', result)
        return {
            range: result.range,
            score: result.score,
            justification: result.justification
        }
    } catch (error) {
        console.error('❌ OpenAI scoring error:', error)
        throw error
    }
}

/**
 * Get detailed feedback for Topic Development using the Feedback Assistant
 * @param {object} params - Parameters for feedback
 * @param {string} params.question - The question that was asked
 * @param {number} params.score - The score from the scoring assistant
 * @param {string} params.range - The range from the scoring assistant (e.g., "55-75")
 * @param {string} params.transcript - The student's transcribed answer
 * @returns {Promise<{strengths: string[], improvements: string[], generalFeedback: string}>}
 */
export async function getTopicDevelopmentFeedback({ question, score, range, transcript }) {
    if (!isFeedbackAssistantConfigured()) {
        console.warn('Supabase not configured, returning mock feedback')
        return {
            strengths: ['פידבק דמו - Supabase לא מוגדר'],
            improvements: [],
            generalFeedback: ''
        }
    }

    try {
        console.log('📝 Starting Topic Development feedback analysis...')
        const result = await callOpenAIFunction('getTopicDevelopmentFeedback', {
            question, score, range, transcript
        })

        console.log('🎯 Parsed feedback:', result)
        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || ''
        }
    } catch (error) {
        console.error('❌ OpenAI feedback error:', error)
        throw error
    }
}

/**
 * Full Topic Development analysis: Score + Detailed Feedback
 */
export async function scoreAndFeedbackTopicDevelopment(question, transcript) {
    // Step 1: Get the score
    console.log('🔄 Step 1: Getting Topic Development score...')
    const scoreResult = await scoreTopicDevelopment(question, transcript)

    console.log(`✅ Score received: ${scoreResult.score} (Range: ${scoreResult.range})`)

    // Step 2: Get detailed feedback based on the score
    console.log('🔄 Step 2: Getting detailed feedback...')
    let feedbackResult
    try {
        feedbackResult = await getTopicDevelopmentFeedback({
            question,
            score: scoreResult.score,
            range: scoreResult.range,
            transcript
        })
        console.log('✅ Feedback received')
    } catch (error) {
        console.error('Failed to get feedback, using empty arrays:', error)
        feedbackResult = {
            preservationPoints: [],
            improvementPoints: []
        }
    }

    // Combine results
    return {
        score: scoreResult.score,
        range: scoreResult.range,
        justification: scoreResult.justification,
        preservationPoints: feedbackResult.preservationPoints,
        improvementPoints: feedbackResult.improvementPoints
    }
}

// ============================================
// MODULE C TOPIC DEVELOPMENT (WITH VIDEO TRANSCRIPT)
// ============================================

/**
 * Score Topic Development for Module C questions using specialized Assistant
 */
export async function scoreModuleCTopicDevelopment({ question, studentTranscript, videoTranscript }) {
    if (!isModuleCTopicConfigured()) {
        console.warn('Module C Topic Assistant not configured, falling back to regular Topic Development')
        return scoreTopicDevelopment(question, studentTranscript)
    }

    try {
        console.log('🎬 Starting Module C Topic Development analysis...')
        console.log(`   Video transcript length: ${videoTranscript?.length || 0} chars`)

        const result = await callOpenAIFunction('scoreModuleCTopicDevelopment', {
            question, studentTranscript, videoTranscript
        })

        console.log('🎯 Module C parsed result:', result)
        return {
            range: result.range,
            score: result.score,
            justification: result.justification
        }
    } catch (error) {
        console.error('❌ Module C Topic Development scoring error:', error)
        console.log('⚠️ Falling back to regular Topic Development scoring')
        return scoreTopicDevelopment(question, studentTranscript)
    }
}

/**
 * Get detailed feedback for Module C Topic Development
 */
export async function getModuleCTopicFeedback({ question, score, range, studentTranscript, videoTranscript }) {
    try {
        console.log('📝 Starting Module C Topic Development feedback analysis...')

        const result = await callOpenAIFunction('getModuleCTopicFeedback', {
            question, score, studentTranscript, videoTranscript
        })

        console.log('🎯 Module C Feedback parsed:', result)
        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || ''
        }
    } catch (error) {
        console.error('❌ Module C Topic feedback error:', error)
        return getTopicDevelopmentFeedback({ question, score, range, transcript: studentTranscript })
    }
}

// ============================================
// VOCABULARY SCORING AND FEEDBACK
// ============================================

/**
 * Score Vocabulary criterion
 */
export async function scoreVocabulary(question, transcript) {
    if (!isVocabularyConfigured()) {
        console.warn('Vocabulary Assistant not configured, returning mock score')
        return {
            range: '55-75',
            score: 65,
            justification: 'ציון דמו - Vocabulary Assistant לא מוגדר'
        }
    }

    try {
        console.log('🤖 Starting Vocabulary analysis...')
        const result = await callOpenAIFunction('scoreVocabulary', { question, transcript })

        console.log('🎯 Vocabulary parsed result:', result)
        return {
            range: result.range || '55-75',
            score: result.score || 65,
            justification: result.justification || 'לא התקבלה הנמקה'
        }
    } catch (error) {
        console.error('❌ Vocabulary scoring error:', error)
        throw error
    }
}

/**
 * Get detailed feedback for Vocabulary
 */
export async function getVocabularyFeedback({ question, score, range, transcript }) {
    try {
        console.log('📝 Starting Vocabulary feedback analysis...')
        const result = await callOpenAIFunction('getVocabularyFeedback', {
            question, score, transcript
        })

        console.log('🎯 Vocabulary feedback parsed:', result)
        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || ''
        }
    } catch (error) {
        console.error('❌ Vocabulary feedback error:', error)
        throw error
    }
}

// ============================================
// LANGUAGE (GRAMMAR) SCORING AND FEEDBACK
// ============================================

/**
 * Score Language (Grammar) criterion
 */
export async function scoreLanguage(question, transcript) {
    if (!isLanguageConfigured()) {
        console.warn('Language Assistant not configured, returning mock score')
        return {
            range: '55-75',
            score: 65,
            justification: 'ציון דמו - Language Assistant לא מוגדר'
        }
    }

    try {
        console.log('🤖 Starting Language analysis...')
        const result = await callOpenAIFunction('scoreLanguage', { question, transcript })

        console.log('🎯 Language parsed result:', result)
        return {
            range: result.range || '55-75',
            score: result.score || 65,
            justification: result.justification || 'לא התקבלה הנמקה'
        }
    } catch (error) {
        console.error('❌ Language scoring error:', error)
        throw error
    }
}

/**
 * Get detailed feedback for Language
 */
export async function getLanguageFeedback({ question, score, range, transcript }) {
    try {
        console.log('📝 Starting Language feedback analysis...')
        const result = await callOpenAIFunction('getLanguageFeedback', {
            question, score, transcript
        })

        console.log('🎯 Language feedback parsed:', result)
        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || ''
        }
    } catch (error) {
        console.error('❌ Language feedback error:', error)
        throw error
    }
}

// ============================================
// FLUENCY SCORING (4TH CRITERION - WITH AZURE METRICS)
// ============================================

/**
 * Score Fluency criterion with Azure Pronunciation Metrics
 */
export async function scoreFluency(question, transcript, pronunciationMetrics) {
    if (!isFluencyConfigured()) {
        console.warn('Fluency Assistant not configured, returning mock score')
        return {
            range: '55-75',
            score: 65,
            justification: 'ציון דמו - Fluency Assistant לא מוגדר'
        }
    }

    if (!pronunciationMetrics) {
        console.warn('No pronunciation metrics provided, returning mock score')
        return {
            range: '55-75',
            score: 65,
            justification: 'לא התקבלו נתוני הגייה מ-Azure'
        }
    }

    try {
        console.log('🎯 Starting Fluency analysis with Azure metrics...')
        const result = await callOpenAIFunction('scoreFluency', {
            question, transcript, pronunciationMetrics
        })

        console.log('🎯 Fluency parsed result:', result)
        return {
            range: result.range || '55-75',
            score: result.score || 65,
            justification: result.justification || 'לא התקבלה הנמקה'
        }
    } catch (error) {
        console.error('❌ Fluency scoring error:', error)
        throw error
    }
}

/**
 * Get detailed feedback for Fluency
 */
export async function getFluencyFeedback({ question, score, range, transcript, pronunciationMetrics }) {
    try {
        console.log('📝 Starting Fluency feedback analysis...')
        const result = await callOpenAIFunction('getFluencyFeedback', {
            question, score, range, transcript, pronunciationMetrics
        })

        console.log('🎯 Fluency feedback parsed:', result)
        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || '',
            problematicWords: pronunciationMetrics?.problematicWords || []
        }
    } catch (error) {
        console.error('❌ Fluency feedback error:', error)
        throw error
    }
}

// ============================================
// FULL ANSWER ANALYSIS
// ============================================

/**
 * Analyze a full practice with all criteria
 */
export async function analyzeAnswer(question, transcript, pronunciationMetrics = null) {
    console.log('📊 Starting full answer analysis...')
    console.log('📊 Pronunciation metrics available:', !!pronunciationMetrics)

    // Check if no speech was detected - return all zeros
    const noSpeechIndicators = [
        '[No speech detected]',
        'No speech detected',
        '[לא זוהה דיבור]',
        'לא זוהה דיבור'
    ]

    const isNoSpeech = !transcript ||
        transcript.trim() === '' ||
        noSpeechIndicators.some(indicator =>
            transcript.toLowerCase().includes(indicator.toLowerCase())
        )

    if (isNoSpeech) {
        console.log('⚠️ No speech detected - returning zero scores for all criteria')
        return {
            topicDevelopment: {
                score: 0,
                weight: 50,
                range: '0-0',
                feedback: 'לא זוהה דיבור בהקלטה',
                strengths: [],
                improvements: ['יש להקליט תשובה מדוברת לשאלה'],
                generalFeedback: 'לא זוהה דיבור בהקלטה. אנא נסה להקליט שוב ולדבר בקול ברור.'
            },
            fluency: {
                score: 0,
                weight: 15,
                range: '0-0',
                feedback: 'לא זוהה דיבור בהקלטה',
                strengths: [],
                improvements: [],
                generalFeedback: ''
            },
            vocabulary: {
                score: 0,
                weight: 20,
                range: '0-0',
                feedback: 'לא זוהה דיבור בהקלטה',
                strengths: [],
                improvements: [],
                generalFeedback: ''
            },
            grammar: {
                score: 0,
                weight: 15,
                range: '0-0',
                feedback: 'לא זוהה דיבור בהקלטה',
                strengths: [],
                improvements: [],
                generalFeedback: ''
            },
            totalScore: 0,
            preservationPoints: [],
            improvementPoints: ['יש להקליט תשובה מדוברת לשאלה'],
            strengths: [],
            improvements: ['יש להקליט תשובה מדוברת לשאלה'],
            noSpeechDetected: true
        }
    }

    // Run all scoring in parallel for better performance
    const [topicDevelopmentResult, vocabularyResult, languageResult, fluencyResult] = await Promise.all([
        // Topic Development
        scoreTopicDevelopment(question, transcript).catch(error => {
            console.error('Failed to get Topic Development score:', error)
            return { range: '55-75', score: 60, justification: 'Error analyzing Topic Development' }
        }),
        // Vocabulary
        scoreVocabulary(question, transcript).catch(error => {
            console.error('Failed to get Vocabulary score:', error)
            return { range: '55-75', score: 65, justification: 'Error analyzing Vocabulary' }
        }),
        // Language
        scoreLanguage(question, transcript).catch(error => {
            console.error('Failed to get Language score:', error)
            return { range: '55-75', score: 65, justification: 'Error analyzing Language' }
        }),
        // Fluency/Delivery - only if pronunciation metrics available
        pronunciationMetrics
            ? scoreFluency(question, transcript, pronunciationMetrics).catch(error => {
                console.error('Failed to get Fluency score:', error)
                return { range: '55-75', score: 65, justification: 'Error analyzing Fluency' }
            })
            : Promise.resolve({ range: '55-75', score: 65, justification: 'No pronunciation metrics available' })
    ])

    console.log('✅ All scoring completed')
    console.log(`   Topic Development: ${topicDevelopmentResult.score}`)
    console.log(`   Fluency: ${fluencyResult.score}`)
    console.log(`   Vocabulary: ${vocabularyResult.score}`)
    console.log(`   Language: ${languageResult.score}`)

    // Get detailed feedback from all Feedback Assistants (in parallel)
    console.log('🔄 Getting detailed feedback from all Feedback Assistants...')
    const [topicFeedback, vocabularyFeedback, languageFeedback, fluencyFeedback] = await Promise.all([
        // Topic Development Feedback
        getTopicDevelopmentFeedback({
            question,
            score: topicDevelopmentResult.score,
            range: topicDevelopmentResult.range,
            transcript
        }).catch(error => {
            console.error('Failed to get Topic Development feedback:', error)
            return { preservationPoints: [], improvementPoints: [] }
        }),
        // Vocabulary Feedback
        getVocabularyFeedback({
            question,
            score: vocabularyResult.score,
            range: vocabularyResult.range,
            transcript
        }).catch(error => {
            console.error('Failed to get Vocabulary feedback:', error)
            return { strengths: [], improvements: [], generalFeedback: '' }
        }),
        // Language Feedback
        getLanguageFeedback({
            question,
            score: languageResult.score,
            range: languageResult.range,
            transcript
        }).catch(error => {
            console.error('Failed to get Language feedback:', error)
            return { strengths: [], improvements: [], generalFeedback: '' }
        }),
        // Fluency/Delivery Feedback - only if pronunciation metrics available
        pronunciationMetrics
            ? getFluencyFeedback({
                question,
                score: fluencyResult.score,
                range: fluencyResult.range,
                transcript,
                pronunciationMetrics
            }).catch(error => {
                console.error('Failed to get Fluency feedback:', error)
                return { strengths: [], improvements: [], generalFeedback: '' }
            })
            : Promise.resolve({ strengths: [], improvements: [], generalFeedback: 'No pronunciation metrics available' })
    ])

    console.log('✅ All feedback received')

    // Calculate weighted total score
    // Topic Development: 50%, Delivery: 15%, Vocabulary: 20%, Language: 15%
    const totalScore = Math.round(
        topicDevelopmentResult.score * 0.50 +
        fluencyResult.score * 0.15 +
        vocabularyResult.score * 0.20 +
        languageResult.score * 0.15
    )

    // Aggregate all strengths/improvements for top-level access (including Fluency)
    const allStrengths = [
        ...(topicFeedback.strengths || []),
        ...(vocabularyFeedback.strengths || []),
        ...(languageFeedback.strengths || []),
        ...(fluencyFeedback.strengths || [])
    ]
    const allImprovements = [
        ...(topicFeedback.improvements || []),
        ...(vocabularyFeedback.improvements || []),
        ...(languageFeedback.improvements || []),
        ...(fluencyFeedback.improvements || [])
    ]

    return {
        topicDevelopment: {
            score: topicDevelopmentResult.score,
            weight: 50,
            range: topicDevelopmentResult.range,
            feedback: topicDevelopmentResult.justification,
            strengths: topicFeedback.strengths || [],
            improvements: topicFeedback.improvements || [],
            generalFeedback: topicFeedback.generalFeedback || ''
        },
        fluency: {
            score: fluencyResult.score,
            weight: 15,
            range: fluencyResult.range,
            feedback: fluencyResult.justification,
            strengths: fluencyFeedback.strengths || [],
            improvements: fluencyFeedback.improvements || [],
            generalFeedback: fluencyFeedback.generalFeedback || ''
        },
        vocabulary: {
            score: vocabularyResult.score,
            weight: 20,
            range: vocabularyResult.range,
            feedback: vocabularyResult.justification,
            strengths: vocabularyFeedback.strengths || [],
            improvements: vocabularyFeedback.improvements || [],
            generalFeedback: vocabularyFeedback.generalFeedback || ''
        },
        grammar: {
            score: languageResult.score,
            weight: 15,
            range: languageResult.range,
            feedback: languageResult.justification,
            strengths: languageFeedback.strengths || [],
            improvements: languageFeedback.improvements || [],
            generalFeedback: languageFeedback.generalFeedback || ''
        },
        totalScore,
        // Top-level aggregated points (for backward compatibility)
        preservationPoints: allStrengths,
        improvementPoints: allImprovements,
        // New unified naming
        strengths: allStrengths,
        improvements: allImprovements
    }
}

/**
 * Analyze a Module C practice answer with video transcript context
 */
export async function analyzeAnswerModuleC({ question, studentTranscript, videoTranscript, pronunciationMetrics = null }) {
    console.log('📊 Starting Module C answer analysis...')
    console.log(`   Video transcript available: ${videoTranscript ? 'Yes' : 'No'} (${videoTranscript?.length || 0} chars)`)
    console.log('📊 Pronunciation metrics available:', !!pronunciationMetrics)

    // Check if no speech was detected - return all zeros
    const noSpeechIndicators = [
        '[No speech detected]',
        'No speech detected',
        '[לא זוהה דיבור]',
        'לא זוהה דיבור'
    ]

    const isNoSpeech = !studentTranscript ||
        studentTranscript.trim() === '' ||
        noSpeechIndicators.some(indicator =>
            studentTranscript.toLowerCase().includes(indicator.toLowerCase())
        )

    if (isNoSpeech) {
        console.log('⚠️ No speech detected in Module C - returning zero scores for all criteria')
        return {
            topicDevelopment: {
                score: 0,
                weight: 50,
                range: '0-0',
                feedback: 'לא זוהה דיבור בהקלטה',
                strengths: [],
                improvements: ['יש להקליט תשובה מדוברת לשאלה'],
                generalFeedback: 'לא זוהה דיבור בהקלטה. אנא נסה להקליט שוב ולדבר בקול ברור.'
            },
            fluency: {
                score: 0,
                weight: 15,
                range: '0-0',
                feedback: 'לא זוהה דיבור בהקלטה',
                strengths: [],
                improvements: [],
                generalFeedback: ''
            },
            vocabulary: {
                score: 0,
                weight: 20,
                range: '0-0',
                feedback: 'לא זוהה דיבור בהקלטה',
                strengths: [],
                improvements: [],
                generalFeedback: ''
            },
            grammar: {
                score: 0,
                weight: 15,
                range: '0-0',
                feedback: 'לא זוהה דיבור בהקלטה',
                strengths: [],
                improvements: [],
                generalFeedback: ''
            },
            totalScore: 0,
            preservationPoints: [],
            improvementPoints: ['יש להקליט תשובה מדוברת לשאלה'],
            strengths: [],
            improvements: ['יש להקליט תשובה מדוברת לשאלה'],
            noSpeechDetected: true
        }
    }

    // Run all scoring in parallel for better performance
    const [topicDevelopmentResult, vocabularyResult, languageResult, fluencyResult] = await Promise.all([
        // Topic Development - Uses Module C specific assistant with video transcript
        scoreModuleCTopicDevelopment({
            question,
            studentTranscript,
            videoTranscript
        }).catch(error => {
            console.error('Failed to get Module C Topic Development score:', error)
            return { range: '55-75', score: 60, justification: 'שגיאה בניתוח Topic Development' }
        }),
        // Vocabulary - Regular assistant
        scoreVocabulary(question, studentTranscript).catch(error => {
            console.error('Failed to get Vocabulary score:', error)
            return { range: '55-75', score: 65, justification: 'שגיאה בניתוח Vocabulary' }
        }),
        // Language - Regular assistant
        scoreLanguage(question, studentTranscript).catch(error => {
            console.error('Failed to get Language score:', error)
            return { range: '55-75', score: 65, justification: 'שגיאה בניתוח Language' }
        }),
        // Fluency/Delivery - only if pronunciation metrics available
        pronunciationMetrics
            ? scoreFluency(question, studentTranscript, pronunciationMetrics).catch(error => {
                console.error('Failed to get Fluency score:', error)
                return { range: '55-75', score: 65, justification: 'Error analyzing Fluency' }
            })
            : Promise.resolve({ range: '55-75', score: 65, justification: 'No pronunciation metrics available' })
    ])

    console.log('✅ All Module C scoring completed')
    console.log(`   Topic Development: ${topicDevelopmentResult.score}`)
    console.log(`   Fluency: ${fluencyResult.score}`)
    console.log(`   Vocabulary: ${vocabularyResult.score}`)
    console.log(`   Language: ${languageResult.score}`)

    // Get detailed feedback from all Feedback Assistants (in parallel)
    console.log('🔄 Getting detailed feedback from all Feedback Assistants...')
    const [topicFeedback, vocabularyFeedback, languageFeedback, fluencyFeedback] = await Promise.all([
        // Topic Development Feedback - Uses Module C specific assistant with video transcript
        getModuleCTopicFeedback({
            question,
            score: topicDevelopmentResult.score,
            range: topicDevelopmentResult.range,
            studentTranscript,
            videoTranscript
        }).catch(error => {
            console.error('Failed to get Module C Topic Development feedback:', error)
            return { strengths: [], improvements: [], generalFeedback: '' }
        }),
        // Vocabulary Feedback - Regular assistant
        getVocabularyFeedback({
            question,
            score: vocabularyResult.score,
            range: vocabularyResult.range,
            transcript: studentTranscript
        }).catch(error => {
            console.error('Failed to get Vocabulary feedback:', error)
            return { strengths: [], improvements: [], generalFeedback: '' }
        }),
        // Language Feedback - Regular assistant
        getLanguageFeedback({
            question,
            score: languageResult.score,
            range: languageResult.range,
            transcript: studentTranscript
        }).catch(error => {
            console.error('Failed to get Language feedback:', error)
            return { strengths: [], improvements: [], generalFeedback: '' }
        }),
        // Fluency/Delivery Feedback - only if pronunciation metrics available
        pronunciationMetrics
            ? getFluencyFeedback({
                question,
                score: fluencyResult.score,
                range: fluencyResult.range,
                transcript: studentTranscript,
                pronunciationMetrics
            }).catch(error => {
                console.error('Failed to get Fluency feedback:', error)
                return { strengths: [], improvements: [], generalFeedback: '' }
            })
            : Promise.resolve({ strengths: [], improvements: [], generalFeedback: 'No pronunciation metrics available' })
    ])

    console.log('✅ All Module C feedback received')

    // Aggregate all strengths/improvements for top-level access
    const allStrengths = [
        ...(topicFeedback.strengths || []),
        ...(vocabularyFeedback.strengths || []),
        ...(languageFeedback.strengths || []),
        ...(fluencyFeedback.strengths || [])
    ]
    const allImprovements = [
        ...(topicFeedback.improvements || []),
        ...(vocabularyFeedback.improvements || []),
        ...(languageFeedback.improvements || []),
        ...(fluencyFeedback.improvements || [])
    ]

    // Calculate weighted total score for Module C
    const totalScore = Math.round(
        topicDevelopmentResult.score * 0.50 +
        fluencyResult.score * 0.15 +
        vocabularyResult.score * 0.20 +
        languageResult.score * 0.15
    )

    console.log(`📊 Module C Final Score: ${totalScore}`)

    return {
        topicDevelopment: {
            score: topicDevelopmentResult.score,
            weight: 50,
            range: topicDevelopmentResult.range,
            feedback: topicDevelopmentResult.justification,
            strengths: topicFeedback.strengths || [],
            improvements: topicFeedback.improvements || [],
            generalFeedback: topicFeedback.generalFeedback || ''
        },
        fluency: {
            score: fluencyResult.score,
            weight: 15,
            range: fluencyResult.range,
            feedback: fluencyResult.justification,
            strengths: fluencyFeedback.strengths || [],
            improvements: fluencyFeedback.improvements || [],
            generalFeedback: fluencyFeedback.generalFeedback || ''
        },
        vocabulary: {
            score: vocabularyResult.score,
            weight: 20,
            range: vocabularyResult.range,
            feedback: vocabularyResult.justification,
            strengths: vocabularyFeedback.strengths || [],
            improvements: vocabularyFeedback.improvements || [],
            generalFeedback: vocabularyFeedback.generalFeedback || ''
        },
        grammar: {
            score: languageResult.score,
            weight: 15,
            range: languageResult.range,
            feedback: languageResult.justification,
            strengths: languageFeedback.strengths || [],
            improvements: languageFeedback.improvements || [],
            generalFeedback: languageFeedback.generalFeedback || ''
        },
        totalScore,
        // Top-level aggregated points (for backward compatibility)
        preservationPoints: allStrengths,
        improvementPoints: allImprovements,
        // New unified naming
        strengths: allStrengths,
        improvements: allImprovements
    }
}

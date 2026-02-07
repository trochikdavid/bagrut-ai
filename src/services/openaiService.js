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

    const { data, error } = await supabase.functions.invoke('openai-scoring', {
        body: { action, ...params }
    })

    if (error) {
        throw new Error(error.message || 'Edge Function error')
    }

    if (data.error) {
        throw new Error(data.error)
    }

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
        return {
            range: '55-75',
            score: 65,
            justification: 'ציון דמו - Supabase לא מוגדר'
        }
    }

    try {
        const result = await callOpenAIFunction('scoreTopicDevelopment', { question, transcript })

        return {
            range: result.range,
            score: result.score,
            justification: result.justification
        }
    } catch (error) {
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
        return {
            strengths: ['פידבק דמו - Supabase לא מוגדר'],
            improvements: [],
            generalFeedback: ''
        }
    }

    try {
        const result = await callOpenAIFunction('getTopicDevelopmentFeedback', {
            question, score, range, transcript
        })

        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || ''
        }
    } catch (error) {
        throw error
    }
}

/**
 * Full Topic Development analysis: Score + Detailed Feedback
 */
export async function scoreAndFeedbackTopicDevelopment(question, transcript) {
    // Step 1: Get the score
    const scoreResult = await scoreTopicDevelopment(question, transcript)


    // Step 2: Get detailed feedback based on the score
    let feedbackResult
    try {
        feedbackResult = await getTopicDevelopmentFeedback({
            question,
            score: scoreResult.score,
            range: scoreResult.range,
            transcript
        })
    } catch (error) {
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
        return scoreTopicDevelopment(question, studentTranscript)
    }

    try {

        const result = await callOpenAIFunction('scoreModuleCTopicDevelopment', {
            question, studentTranscript, videoTranscript
        })

        return {
            range: result.range,
            score: result.score,
            justification: result.justification
        }
    } catch (error) {
        return scoreTopicDevelopment(question, studentTranscript)
    }
}

/**
 * Get detailed feedback for Module C Topic Development
 */
export async function getModuleCTopicFeedback({ question, score, range, studentTranscript, videoTranscript }) {
    try {

        const result = await callOpenAIFunction('getModuleCTopicFeedback', {
            question, score, studentTranscript, videoTranscript
        })

        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || ''
        }
    } catch (error) {
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
        return {
            range: '55-75',
            score: 65,
            justification: 'ציון דמו - Vocabulary Assistant לא מוגדר'
        }
    }

    try {
        const result = await callOpenAIFunction('scoreVocabulary', { question, transcript })

        return {
            range: result.range || '55-75',
            score: result.score || 65,
            justification: result.justification || 'לא התקבלה הנמקה'
        }
    } catch (error) {
        throw error
    }
}

/**
 * Get detailed feedback for Vocabulary
 */
export async function getVocabularyFeedback({ question, score, range, transcript }) {
    try {
        const result = await callOpenAIFunction('getVocabularyFeedback', {
            question, score, transcript
        })

        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || ''
        }
    } catch (error) {
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
        return {
            range: '55-75',
            score: 65,
            justification: 'ציון דמו - Language Assistant לא מוגדר'
        }
    }

    try {
        const result = await callOpenAIFunction('scoreLanguage', { question, transcript })

        return {
            range: result.range || '55-75',
            score: result.score || 65,
            justification: result.justification || 'לא התקבלה הנמקה'
        }
    } catch (error) {
        throw error
    }
}

/**
 * Get detailed feedback for Language
 */
export async function getLanguageFeedback({ question, score, range, transcript }) {
    try {
        const result = await callOpenAIFunction('getLanguageFeedback', {
            question, score, transcript
        })

        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || ''
        }
    } catch (error) {
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
        return {
            range: '55-75',
            score: 65,
            justification: 'ציון דמו - Fluency Assistant לא מוגדר'
        }
    }

    if (!pronunciationMetrics) {
        return {
            range: '55-75',
            score: 65,
            justification: 'לא התקבלו נתוני הגייה מ-Azure'
        }
    }

    try {
        const result = await callOpenAIFunction('scoreFluency', {
            question, transcript, pronunciationMetrics
        })

        return {
            range: result.range || '55-75',
            score: result.score || 65,
            justification: result.justification || 'לא התקבלה הנמקה'
        }
    } catch (error) {
        throw error
    }
}

/**
 * Get detailed feedback for Fluency
 */
export async function getFluencyFeedback({ question, score, range, transcript, pronunciationMetrics }) {
    try {
        const result = await callOpenAIFunction('getFluencyFeedback', {
            question, score, range, transcript, pronunciationMetrics
        })

        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || '',
            problematicWords: pronunciationMetrics?.problematicWords || []
        }
    } catch (error) {
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
            return { range: '55-75', score: 60, justification: 'Error analyzing Topic Development' }
        }),
        // Vocabulary
        scoreVocabulary(question, transcript).catch(error => {
            return { range: '55-75', score: 65, justification: 'Error analyzing Vocabulary' }
        }),
        // Language
        scoreLanguage(question, transcript).catch(error => {
            return { range: '55-75', score: 65, justification: 'Error analyzing Language' }
        }),
        // Fluency/Delivery - only if pronunciation metrics available
        pronunciationMetrics
            ? scoreFluency(question, transcript, pronunciationMetrics).catch(error => {
                return { range: '55-75', score: 65, justification: 'Error analyzing Fluency' }
            })
            : Promise.resolve({ range: '55-75', score: 65, justification: 'No pronunciation metrics available' })
    ])


    // Get detailed feedback from all Feedback Assistants (in parallel)
    const [topicFeedback, vocabularyFeedback, languageFeedback, fluencyFeedback] = await Promise.all([
        // Topic Development Feedback
        getTopicDevelopmentFeedback({
            question,
            score: topicDevelopmentResult.score,
            range: topicDevelopmentResult.range,
            transcript
        }).catch(error => {
            return { preservationPoints: [], improvementPoints: [] }
        }),
        // Vocabulary Feedback
        getVocabularyFeedback({
            question,
            score: vocabularyResult.score,
            range: vocabularyResult.range,
            transcript
        }).catch(error => {
            return { strengths: [], improvements: [], generalFeedback: '' }
        }),
        // Language Feedback
        getLanguageFeedback({
            question,
            score: languageResult.score,
            range: languageResult.range,
            transcript
        }).catch(error => {
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
                return { strengths: [], improvements: [], generalFeedback: '' }
            })
            : Promise.resolve({ strengths: [], improvements: [], generalFeedback: 'No pronunciation metrics available' })
    ])


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
            return { range: '55-75', score: 60, justification: 'שגיאה בניתוח Topic Development' }
        }),
        // Vocabulary - Regular assistant
        scoreVocabulary(question, studentTranscript).catch(error => {
            return { range: '55-75', score: 65, justification: 'שגיאה בניתוח Vocabulary' }
        }),
        // Language - Regular assistant
        scoreLanguage(question, studentTranscript).catch(error => {
            return { range: '55-75', score: 65, justification: 'שגיאה בניתוח Language' }
        }),
        // Fluency/Delivery - only if pronunciation metrics available
        pronunciationMetrics
            ? scoreFluency(question, studentTranscript, pronunciationMetrics).catch(error => {
                return { range: '55-75', score: 65, justification: 'Error analyzing Fluency' }
            })
            : Promise.resolve({ range: '55-75', score: 65, justification: 'No pronunciation metrics available' })
    ])


    // Get detailed feedback from all Feedback Assistants (in parallel)
    const [topicFeedback, vocabularyFeedback, languageFeedback, fluencyFeedback] = await Promise.all([
        // Topic Development Feedback - Uses Module C specific assistant with video transcript
        getModuleCTopicFeedback({
            question,
            score: topicDevelopmentResult.score,
            range: topicDevelopmentResult.range,
            studentTranscript,
            videoTranscript
        }).catch(error => {
            return { strengths: [], improvements: [], generalFeedback: '' }
        }),
        // Vocabulary Feedback - Regular assistant
        getVocabularyFeedback({
            question,
            score: vocabularyResult.score,
            range: vocabularyResult.range,
            transcript: studentTranscript
        }).catch(error => {
            return { strengths: [], improvements: [], generalFeedback: '' }
        }),
        // Language Feedback - Regular assistant
        getLanguageFeedback({
            question,
            score: languageResult.score,
            range: languageResult.range,
            transcript: studentTranscript
        }).catch(error => {
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
                return { strengths: [], improvements: [], generalFeedback: '' }
            })
            : Promise.resolve({ strengths: [], improvements: [], generalFeedback: 'No pronunciation metrics available' })
    ])


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

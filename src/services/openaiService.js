/**
 * OpenAI Service - Calls OpenAI Assistants API for real scoring
 * Supports Topic Development, Vocabulary, and Language scoring and feedback
 * Module C uses specialized assistants that include video transcript context
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const TOPIC_DEVELOPMENT_ASSISTANT_ID = import.meta.env.VITE_OPENAI_TOPIC_DEVELOPMENT_ASSISTANT_ID
const TOPIC_DEVELOPMENT_FEEDBACK_ASSISTANT_ID = import.meta.env.VITE_OPENAI_TOPIC_DEVELOPMENT_FEEDBACK_ASSISTANT_ID
const VOCABULARY_SCORING_ASSISTANT_ID = import.meta.env.VITE_OPENAI_VOCABULARY_SCORING_ASSISTANT_ID
const VOCABULARY_FEEDBACK_ASSISTANT_ID = import.meta.env.VITE_OPENAI_VOCABULARY_FEEDBACK_ASSISTANT_ID
const LANGUAGE_SCORING_ASSISTANT_ID = import.meta.env.VITE_OPENAI_LANGUAGE_SCORING_ASSISTANT_ID
const LANGUAGE_FEEDBACK_ASSISTANT_ID = import.meta.env.VITE_OPENAI_LANGUAGE_FEEDBACK_ASSISTANT_ID

// Fluency (4th criterion) - uses Azure Pronunciation Assessment metrics
const FLUENCY_SCORING_ASSISTANT_ID = import.meta.env.VITE_OPENAI_FLUENCY_SCORING_ASSISTANT_ID
const FLUENCY_FEEDBACK_ASSISTANT_ID = import.meta.env.VITE_OPENAI_FLUENCY_FEEDBACK_ASSISTANT_ID

// Module C specific Topic Development Assistants (use video transcript for context)
const MODULE_C_TOPIC_SCORING_ASSISTANT_ID = import.meta.env.VITE_OPENAI_MODULE_C_TOPIC_SCORING_ASSISTANT_ID
const MODULE_C_TOPIC_FEEDBACK_ASSISTANT_ID = import.meta.env.VITE_OPENAI_MODULE_C_TOPIC_FEEDBACK_ASSISTANT_ID

const OPENAI_API_URL = 'https://api.openai.com/v1'

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured() {
    return !!(OPENAI_API_KEY && TOPIC_DEVELOPMENT_ASSISTANT_ID)
}

/**
 * Helper to make OpenAI API requests
 */
async function openaiRequest(endpoint, options = {}) {
    const response = await fetch(`${OPENAI_API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
            ...options.headers
        }
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
        throw new Error(error.error?.message || 'OpenAI API error')
    }

    return response.json()
}

/**
 * Create a thread for conversation
 */
async function createThread() {
    return openaiRequest('/threads', { method: 'POST', body: JSON.stringify({}) })
}

/**
 * Add a message to a thread
 */
async function addMessage(threadId, content) {
    return openaiRequest(`/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
            role: 'user',
            content
        })
    })
}

/**
 * Run the assistant on a thread
 */
async function runAssistant(threadId, assistantId) {
    return openaiRequest(`/threads/${threadId}/runs`, {
        method: 'POST',
        body: JSON.stringify({
            assistant_id: assistantId
        })
    })
}

/**
 * Get run status
 */
async function getRunStatus(threadId, runId) {
    return openaiRequest(`/threads/${threadId}/runs/${runId}`)
}

/**
 * Get messages from a thread
 */
async function getMessages(threadId) {
    return openaiRequest(`/threads/${threadId}/messages`)
}

/**
 * Wait for run to complete with polling
 */
async function waitForCompletion(threadId, runId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        const run = await getRunStatus(threadId, runId)

        if (run.status === 'completed') {
            return run
        }

        if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
            throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`)
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    throw new Error('Timeout waiting for assistant response')
}

/**
 * Score Topic Development using the Assistant
 * @param {string} question - The question asked
 * @param {string} transcript - The student's transcribed answer
 * @returns {Promise<{range: string, score: number, justification: string}>}
 */
export async function scoreTopicDevelopment(question, transcript) {
    if (!isOpenAIConfigured()) {
        console.warn('OpenAI not configured, returning mock score')
        return {
            range: '55-75',
            score: 65,
            justification: 'ציון דמו - OpenAI לא מוגדר'
        }
    }

    try {
        console.log('🤖 Starting Topic Development analysis...')

        // 1. Create a new thread
        const thread = await createThread()
        console.log('📝 Thread created:', thread.id)

        // 2. Add the message with question and transcript
        const message = `Question: "${question}"\n\nStudent's Answer: "${transcript}"`
        await addMessage(thread.id, message)
        console.log('💬 Message added to thread')

        // 3. Run the assistant
        const run = await runAssistant(thread.id, TOPIC_DEVELOPMENT_ASSISTANT_ID)
        console.log('🏃 Run started:', run.id)

        // 4. Wait for completion
        await waitForCompletion(thread.id, run.id)
        console.log('✅ Run completed')

        // 5. Get the response
        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No assistant response found')
        }

        // 6. Parse the JSON response
        const responseText = assistantMessage.content[0]?.text?.value
        console.log('📊 Raw response:', responseText)

        // Try to parse as JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from response')
        }

        const result = JSON.parse(jsonMatch[0])
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
 * Check if Feedback Assistant is configured
 */
export function isFeedbackAssistantConfigured() {
    return !!(OPENAI_API_KEY && TOPIC_DEVELOPMENT_FEEDBACK_ASSISTANT_ID &&
        TOPIC_DEVELOPMENT_FEEDBACK_ASSISTANT_ID !== 'YOUR_FEEDBACK_ASSISTANT_ID_HERE')
}

/**
 * Get detailed feedback for Topic Development using the Feedback Assistant
 * This should be called AFTER getting the score from scoreTopicDevelopment
 * 
 * @param {object} params - Parameters for feedback
 * @param {string} params.question - The question that was asked
 * @param {number} params.score - The score from the scoring assistant
 * @param {string} params.range - The range from the scoring assistant (e.g., "55-75")
 * @param {string} params.transcript - The student's transcribed answer
 * @returns {Promise<{strengths: string[], improvements: string[], generalFeedback: string}>}
 */
export async function getTopicDevelopmentFeedback({ question, score, range, transcript }) {
    if (!isFeedbackAssistantConfigured()) {
        console.warn('Feedback Assistant not configured, returning mock feedback')
        return {
            strengths: ['פידבק דמו - Feedback Assistant לא מוגדר'],
            improvements: [],
            generalFeedback: 'יש להגדיר את ה-Assistant ID ב-.env'
        }
    }

    try {
        console.log('📝 Starting Topic Development feedback analysis...')
        console.log(`   Question: ${question?.substring(0, 50)}...`)
        console.log(`   Score: ${score}, Range: ${range}`)

        // 1. Create a new thread
        const thread = await createThread()
        console.log('📝 Feedback thread created:', thread.id)

        // 2. Build the message with question, score and transcript
        const message = `שאלה: "${question}"
ציון: ${score}
תמלול תשובת התלמיד:
"${transcript}"`

        await addMessage(thread.id, message)
        console.log('💬 Feedback request sent')

        // 3. Run the feedback assistant
        const run = await runAssistant(thread.id, TOPIC_DEVELOPMENT_FEEDBACK_ASSISTANT_ID)
        console.log('🏃 Feedback run started:', run.id)

        // 4. Wait for completion
        await waitForCompletion(thread.id, run.id)
        console.log('✅ Feedback run completed')

        // 5. Get the response
        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No feedback response found')
        }

        // 6. Parse the JSON response
        const responseText = assistantMessage.content[0]?.text?.value
        console.log('📊 Raw feedback response:', responseText)

        // Try to parse as JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from feedback response')
        }

        const result = JSON.parse(jsonMatch[0])
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
 * This orchestrates the complete flow:
 * 1. Call scoring assistant to get score, range, justification
 * 2. Call feedback assistant with score, range, transcript to get detailed feedback
 * 
 * @param {string} question - The question asked
 * @param {string} transcript - The student's transcribed answer
 * @returns {Promise<{score: number, range: string, justification: string, preservationPoints: string[], improvementPoints: string[]}>}
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
 * Check if Module C Topic Development assistants are configured
 */
export function isModuleCTopicConfigured() {
    return !!(OPENAI_API_KEY && MODULE_C_TOPIC_SCORING_ASSISTANT_ID &&
        MODULE_C_TOPIC_SCORING_ASSISTANT_ID !== 'YOUR_MODULE_C_TOPIC_SCORING_ASSISTANT_ID')
}

/**
 * Score Topic Development for Module C questions using specialized Assistant
 * This assistant receives the video transcript to properly evaluate if the student
 * understood the video content and addressed the question appropriately.
 * 
 * @param {object} params - Parameters for scoring
 * @param {string} params.question - The question asked about the video
 * @param {string} params.studentTranscript - The student's transcribed answer
 * @param {string} params.videoTranscript - The transcript of the YouTube video
 * @returns {Promise<{range: string, score: number, justification: string}>}
 */
export async function scoreModuleCTopicDevelopment({ question, studentTranscript, videoTranscript }) {
    if (!isModuleCTopicConfigured()) {
        console.warn('Module C Topic Assistant not configured, falling back to regular Topic Development')
        // Fall back to regular topic development scoring
        return scoreTopicDevelopment(question, studentTranscript)
    }

    try {
        console.log('🎬 Starting Module C Topic Development analysis...')
        console.log(`   Video transcript length: ${videoTranscript?.length || 0} chars`)

        // 1. Create a new thread
        const thread = await createThread()
        console.log('📝 Module C thread created:', thread.id)

        // 2. Add the message with video transcript, question and student answer
        const message = `Video Transcript:
"""
${videoTranscript || 'No video transcript available'}
"""

Question about the video: "${question}"

Student's spoken answer: "${studentTranscript}"`

        await addMessage(thread.id, message)
        console.log('💬 Module C message added to thread')

        // 3. Run the Module C assistant
        const run = await runAssistant(thread.id, MODULE_C_TOPIC_SCORING_ASSISTANT_ID)
        console.log('🏃 Module C run started:', run.id)

        // 4. Wait for completion
        await waitForCompletion(thread.id, run.id)
        console.log('✅ Module C run completed')

        // 5. Get the response
        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No assistant response found')
        }

        // 6. Parse the JSON response
        const responseText = assistantMessage.content[0]?.text?.value
        console.log('📊 Module C raw response:', responseText)

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from response')
        }

        const result = JSON.parse(jsonMatch[0])
        console.log('🎯 Module C parsed result:', result)

        return {
            range: result.range,
            score: result.score,
            justification: result.justification
        }

    } catch (error) {
        console.error('❌ Module C Topic Development scoring error:', error)
        // Fall back to regular scoring if Module C fails
        console.log('⚠️ Falling back to regular Topic Development scoring')
        return scoreTopicDevelopment(question, studentTranscript)
    }
}

/**
 * Get detailed feedback for Module C Topic Development
 * This assistant receives video transcript + question + student answer + score
 * 
 * @param {object} params - Parameters for feedback
 * @param {string} params.question - The question asked about the video
 * @param {number} params.score - The score from the scoring assistant
 * @param {string} params.range - The range from the scoring assistant
 * @param {string} params.studentTranscript - The student's transcribed answer
 * @param {string} params.videoTranscript - The transcript of the YouTube video
 * @returns {Promise<{strengths: string[], improvements: string[], generalFeedback: string}>}
 */
export async function getModuleCTopicFeedback({ question, score, range, studentTranscript, videoTranscript }) {
    if (!MODULE_C_TOPIC_FEEDBACK_ASSISTANT_ID ||
        MODULE_C_TOPIC_FEEDBACK_ASSISTANT_ID === 'YOUR_MODULE_C_TOPIC_FEEDBACK_ASSISTANT_ID') {
        console.warn('Module C Topic Feedback Assistant not configured, falling back to regular')
        return getTopicDevelopmentFeedback({ question, score, range, transcript: studentTranscript })
    }

    try {
        console.log('📝 Starting Module C Topic Development feedback analysis...')
        console.log(`   Question: ${question?.substring(0, 50)}...`)
        console.log(`   Score: ${score}, Range: ${range}`)
        console.log(`   Video transcript length: ${videoTranscript?.length || 0} chars`)

        // 1. Create a new thread
        const thread = await createThread()
        console.log('📝 Module C Feedback thread created:', thread.id)

        // 2. Build the message with video transcript, question, score and student answer
        const message = `תמלול הסרטון:
"""
${videoTranscript || 'אין תמלול זמין'}
"""

שאלה על הסרטון: "${question}"

ציון שהתקבל: ${score}

תמלול תשובת התלמיד:
"${studentTranscript}"`

        await addMessage(thread.id, message)
        console.log('💬 Module C Feedback request sent')

        // 3. Run the feedback assistant
        const run = await runAssistant(thread.id, MODULE_C_TOPIC_FEEDBACK_ASSISTANT_ID)
        console.log('🏃 Module C Feedback run started:', run.id)

        // 4. Wait for completion
        await waitForCompletion(thread.id, run.id)
        console.log('✅ Module C Feedback run completed')

        // 5. Get the response
        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No feedback response found')
        }

        // 6. Parse the JSON response
        const responseText = assistantMessage.content[0]?.text?.value
        console.log('📊 Module C Feedback raw response:', responseText)

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from feedback response')
        }

        const result = JSON.parse(jsonMatch[0])
        console.log('🎯 Module C Feedback parsed:', result)

        return {
            strengths: result.strengths || [],
            improvements: result.improvements || [],
            generalFeedback: result.general_feedback || result.generalFeedback || ''
        }

    } catch (error) {
        console.error('❌ Module C Topic feedback error:', error)
        // Fall back to regular feedback
        return getTopicDevelopmentFeedback({ question, score, range, transcript: studentTranscript })
    }
}

// ============================================
// VOCABULARY SCORING AND FEEDBACK
// ============================================

/**
 * Check if Vocabulary assistants are configured
 */
export function isVocabularyConfigured() {
    return !!(OPENAI_API_KEY && VOCABULARY_SCORING_ASSISTANT_ID)
}

/**
 * Score Vocabulary criterion using OpenAI Assistant
 * @param {string} question - The question asked
 * @param {string} transcript - The student's transcribed answer
 * @returns {Promise<{range: string, score: number, justification: string}>}
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

        const thread = await createThread()
        console.log('📝 Vocabulary thread created:', thread.id)

        const message = `Question: "${question}"

Student's spoken answer:
"${transcript}"`

        await addMessage(thread.id, message)
        console.log('💬 Vocabulary message sent')

        const run = await runAssistant(thread.id, VOCABULARY_SCORING_ASSISTANT_ID)
        console.log('🏃 Vocabulary run started:', run.id)

        await waitForCompletion(thread.id, run.id)
        console.log('✅ Vocabulary run completed')

        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No assistant response found')
        }

        const responseText = assistantMessage.content[0].text.value
        console.log('📄 Vocabulary raw response:', responseText)

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from response')
        }

        const result = JSON.parse(jsonMatch[0])
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
 * Get detailed feedback for Vocabulary using the Feedback Assistant
 * @param {object} params - Parameters for feedback
 * @param {string} params.question - The question that was asked
 * @param {number} params.score - The score from the scoring assistant
 * @param {string} params.range - The range from the scoring assistant
 * @param {string} params.transcript - The student's transcribed answer
 * @returns {Promise<{strengths: string[], improvements: string[], generalFeedback: string}>}
 */
export async function getVocabularyFeedback({ question, score, range, transcript }) {
    if (!VOCABULARY_FEEDBACK_ASSISTANT_ID) {
        console.warn('Vocabulary Feedback Assistant not configured, returning mock feedback')
        return {
            strengths: ['פידבק דמו - Vocabulary Feedback Assistant לא מוגדר'],
            improvements: [],
            generalFeedback: 'יש להגדיר את ה-Assistant ID ב-.env'
        }
    }

    try {
        console.log('📝 Starting Vocabulary feedback analysis...')
        console.log(`   Question: ${question?.substring(0, 50)}...`)
        console.log(`   Score: ${score}, Range: ${range}`)

        const thread = await createThread()
        console.log('📝 Vocabulary feedback thread created:', thread.id)

        const message = `שאלה: "${question}"
ציון: ${score}
תמלול תשובת התלמיד:
"${transcript}"`

        await addMessage(thread.id, message)
        console.log('💬 Vocabulary feedback request sent')

        const run = await runAssistant(thread.id, VOCABULARY_FEEDBACK_ASSISTANT_ID)
        console.log('🏃 Vocabulary feedback run started:', run.id)

        await waitForCompletion(thread.id, run.id)
        console.log('✅ Vocabulary feedback run completed')

        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No assistant response found')
        }

        const responseText = assistantMessage.content[0].text.value
        console.log('📄 Vocabulary feedback raw response:', responseText)

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from feedback response')
        }

        const result = JSON.parse(jsonMatch[0])
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
 * Check if Language assistants are configured
 */
export function isLanguageConfigured() {
    return !!(OPENAI_API_KEY && LANGUAGE_SCORING_ASSISTANT_ID)
}

/**
 * Score Language (Grammar) criterion using OpenAI Assistant
 * @param {string} question - The question asked
 * @param {string} transcript - The student's transcribed answer
 * @returns {Promise<{range: string, score: number, justification: string}>}
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

        const thread = await createThread()
        console.log('📝 Language thread created:', thread.id)

        const message = `Question: "${question}"

Student's spoken answer:
"${transcript}"`

        await addMessage(thread.id, message)
        console.log('💬 Language message sent')

        const run = await runAssistant(thread.id, LANGUAGE_SCORING_ASSISTANT_ID)
        console.log('🏃 Language run started:', run.id)

        await waitForCompletion(thread.id, run.id)
        console.log('✅ Language run completed')

        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No assistant response found')
        }

        const responseText = assistantMessage.content[0].text.value
        console.log('📄 Language raw response:', responseText)

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from response')
        }

        const result = JSON.parse(jsonMatch[0])
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
 * Get detailed feedback for Language using the Feedback Assistant
 * @param {object} params - Parameters for feedback
 * @param {string} params.question - The question that was asked
 * @param {number} params.score - The score from the scoring assistant
 * @param {string} params.range - The range from the scoring assistant
 * @param {string} params.transcript - The student's transcribed answer
 * @returns {Promise<{strengths: string[], improvements: string[], generalFeedback: string}>}
 */
export async function getLanguageFeedback({ question, score, range, transcript }) {
    if (!LANGUAGE_FEEDBACK_ASSISTANT_ID) {
        console.warn('Language Feedback Assistant not configured, returning mock feedback')
        return {
            strengths: ['פידבק דמו - Language Feedback Assistant לא מוגדר'],
            improvements: [],
            generalFeedback: 'יש להגדיר את ה-Assistant ID ב-.env'
        }
    }

    try {
        console.log('📝 Starting Language feedback analysis...')
        console.log(`   Question: ${question?.substring(0, 50)}...`)
        console.log(`   Score: ${score}, Range: ${range}`)

        const thread = await createThread()
        console.log('📝 Language feedback thread created:', thread.id)

        const message = `שאלה: "${question}"
ציון: ${score}
תמלול תשובת התלמיד:
"${transcript}"`

        await addMessage(thread.id, message)
        console.log('💬 Language feedback request sent')

        const run = await runAssistant(thread.id, LANGUAGE_FEEDBACK_ASSISTANT_ID)
        console.log('🏃 Language feedback run started:', run.id)

        await waitForCompletion(thread.id, run.id)
        console.log('✅ Language feedback run completed')

        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No assistant response found')
        }

        const responseText = assistantMessage.content[0].text.value
        console.log('📄 Language feedback raw response:', responseText)

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from feedback response')
        }

        const result = JSON.parse(jsonMatch[0])
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
 * Check if Fluency assistants are configured
 */
export function isFluencyConfigured() {
    return !!(OPENAI_API_KEY && FLUENCY_SCORING_ASSISTANT_ID)
}

/**
 * Score Fluency criterion using OpenAI Assistant with Azure Pronunciation Metrics
 * This is the 4th criterion that uses Azure Speech pronunciation assessment data
 * 
 * @param {string} question - The question asked
 * @param {string} transcript - The student's transcribed answer
 * @param {object} pronunciationMetrics - Azure pronunciation assessment metrics
 * @param {number} pronunciationMetrics.accuracyScore - Accuracy score (0-100)
 * @param {number} pronunciationMetrics.fluencyScore - Fluency score (0-100)
 * @param {number} pronunciationMetrics.prosodyScore - Prosody score (0-100)
 * @param {number} pronunciationMetrics.pronunciationScore - Overall pronunciation score
 * @param {number} pronunciationMetrics.totalWords - Total number of words
 * @param {number} pronunciationMetrics.errorCount - Number of problematic words
 * @param {Array} pronunciationMetrics.problematicWords - Words with errors
 * @returns {Promise<{range: string, score: number, justification: string}>}
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
        console.log('   Pronunciation metrics:', {
            accuracy: pronunciationMetrics.accuracyScore,
            fluency: pronunciationMetrics.fluencyScore,
            prosody: pronunciationMetrics.prosodyScore,
            totalWords: pronunciationMetrics.totalWords,
            errorCount: pronunciationMetrics.errorCount
        })

        const thread = await createThread()
        console.log('📝 Fluency thread created:', thread.id)

        // Build detailed problematic words text with syllables and phonemes
        const problematicWordsText = pronunciationMetrics.problematicWords?.length > 0
            ? pronunciationMetrics.problematicWords.map(w => {
                let detail = `• "${w.word}" - Overall Score: ${w.accuracyScore}/100, Issue: ${w.errorType}`

                // Add syllable breakdown if available
                if (w.syllables && w.syllables.length > 0) {
                    detail += `\n  Syllables: ${w.syllables.map(s => `${s.syllable}(${s.accuracyScore})`).join(' - ')}`
                }

                // Add weak phonemes if available
                if (w.phonemes && w.phonemes.length > 0) {
                    const weakPhonemes = w.phonemes.filter(p => p.accuracyScore < 60)
                    if (weakPhonemes.length > 0) {
                        detail += `\n  Weak phonemes: ${weakPhonemes.map(p => `"${p.phoneme}"(${p.accuracyScore})`).join(', ')}`
                    }
                }

                return detail
            }).join('\n\n')
            : 'No problematic words detected'
        // Build long pauses text
        const longPausesText = pronunciationMetrics.longPauses?.length > 0
            ? pronunciationMetrics.longPauses.map(p =>
                `• ${p.durationSeconds}s pause after "${p.afterWord}" before "${p.beforeWord}"`
            ).join('\n')
            : 'No abnormal pauses detected'

        const message = `Question: "${question}"

Student's spoken answer transcript:
"${transcript}"

=== Azure Pronunciation Assessment Metrics ===

Overall Scores:
- Fluency Score: ${pronunciationMetrics.fluencyScore}/100
- Prosody Score (intonation/rhythm): ${pronunciationMetrics.prosodyScore}/100
- Accuracy Score: ${pronunciationMetrics.accuracyScore}/100
- Overall Pronunciation Score: ${pronunciationMetrics.pronunciationScore}/100

Word Statistics:
- Total words spoken: ${pronunciationMetrics.totalWords}
- Problematic words count: ${pronunciationMetrics.errorCount}

=== Long Pauses (4+ seconds) ===
- Long pauses detected: ${pronunciationMetrics.longPauseCount || 0}
- Total long pause time: ${pronunciationMetrics.totalLongPauseTime || 0} seconds

${longPausesText}

=== Problematic Words with Full Breakdown ===
${problematicWordsText}`

        // ========== DETAILED LOG OF MESSAGE SENT TO ASSISTANT ==========
        console.log('\n' + '='.repeat(70))
        console.log('🚀 SENDING TO FLUENCY SCORING ASSISTANT')
        console.log('='.repeat(70))
        console.log('\n📋 FULL MESSAGE CONTENT:')
        console.log(message)
        console.log('\n📊 STRUCTURED DATA SUMMARY:')
        console.log(JSON.stringify({
            question: question?.substring(0, 100),
            transcriptLength: transcript?.length,
            metrics: {
                accuracy: pronunciationMetrics?.accuracyScore,
                fluency: pronunciationMetrics?.fluencyScore,
                prosody: pronunciationMetrics?.prosodyScore,
                pronunciation: pronunciationMetrics?.pronunciationScore,
                totalWords: pronunciationMetrics?.totalWords,
                errorCount: pronunciationMetrics?.errorCount
            },
            problematicWords: pronunciationMetrics?.problematicWords?.map(w => ({
                word: w.word,
                score: w.accuracyScore,
                error: w.errorType,
                syllablesCount: w.syllables?.length || 0,
                phonemesCount: w.phonemes?.length || 0
            }))
        }, null, 2))
        console.log('='.repeat(70) + '\n')

        await addMessage(thread.id, message)
        console.log('💬 Fluency message sent with Azure metrics')

        const run = await runAssistant(thread.id, FLUENCY_SCORING_ASSISTANT_ID)
        console.log('🏃 Fluency run started:', run.id)

        await waitForCompletion(thread.id, run.id)
        console.log('✅ Fluency run completed')

        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No assistant response found')
        }

        const responseText = assistantMessage.content[0].text.value
        console.log('📄 Fluency raw response:', responseText)

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from response')
        }

        const result = JSON.parse(jsonMatch[0])
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
 * Get detailed feedback for Fluency using the Feedback Assistant
 * @param {object} params - Parameters for feedback
 * @param {string} params.question - The question that was asked
 * @param {number} params.score - The score from the scoring assistant
 * @param {string} params.range - The range from the scoring assistant
 * @param {string} params.transcript - The student's transcribed answer
 * @param {object} params.pronunciationMetrics - Azure pronunciation assessment metrics
 * @returns {Promise<{strengths: string[], improvements: string[], generalFeedback: string, problematicWords: Array}>}
 */
export async function getFluencyFeedback({ question, score, range, transcript, pronunciationMetrics }) {
    if (!FLUENCY_FEEDBACK_ASSISTANT_ID) {
        console.warn('Fluency Feedback Assistant not configured, returning mock feedback')
        return {
            strengths: ['פידבק דמו - Fluency Feedback Assistant לא מוגדר'],
            improvements: [],
            generalFeedback: 'יש להגדיר את ה-Assistant ID ב-.env',
            problematicWords: pronunciationMetrics?.problematicWords || []
        }
    }

    try {
        console.log('📝 Starting Fluency feedback analysis...')
        console.log(`   Question: ${question?.substring(0, 50)}...`)
        console.log(`   Score: ${score}, Range: ${range}`)

        const thread = await createThread()
        console.log('📝 Fluency feedback thread created:', thread.id)

        // Build detailed problematic words text with syllables and phonemes
        const problematicWordsText = pronunciationMetrics?.problematicWords?.length > 0
            ? pronunciationMetrics.problematicWords.map((w, i) => {
                let detail = `${i + 1}. "${w.word}"\n   • Overall Score: ${w.accuracyScore}/100\n   • Error Type: ${w.errorType}`

                // Add syllable breakdown if available
                if (w.syllables && w.syllables.length > 0) {
                    detail += `\n   • Syllables: ${w.syllables.map(s => `"${s.syllable}"=${s.accuracyScore}`).join(', ')}`
                }

                // Add weak phonemes if available
                if (w.phonemes && w.phonemes.length > 0) {
                    const weakPhonemes = w.phonemes.filter(p => p.accuracyScore < 60)
                    if (weakPhonemes.length > 0) {
                        detail += `\n   • Weak Phonemes: ${weakPhonemes.map(p => `"${p.phoneme}"=${p.accuracyScore}`).join(', ')}`
                    }
                }

                return detail
            }).join('\n\n')
            : 'No problematic words detected'

        // Build long pauses text
        const longPausesText = pronunciationMetrics?.longPauses?.length > 0
            ? pronunciationMetrics.longPauses.map((p, i) =>
                `${i + 1}. ${p.durationSeconds}s pause\n   • After: "${p.afterWord}"\n   • Before: "${p.beforeWord}"`
            ).join('\n')
            : 'No abnormal pauses detected'

        const message = `Question: "${question}"
Score: ${score} (Range: ${range})

Student's spoken answer transcript:
"${transcript}"

=== Azure Pronunciation Assessment Metrics ===

Overall Scores:
- Fluency Score: ${pronunciationMetrics?.fluencyScore || 'N/A'}/100
- Prosody Score (intonation/rhythm): ${pronunciationMetrics?.prosodyScore || 'N/A'}/100
- Accuracy Score: ${pronunciationMetrics?.accuracyScore || 'N/A'}/100
- Overall Pronunciation Score: ${pronunciationMetrics?.pronunciationScore || 'N/A'}/100

Statistics:
- Total words spoken: ${pronunciationMetrics?.totalWords || 0}
- Problematic words count: ${pronunciationMetrics?.errorCount || 0}

=== Long Pauses (4+ seconds) ===
- Long pauses detected: ${pronunciationMetrics?.longPauseCount || 0}
- Total long pause time: ${pronunciationMetrics?.totalLongPauseTime || 0} seconds

${longPausesText}

=== Problematic Words with Full Breakdown ===
${problematicWordsText}`

        // ========== DETAILED LOG OF MESSAGE SENT TO FEEDBACK ASSISTANT ==========
        console.log('\n' + '='.repeat(70))
        console.log('🚀 SENDING TO FLUENCY FEEDBACK ASSISTANT')
        console.log('='.repeat(70))
        console.log('\n📋 FULL MESSAGE CONTENT:')
        console.log(message)
        console.log('\n📊 STRUCTURED DATA SUMMARY:')
        console.log(JSON.stringify({
            question: question?.substring(0, 100),
            score: score,
            range: range,
            transcriptLength: transcript?.length,
            metrics: {
                accuracy: pronunciationMetrics?.accuracyScore,
                fluency: pronunciationMetrics?.fluencyScore,
                prosody: pronunciationMetrics?.prosodyScore,
                pronunciation: pronunciationMetrics?.pronunciationScore,
                totalWords: pronunciationMetrics?.totalWords,
                errorCount: pronunciationMetrics?.errorCount
            },
            problematicWords: pronunciationMetrics?.problematicWords?.map(w => ({
                word: w.word,
                score: w.accuracyScore,
                error: w.errorType,
                syllables: w.syllables?.map(s => ({ syl: s.syllable, score: s.accuracyScore })) || [],
                weakPhonemes: w.phonemes?.filter(p => p.accuracyScore < 60).map(p => ({ ph: p.phoneme, score: p.accuracyScore })) || []
            }))
        }, null, 2))
        console.log('='.repeat(70) + '\n')

        await addMessage(thread.id, message)
        console.log('💬 Fluency feedback request sent')

        const run = await runAssistant(thread.id, FLUENCY_FEEDBACK_ASSISTANT_ID)
        console.log('🏃 Fluency feedback run started:', run.id)

        await waitForCompletion(thread.id, run.id)
        console.log('✅ Fluency feedback run completed')

        const messages = await getMessages(thread.id)
        const assistantMessage = messages.data.find(m => m.role === 'assistant')

        if (!assistantMessage) {
            throw new Error('No assistant response found')
        }

        const responseText = assistantMessage.content[0].text.value
        console.log('📄 Fluency feedback raw response:', responseText)

        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from feedback response')
        }

        const result = JSON.parse(jsonMatch[0])
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
 * All criteria now use real AI scoring including Delivery (Fluency)
 * @param {string} question - The question asked
 * @param {string} transcript - The student's transcribed answer
 * @param {object} pronunciationMetrics - Azure pronunciation assessment metrics (optional)
 * @returns {Promise<{topicDevelopment: object, fluency: object, vocabulary: object, grammar: object, totalScore: number, preservationPoints: string[], improvementPoints: string[]}>}
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
 * Topic Development uses the Module C specific assistant (with video transcript)
 * Vocabulary and Language use regular assistants
 * 
 * @param {object} params - Parameters for analysis
 * @param {string} params.question - The question asked about the video
 * @param {string} params.studentTranscript - The student's transcribed answer
 * @param {string} params.videoTranscript - The transcript of the YouTube video
 * @returns {Promise<{topicDevelopment: object, fluency: object, vocabulary: object, grammar: object, totalScore: number}>}
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
    // Topic Development uses Module C specific assistant with video transcript
    // Vocabulary, Language, and Fluency use regular logic
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
    // Topic Development uses Module C specific feedback assistant
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
    // Updated weights to match Module A/B/Simulation standard:
    // Topic Development: 50%, Fluency: 15%, Vocabulary: 20%, Grammar: 15%
    const totalScore = Math.round(
        topicDevelopmentResult.score * 0.50 +
        fluencyResult.score * 0.15 +
        vocabularyResult.score * 0.20 +
        languageResult.score * 0.15
    )

    console.log(`📊 Module C Final Score: ${totalScore} (TD: ${topicDevelopmentResult.score}*50% + Fluency: ${fluencyResult.score}*15% + Vocab: ${vocabularyResult.score}*20% + Grammar: ${languageResult.score}*15%)`)

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

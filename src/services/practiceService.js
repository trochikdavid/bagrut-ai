import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured, supabase } from '../lib/supabase'

/**
 * Practice Service - Database operations for practice sessions
 * Uses native fetch to avoid AbortError issues with Supabase client
 */

// Get headers with user's JWT token for authenticated requests
async function getAuthHeaders() {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || supabaseAnonKey

        return {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    } catch (e) {
        // Fallback if getSession fails
        return {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    }
}

// Create a new practice session
export async function createPractice(userId, type, questions, moduleAInfo = null) {
    const headers = await getAuthHeaders()
    const body = {
        user_id: userId,
        type,
        status: 'in-progress',
        processing_status: 'pending',
        module_a_info: moduleAInfo,
        started_at: new Date().toISOString()
    }

    const url = `${supabaseUrl}/rest/v1/practices`
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
    }

    const data = await response.json()
    return data[0]
}

// Update a practice with analysis results
export async function completePractice(practiceId, analysisData) {
    const headers = await getAuthHeaders()
    const body = {
        status: 'completed',
        total_score: analysisData.totalScore,
        module_scores: analysisData.moduleScores,
        scores: analysisData.scores,
        feedback: analysisData.feedback,
        improvements: analysisData.improvements,
        strengths: analysisData.strengths,
        duration: analysisData.duration,
        completed_at: new Date().toISOString()
    }

    const url = `${supabaseUrl}/rest/v1/practices?id=eq.${practiceId}`
    const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
    }

    const data = await response.json()
    return data[0]
}

// Save per-question analysis
export async function savePracticeQuestion(practiceId, questionData, orderIndex) {
    const headers = await getAuthHeaders()


    const body = {
        practice_id: practiceId,
        question_id: questionData.questionId,
        question_text: questionData.questionText,
        transcript: questionData.transcript,
        duration: questionData.duration,
        scores: questionData.scores,
        feedback: questionData.feedback,
        total_score: questionData.totalScore,
        recording_url: questionData.recordingUrl,
        order_index: orderIndex
    }

    const url = `${supabaseUrl}/rest/v1/practice_questions`
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
    }

    const data = await response.json()
    return data[0]
}

// Get a single practice by ID with all questions
export async function getPracticeById(practiceId) {
    const headers = await getAuthHeaders()

    const practiceUrl = `${supabaseUrl}/rest/v1/practices?id=eq.${practiceId}&select=*`
    const practiceResponse = await fetch(practiceUrl, { headers })
    const practiceData = await practiceResponse.json()
    const practice = practiceData[0]

    if (!practice) throw new Error('Practice not found')

    const questionsUrl = `${supabaseUrl}/rest/v1/practice_questions?practice_id=eq.${practiceId}&select=*&order=order_index.asc`
    const questionsResponse = await fetch(questionsUrl, { headers })
    const questions = await questionsResponse.json()


    return {
        ...practice,
        questionAnalyses: questions.map(q => ({
            questionId: q.question_id,
            questionText: q.question_text,
            transcript: q.transcript,
            duration: q.duration,
            scores: q.scores,
            feedback: q.feedback,
            totalScore: q.total_score,
            recordingUrl: q.recording_url,
            audioUrl: q.recording_url // Alias for frontend compatibility
        }))
    }
}

// Get all practices for a user
export async function getUserPractices(userId) {
    const headers = await getAuthHeaders()
    const url = `${supabaseUrl}/rest/v1/practices?user_id=eq.${userId}&select=*,practice_questions(*)&order=started_at.desc`

    const response = await fetch(url, { headers })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
    }

    const data = await response.json()


    // Transform to match existing format
    return data.map(practice => ({
        id: practice.id,
        type: practice.type,
        status: practice.status,
        processingStatus: practice.processing_status,
        processingError: practice.processing_error,
        totalScore: practice.total_score,
        moduleScores: practice.module_scores,
        scores: practice.scores,
        feedback: practice.feedback,
        improvements: practice.improvements,
        strengths: practice.strengths,
        duration: practice.duration,
        moduleAInfo: practice.module_a_info,
        startedAt: practice.started_at,
        completedAt: practice.completed_at,
        questionAnalyses: practice.practice_questions
            ?.sort((a, b) => a.order_index - b.order_index)
            .map(q => ({
                questionId: q.question_id,
                questionText: q.question_text,
                transcript: q.transcript,
                duration: q.duration,
                scores: q.scores,
                feedback: q.feedback,
                totalScore: q.total_score,
                recordingUrl: q.recording_url,
                audioUrl: q.recording_url // Alias for frontend compatibility
            })) || []
    }))
}

// Delete a practice and related data
export async function deletePractice(practiceId) {
    const headers = await getAuthHeaders()
    const url = `${supabaseUrl}/rest/v1/practices?id=eq.${practiceId}`
    const response = await fetch(url, {
        method: 'DELETE',
        headers
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
    }

    return true
}

// Clear all practices for a user
export async function clearUserPractices(userId) {
    const headers = await getAuthHeaders()
    const url = `${supabaseUrl}/rest/v1/practices?user_id=eq.${userId}`
    const response = await fetch(url, {
        method: 'DELETE',
        headers
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
    }

    return true
}

// Update transcript and pronunciation data for a specific question
export async function updatePracticeQuestionTranscript(practiceId, questionId, transcript, pronunciationAssessment = null) {
    const headers = await getAuthHeaders()

    const url = `${supabaseUrl}/rest/v1/practice_questions?practice_id=eq.${practiceId}&question_id=eq.${questionId}`

    const updateData = { transcript }
    if (pronunciationAssessment) {
        // Store pronunciation metrics temporarily in scores column
        // Edge Function will read this and replace with actual AI scores
        updateData.scores = { _pronunciationAssessment: pronunciationAssessment }
    }

    const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData)
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
    }

    const data = await response.json()
    return data[0]
}

// Update scores and feedback for a specific question (after OpenAI analysis)
export async function updatePracticeQuestionScores(practiceId, questionId, scores, feedback, totalScore) {
    const headers = await getAuthHeaders()

    const url = `${supabaseUrl}/rest/v1/practice_questions?practice_id=eq.${practiceId}&question_id=eq.${questionId}`
    const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
            scores,
            feedback,
            total_score: totalScore
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
    }

    const data = await response.json()
    return data[0]
}

// Get list of question IDs that the user has already practiced for a specific module
// This is used for smart question selection to prioritize unpracticed questions
export async function getPracticedQuestionIds(userId, moduleType) {
    const headers = await getAuthHeaders()

    const url = `${supabaseUrl}/rest/v1/rpc/get_practiced_question_ids`
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            user_uuid: userId,
            module_type: moduleType
        })
    })

    if (!response.ok) {
        return []
    }

    const data = await response.json()
    return data.map(row => row.question_id)
}

// Trigger background processing for a practice
export async function triggerProcessing(practiceId) {
    try {
        console.log('[triggerProcessing] Calling process-practice with practiceId:', practiceId)

        const { data, error } = await supabase.functions.invoke('process-practice', {
            body: { practiceId }
        })

        if (error) {
            // Extract actual error details from Edge Function response
            let errorDetail = error.message
            try {
                if (error.context?.body) {
                    const body = await error.context.json()
                    errorDetail = body?.error || errorDetail
                }
            } catch (e) { /* ignore */ }
            console.error('[triggerProcessing] Error:', errorDetail, 'Full error:', JSON.stringify(error))
            return { success: false, error: errorDetail }
        }

        console.log('[triggerProcessing] Success:', data)
        return data
    } catch (err) {
        console.error('[triggerProcessing] Exception:', err?.message, err?.name, err)
        return { success: false, error: err?.message || 'Unknown error' }
    }
}

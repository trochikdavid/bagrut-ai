// Supabase Edge Function for OpenAI Scoring
// Handles all OpenAI Assistant API calls securely on the server side

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenAI configuration from environment (set in Supabase Dashboard)
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const OPENAI_API_URL = 'https://api.openai.com/v1'

// Assistant IDs from environment
const ASSISTANT_IDS = {
    topicDevelopment: Deno.env.get('OPENAI_TOPIC_DEVELOPMENT_ASSISTANT_ID'),
    topicDevelopmentFeedback: Deno.env.get('OPENAI_TOPIC_DEVELOPMENT_FEEDBACK_ASSISTANT_ID'),
    vocabulary: Deno.env.get('OPENAI_VOCABULARY_SCORING_ASSISTANT_ID'),
    vocabularyFeedback: Deno.env.get('OPENAI_VOCABULARY_FEEDBACK_ASSISTANT_ID'),
    language: Deno.env.get('OPENAI_LANGUAGE_SCORING_ASSISTANT_ID'),
    languageFeedback: Deno.env.get('OPENAI_LANGUAGE_FEEDBACK_ASSISTANT_ID'),
    fluency: Deno.env.get('OPENAI_FLUENCY_SCORING_ASSISTANT_ID'),
    fluencyFeedback: Deno.env.get('OPENAI_FLUENCY_FEEDBACK_ASSISTANT_ID'),
    moduleCTopic: Deno.env.get('OPENAI_MODULE_C_TOPIC_SCORING_ASSISTANT_ID'),
    moduleCTopicFeedback: Deno.env.get('OPENAI_MODULE_C_TOPIC_FEEDBACK_ASSISTANT_ID'),
}

/**
 * Helper to make OpenAI API requests
 */
async function openaiRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${OPENAI_API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
            ...options.headers,
        },
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
async function addMessage(threadId: string, content: string) {
    return openaiRequest(`/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ role: 'user', content }),
    })
}

/**
 * Run the assistant on a thread
 */
async function runAssistant(threadId: string, assistantId: string) {
    return openaiRequest(`/threads/${threadId}/runs`, {
        method: 'POST',
        body: JSON.stringify({ assistant_id: assistantId }),
    })
}

/**
 * Get run status
 */
async function getRunStatus(threadId: string, runId: string) {
    return openaiRequest(`/threads/${threadId}/runs/${runId}`)
}

/**
 * Get messages from a thread
 */
async function getMessages(threadId: string) {
    return openaiRequest(`/threads/${threadId}/messages`)
}

/**
 * Wait for run to complete with polling
 */
async function waitForCompletion(threadId: string, runId: string, maxAttempts = 30) {
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
 * Run assistant and get response
 */
async function runAssistantAndGetResponse(assistantId: string, message: string) {
    // Create thread
    const thread = await createThread()

    // Add message
    await addMessage(thread.id, message)

    // Run assistant
    const run = await runAssistant(thread.id, assistantId)

    // Wait for completion
    await waitForCompletion(thread.id, run.id)

    // Get response
    const messages = await getMessages(thread.id)
    const assistantMessage = messages.data.find((m: any) => m.role === 'assistant')

    if (!assistantMessage) {
        throw new Error('No assistant response found')
    }

    const responseText = assistantMessage.content[0]?.text?.value

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
        throw new Error('Could not parse JSON from response')
    }

    return JSON.parse(jsonMatch[0])
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verify user is authenticated
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const body = await req.json()
        const { action, ...params } = body

        let result: any

        switch (action) {
            // ============================================
            // TOPIC DEVELOPMENT
            // ============================================
            case 'scoreTopicDevelopment': {
                const { question, transcript } = params
                const message = `Question: "${question}"\n\nStudent's Answer: "${transcript}"`
                result = await runAssistantAndGetResponse(ASSISTANT_IDS.topicDevelopment!, message)
                break
            }

            case 'getTopicDevelopmentFeedback': {
                const { question, score, range, transcript } = params
                const message = `שאלה: "${question}"\nציון: ${score}\nתמלול תשובת התלמיד:\n"${transcript}"`
                result = await runAssistantAndGetResponse(ASSISTANT_IDS.topicDevelopmentFeedback!, message)
                break
            }

            // ============================================
            // MODULE C TOPIC DEVELOPMENT (WITH VIDEO TRANSCRIPT)
            // ============================================
            case 'scoreModuleCTopicDevelopment': {
                const { question, studentTranscript, videoTranscript } = params
                const message = `Video Transcript:\n"""\n${videoTranscript || 'No video transcript available'}\n"""\n\nQuestion about the video: "${question}"\n\nStudent's spoken answer: "${studentTranscript}"`
                result = await runAssistantAndGetResponse(ASSISTANT_IDS.moduleCTopic!, message)
                break
            }

            case 'getModuleCTopicFeedback': {
                const { question, score, studentTranscript, videoTranscript } = params
                const message = `תמלול הסרטון:\n"""\n${videoTranscript || 'אין תמלול זמין'}\n"""\n\nשאלה על הסרטון: "${question}"\n\nציון שהתקבל: ${score}\n\nתמלול תשובת התלמיד:\n"${studentTranscript}"`
                result = await runAssistantAndGetResponse(ASSISTANT_IDS.moduleCTopicFeedback!, message)
                break
            }

            // ============================================
            // VOCABULARY
            // ============================================
            case 'scoreVocabulary': {
                const { question, transcript } = params
                const message = `Question: "${question}"\n\nStudent's spoken answer:\n"${transcript}"`
                result = await runAssistantAndGetResponse(ASSISTANT_IDS.vocabulary!, message)
                break
            }

            case 'getVocabularyFeedback': {
                const { question, score, transcript } = params
                const message = `שאלה: "${question}"\nציון: ${score}\nתמלול תשובת התלמיד:\n"${transcript}"`
                result = await runAssistantAndGetResponse(ASSISTANT_IDS.vocabularyFeedback!, message)
                break
            }

            // ============================================
            // LANGUAGE (GRAMMAR)
            // ============================================
            case 'scoreLanguage': {
                const { question, transcript } = params
                const message = `Question: "${question}"\n\nStudent's spoken answer:\n"${transcript}"`
                result = await runAssistantAndGetResponse(ASSISTANT_IDS.language!, message)
                break
            }

            case 'getLanguageFeedback': {
                const { question, score, transcript } = params
                const message = `שאלה: "${question}"\nציון: ${score}\nתמלול תשובת התלמיד:\n"${transcript}"`
                result = await runAssistantAndGetResponse(ASSISTANT_IDS.languageFeedback!, message)
                break
            }

            // ============================================
            // FLUENCY (WITH AZURE METRICS)
            // ============================================
            case 'scoreFluency': {
                const { question, transcript, pronunciationMetrics } = params

                const problematicWordsText = pronunciationMetrics?.problematicWords?.length > 0
                    ? pronunciationMetrics.problematicWords.map((w: any) => {
                        let detail = `• "${w.word}" - Overall Score: ${w.accuracyScore}/100, Issue: ${w.errorType}`
                        if (w.syllables?.length > 0) {
                            detail += `\n  Syllables: ${w.syllables.map((s: any) => `${s.syllable}(${s.accuracyScore})`).join(' - ')}`
                        }
                        if (w.phonemes?.length > 0) {
                            const weakPhonemes = w.phonemes.filter((p: any) => p.accuracyScore < 60)
                            if (weakPhonemes.length > 0) {
                                detail += `\n  Weak phonemes: ${weakPhonemes.map((p: any) => `"${p.phoneme}"(${p.accuracyScore})`).join(', ')}`
                            }
                        }
                        return detail
                    }).join('\n\n')
                    : 'No problematic words detected'

                const longPausesText = pronunciationMetrics?.longPauses?.length > 0
                    ? pronunciationMetrics.longPauses.map((p: any) =>
                        `• ${p.durationSeconds}s pause after "${p.afterWord}" before "${p.beforeWord}"`
                    ).join('\n')
                    : 'No abnormal pauses detected'

                const message = `Question: "${question}"

Student's spoken answer transcript:
"${transcript}"

=== Azure Pronunciation Assessment Metrics ===

Overall Scores:
- Fluency Score: ${pronunciationMetrics?.fluencyScore || 'N/A'}/100
- Prosody Score (intonation/rhythm): ${pronunciationMetrics?.prosodyScore || 'N/A'}/100
- Accuracy Score: ${pronunciationMetrics?.accuracyScore || 'N/A'}/100
- Overall Pronunciation Score: ${pronunciationMetrics?.pronunciationScore || 'N/A'}/100

Word Statistics:
- Total words spoken: ${pronunciationMetrics?.totalWords || 0}
- Problematic words count: ${pronunciationMetrics?.errorCount || 0}

=== Long Pauses (2.5+ seconds) ===
- Long pauses detected: ${pronunciationMetrics?.longPauseCount || 0}
- Total long pause time: ${pronunciationMetrics?.totalLongPauseTime || 0} seconds

${longPausesText}

=== Problematic Words with Full Breakdown ===
${problematicWordsText}`

                result = await runAssistantAndGetResponse(ASSISTANT_IDS.fluency!, message)
                break
            }

            case 'getFluencyFeedback': {
                const { question, score, range, transcript, pronunciationMetrics } = params

                const problematicWordsText = pronunciationMetrics?.problematicWords?.length > 0
                    ? pronunciationMetrics.problematicWords.map((w: any, i: number) => {
                        let detail = `${i + 1}. "${w.word}"\n   • Overall Score: ${w.accuracyScore}/100\n   • Error Type: ${w.errorType}`
                        if (w.syllables?.length > 0) {
                            detail += `\n   • Syllables: ${w.syllables.map((s: any) => `"${s.syllable}"=${s.accuracyScore}`).join(', ')}`
                        }
                        if (w.phonemes?.length > 0) {
                            const weakPhonemes = w.phonemes.filter((p: any) => p.accuracyScore < 60)
                            if (weakPhonemes.length > 0) {
                                detail += `\n   • Weak Phonemes: ${weakPhonemes.map((p: any) => `"${p.phoneme}"=${p.accuracyScore}`).join(', ')}`
                            }
                        }
                        return detail
                    }).join('\n\n')
                    : 'No problematic words detected'

                const longPausesText = pronunciationMetrics?.longPauses?.length > 0
                    ? pronunciationMetrics.longPauses.map((p: any, i: number) =>
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

=== Long Pauses (2.5+ seconds) ===
- Long pauses detected: ${pronunciationMetrics?.longPauseCount || 0}
- Total long pause time: ${pronunciationMetrics?.totalLongPauseTime || 0} seconds

${longPausesText}

=== Problematic Words with Full Breakdown ===
${problematicWordsText}`

                result = await runAssistantAndGetResponse(ASSISTANT_IDS.fluencyFeedback!, message)
                break
            }

            default:
                return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('OpenAI scoring error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

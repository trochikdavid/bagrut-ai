// Supabase Edge Function for Azure Speech-to-Text
// Handles audio transcription with pronunciation assessment securely on the server side

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Azure Speech configuration from environment (set in Supabase Dashboard)
const AZURE_SPEECH_KEY = Deno.env.get('AZURE_SPEECH_KEY')
const AZURE_SPEECH_REGION = Deno.env.get('AZURE_SPEECH_REGION') || 'eastus'

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
        const { audioUrl } = body

        if (!audioUrl) {
            return new Response(JSON.stringify({ error: 'audioUrl is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (!AZURE_SPEECH_KEY) {
            return new Response(JSON.stringify({ error: 'Azure Speech not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log('Fetching audio from:', audioUrl)

        // Download the audio file
        const audioResponse = await fetch(audioUrl)
        if (!audioResponse.ok) {
            throw new Error(`Failed to download audio: ${audioResponse.status}`)
        }

        const audioBlob = await audioResponse.arrayBuffer()
        console.log('Audio downloaded, size:', audioBlob.byteLength, 'bytes')

        // Use Azure Speech REST API for transcription with pronunciation assessment
        const azureEndpoint = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`

        // Configure pronunciation assessment
        const pronunciationAssessmentConfig = {
            ReferenceText: '',  // Empty for unscripted
            GradingSystem: 'HundredMark',
            Granularity: 'Phoneme',
            EnableMiscue: false,
            EnableProsodyAssessment: true,
        }

        const pronunciationHeader = Buffer.from(JSON.stringify(pronunciationAssessmentConfig)).toString('base64')

        const transcribeResponse = await fetch(`${azureEndpoint}?language=en-US&format=detailed`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
                'Content-Type': 'audio/wav',
                'Pronunciation-Assessment': pronunciationHeader,
            },
            body: audioBlob,
        })

        if (!transcribeResponse.ok) {
            const errorText = await transcribeResponse.text()
            console.error('Azure Speech error:', errorText)
            throw new Error(`Azure Speech API error: ${transcribeResponse.status}`)
        }

        const result = await transcribeResponse.json()
        console.log('Transcription result:', JSON.stringify(result).substring(0, 500))

        // Parse the result
        const nBest = result.NBest?.[0]

        if (!nBest) {
            return new Response(JSON.stringify({
                text: '[No speech detected]',
                confidence: 0,
                pronunciationAssessment: null,
                error: null,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Extract pronunciation assessment
        const pa = nBest.PronunciationAssessment || {}
        const words = nBest.Words || []

        // Parse words with their assessment
        const allWords = words.map((word: any) => {
            const wordAssessment = word.PronunciationAssessment || {}

            const syllables = word.Syllables?.map((syl: any) => ({
                syllable: syl.Syllable,
                accuracyScore: syl.PronunciationAssessment?.AccuracyScore || 0,
                offset: syl.Offset,
                duration: syl.Duration,
            })) || []

            const phonemes = word.Phonemes?.map((ph: any) => ({
                phoneme: ph.Phoneme,
                accuracyScore: ph.PronunciationAssessment?.AccuracyScore || 0,
                offset: ph.Offset,
                duration: ph.Duration,
            })) || []

            return {
                word: word.Word,
                accuracyScore: wordAssessment.AccuracyScore || 0,
                errorType: wordAssessment.ErrorType || 'None',
                syllables,
                phonemes,
                offset: word.Offset,
                duration: word.Duration,
            }
        })

        // Find problematic words
        const problematicWords = allWords.filter((w: any) =>
            w.errorType !== 'None' || w.accuracyScore < 60
        )

        // Detect long pauses (2.5+ seconds)
        const PAUSE_THRESHOLD_SECONDS = 2.5
        const longPauses: any[] = []

        for (let i = 1; i < allWords.length; i++) {
            const prevWord = allWords[i - 1]
            const currWord = allWords[i]

            if (prevWord.offset !== undefined && currWord.offset !== undefined && prevWord.duration !== undefined) {
                const prevEnd = prevWord.offset + prevWord.duration
                const gapTicks = currWord.offset - prevEnd
                const gapSeconds = gapTicks / 10000000  // Convert ticks to seconds

                if (gapSeconds >= PAUSE_THRESHOLD_SECONDS) {
                    longPauses.push({
                        afterWord: prevWord.word,
                        beforeWord: currWord.word,
                        durationSeconds: parseFloat(gapSeconds.toFixed(1)),
                        position: i,
                    })
                }
            }
        }

        const totalLongPauseTime = longPauses.reduce((sum, p) => sum + p.durationSeconds, 0)

        return new Response(JSON.stringify({
            text: nBest.Display || nBest.Lexical || '[No speech detected]',
            confidence: nBest.Confidence || 0,
            pronunciationAssessment: {
                accuracyScore: Math.round(pa.AccuracyScore || 0),
                fluencyScore: Math.round(pa.FluencyScore || 0),
                prosodyScore: Math.round(pa.ProsodyScore || 0),
                pronunciationScore: Math.round(pa.PronScore || 0),
                totalWords: allWords.length,
                errorCount: problematicWords.length,
                problematicWords,
                allWords,
                longPauses,
                longPauseCount: longPauses.length,
                totalLongPauseTime: parseFloat(totalLongPauseTime.toFixed(1)),
            },
            error: null,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Speech transcription error:', error)
        return new Response(JSON.stringify({
            text: null,
            confidence: 0,
            pronunciationAssessment: null,
            error: error.message,
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

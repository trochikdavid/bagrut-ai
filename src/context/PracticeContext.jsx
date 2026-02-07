import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { mockQuestions, generateMockAnalysis } from '../services/mockData'
import * as practiceService from '../services/practiceService'
import * as storageService from '../services/storageService'
import * as adminService from '../services/adminService'
import * as speechService from '../services/speechService'
import * as openaiService from '../services/openaiService'

const PracticeContext = createContext(null)

export function PracticeProvider({ children }) {
    const { user, demoMode } = useAuth()
    const [practices, setPractices] = useState([])
    const [currentPractice, setCurrentPractice] = useState(null)
    const [currentPracticeDbId, setCurrentPracticeDbId] = useState(null)
    const [loading, setLoading] = useState(false)
    const recordingsRef = useRef([])
    const [initialLoading, setInitialLoading] = useState(true)

    // Load practices from database or localStorage
    const loadPractices = useCallback(async () => {
        if (!user?.id) {
            setPractices([])
            setInitialLoading(false)
            return
        }

        try {
            setInitialLoading(true)

            if (demoMode || !isSupabaseConfigured) {
                // Demo mode - load from localStorage
                const stored = localStorage.getItem('bagrut_practices')
                if (stored) {
                    setPractices(JSON.parse(stored))
                }
            } else {
                // Supabase mode
                const userPractices = await practiceService.getUserPractices(user.id)
                setPractices(userPractices)
            }
        } catch (error) {
            setPractices([])
        } finally {
            setInitialLoading(false)
        }
    }, [user?.id, demoMode])

    useEffect(() => {
        loadPractices()
    }, [loadPractices])

    const [questionBank, setQuestionBank] = useState({ 'module-a': [], 'module-b': [], 'module-c': [] })

    // Load questions from database or mock
    const loadQuestions = useCallback(async () => {
        try {
            if (isSupabaseConfigured) {
                // We can reuse the adminService function since it formats correctly
                // Ideally this should be in practiceService or shared service but valid for now
                const fetchedQuestions = await adminService.getQuestions()
                if (fetchedQuestions) {
                    setQuestionBank(fetchedQuestions)
                }
            } else {
                setQuestionBank(mockQuestions)
            }
        } catch (error) {
            setQuestionBank(mockQuestions) // Fallback
        }
    }, [])

    // Load practices AND questions on mount
    useEffect(() => {
        loadPractices()
        loadQuestions()
    }, [loadPractices, loadQuestions])

    // Helper to save practices to localStorage in demo mode
    const savePracticesToStorage = (newPractices) => {
        setPractices(newPractices)
        localStorage.setItem('bagrut_practices', JSON.stringify(newPractices))
    }

    const getQuestions = (moduleType) => {
        // Return from loaded state
        // If state is empty (loading), might return empty array, which is fine for React
        return questionBank[moduleType] || []
    }

    // Get questions prioritizing unpracticed ones (smart selection)
    // This tracks globally across all practice types (module practice + simulation)
    const getUnpracticedQuestions = useCallback(async (moduleType, count = 1) => {
        const allQuestions = questionBank[moduleType] || []

        // If not logged in, no questions, or demo mode - return random
        if (!user?.id || allQuestions.length === 0 || demoMode || !isSupabaseConfigured) {
            const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
            return shuffled.slice(0, count)
        }

        try {
            // Get IDs of already practiced questions from database
            const practicedIds = await practiceService.getPracticedQuestionIds(user.id, moduleType)

            // Separate into unpracticed and practiced
            const unpracticed = allQuestions.filter(q => !practicedIds.includes(q.id))
            const practiced = allQuestions.filter(q => practicedIds.includes(q.id))


            // If enough unpracticed questions, use them
            if (unpracticed.length >= count) {
                const shuffled = [...unpracticed].sort(() => Math.random() - 0.5)
                return shuffled.slice(0, count)
            }

            // Otherwise, use all unpracticed + random from practiced to fill the rest
            // This happens when user has practiced most/all questions (cycle restart)
            const shuffledUnpracticed = [...unpracticed].sort(() => Math.random() - 0.5)
            const shuffledPracticed = [...practiced].sort(() => Math.random() - 0.5)
            const needed = count - unpracticed.length

            return [...shuffledUnpracticed, ...shuffledPracticed.slice(0, needed)]

        } catch (error) {
            const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
            return shuffled.slice(0, count)
        }
    }, [questionBank, user?.id, demoMode])

    const startPractice = async (type, questions, moduleAInfo = null) => {
        setLoading(true)
        // Reset recordings ref
        recordingsRef.current = []
        const localPractice = {
            id: `practice-${Date.now()}`,
            type,
            questions,
            recordings: [],
            startedAt: new Date().toISOString(),
            status: 'in-progress',
            moduleAInfo
        }

        setCurrentPractice(localPractice)
        // Don't create DB record here - will be created in submitPractice
        // This way, practices that are abandoned without submission won't be saved
        setCurrentPracticeDbId(null)

        setLoading(false)
        return localPractice
    }

    const saveRecording = async (questionId, audioBlob, duration) => {
        if (!currentPractice) return

        // Save recording locally only - will be uploaded to storage in submitPractice
        // when the practice is actually submitted (deferred DB creation)
        const newRecording = { questionId, audioBlob, duration, recordedAt: new Date().toISOString() }

        // Update ref first
        const existingRefIndex = recordingsRef.current.findIndex(r => r.questionId === questionId)
        if (existingRefIndex >= 0) {
            recordingsRef.current[existingRefIndex] = newRecording
        } else {
            recordingsRef.current.push(newRecording)
        }

        setCurrentPractice(prev => ({
            ...prev,
            recordings: [
                ...prev.recordings.filter(r => r.questionId !== questionId),
                newRecording
            ]
        }))

    }

    // Get recording blob for a specific question (for playback)
    const getRecordingForQuestion = (questionId) => {
        return recordingsRef.current.find(r => r.questionId === questionId) || null
    }

    // Delete recording for a specific question (for re-recording)
    const deleteRecording = (questionId) => {
        // Remove from ref
        recordingsRef.current = recordingsRef.current.filter(r => r.questionId !== questionId)

        // Remove from state
        if (currentPractice) {
            setCurrentPractice(prev => ({
                ...prev,
                recordings: prev.recordings.filter(r => r.questionId !== questionId)
            }))
        }

    }

    const submitPractice = async () => {
        if (!currentPractice) return null

        setLoading(true)

        try {

            // Create a temporary practice object with the latest recordings from ref
            const practiceToAnalyze = {
                ...currentPractice,
                recordings: recordingsRef.current
            }

            // Generate mock analysis for scores/feedback (will be replaced with GPT later)
            const analysis = generateMockAnalysis(practiceToAnalyze)

            // Create practice in DB now (only when actually submitting)
            let dbPracticeId = currentPracticeDbId
            if (!dbPracticeId && user?.id && !demoMode && isSupabaseConfigured) {
                try {
                    const dbPractice = await practiceService.createPractice(
                        user.id,
                        currentPractice.type,
                        currentPractice.questions,
                        currentPractice.moduleAInfo
                    )
                    dbPracticeId = dbPractice.id
                    setCurrentPracticeDbId(dbPracticeId)
                } catch (error) {
                }
            }

            // Save to database if we have a DB practice ID
            if (dbPracticeId && !demoMode && isSupabaseConfigured) {
                // Upload all recordings to storage now that we have a DB practice ID
                for (const recording of recordingsRef.current) {
                    if (recording.audioBlob && !recording.storagePath) {
                        try {
                            const recordingPath = await storageService.uploadRecording(
                                user.id,
                                dbPracticeId,
                                recording.questionId,
                                recording.audioBlob
                            )
                            recording.storagePath = recordingPath
                        } catch (error) {
                        }
                    }
                }

                // Debug: Log all recordings and their question IDs
                    questionId: r.questionId,
                    hasPath: !!r.storagePath
                })))
                    questionId: qa.questionId,
                    hasUrl: !!qa.recordingUrl
                })))

                // STEP 1: Save per-question analysis with audio URL (transcript pending)
                const savedQuestions = []
                for (let i = 0; i < analysis.questionAnalyses.length; i++) {
                    const qa = analysis.questionAnalyses[i]

                    // Get recording directly from ref to ensure we have the path
                    const rawRecording = recordingsRef.current.find(r => r.questionId === qa.questionId)

                    if (rawRecording && rawRecording.storagePath) {
                        qa.recordingUrl = rawRecording.storagePath
                        qa.audioUrl = rawRecording.storagePath
                    }

                    // Save with null transcript initially
                    qa.transcript = null

                    try {
                        const savedQ = await practiceService.savePracticeQuestion(
                            dbPracticeId,
                            qa,
                            i
                        )
                        savedQuestions.push({ ...qa, dbId: savedQ?.id })
                    } catch (error) {
                        savedQuestions.push(qa)
                    }
                }

                // STEP 2: Transcribe audio using Azure Speech-to-Text
                const recordingsToTranscribe = savedQuestions
                    .filter(q => q.recordingUrl)
                    .map(q => ({ questionId: q.questionId, storagePath: q.recordingUrl }))


                if (recordingsToTranscribe.length > 0 && speechService.isAzureSpeechConfigured()) {
                    const transcriptions = await speechService.transcribeMultiple(recordingsToTranscribe)

                    // STEP 3: Update DB with real transcripts AND analyze with OpenAI
                    for (const qa of savedQuestions) {
                        const transcription = transcriptions.get(qa.questionId)
                        if (transcription && transcription.text) {
                            qa.transcript = transcription.text

                            // Update transcript in database
                            try {
                                await practiceService.updatePracticeQuestionTranscript(
                                    dbPracticeId,
                                    qa.questionId,
                                    transcription.text
                                )
                            } catch (error) {
                            }

                            // STEP 4: Analyze with OpenAI for real scores
                            if (openaiService.isOpenAIConfigured()) {
                                try {

                                    // Check if this is a Module C question
                                    // Module C questions have videoTranscript in the question data
                                    const isModuleCQuestion = currentPractice.type === 'module-c' ||
                                        (currentPractice.type === 'simulation' && qa.moduleType === 'module-c')

                                    let aiAnalysis

                                    if (isModuleCQuestion) {
                                        // Find the video transcript for this question
                                        // It should be stored in the question data from the practice
                                        const questionData = currentPractice.questions?.find(q =>
                                            q.id === qa.questionId || q.questionId === qa.questionId
                                        )
                                        const videoTranscript = questionData?.videoTranscript ||
                                            questionData?.parentVideo?.videoTranscript || ''


                                        aiAnalysis = await openaiService.analyzeAnswerModuleC({
                                            question: qa.questionText,
                                            studentTranscript: transcription.text,
                                            videoTranscript,
                                            pronunciationMetrics: transcription.pronunciationAssessment
                                        })
                                    } else {
                                        // Regular analysis for Module A/B with pronunciation metrics
                                        aiAnalysis = await openaiService.analyzeAnswer(
                                            qa.questionText,
                                            transcription.text,
                                            transcription.pronunciationAssessment // Pass Azure pronunciation metrics
                                        )
                                    }

                                    // Update question analysis with real scores
                                    qa.scores = {
                                        topicDevelopment: aiAnalysis.topicDevelopment.score,
                                        fluency: aiAnalysis.fluency?.score || null, // Module C has no fluency
                                        vocabulary: aiAnalysis.vocabulary.score,
                                        grammar: aiAnalysis.grammar.score
                                    }
                                    qa.totalScore = aiAnalysis.totalScore
                                    // Preserve videoUrl if it exists (for Module C)
                                    const originalQuestion = currentPractice.questions?.find(q => q.id === qa.questionId)

                                    qa.feedback = {
                                        videoUrl: originalQuestion?.videoUrl || qa.feedback?.videoUrl,
                                        topicDevelopment: aiAnalysis.topicDevelopment,
                                        fluency: aiAnalysis.fluency, // May be null for Module C
                                        vocabulary: aiAnalysis.vocabulary,
                                        grammar: aiAnalysis.grammar
                                    }

                                    // Save detailed feedback points from Topic Development
                                    qa.preservationPoints = aiAnalysis.preservationPoints || []
                                    qa.improvementPoints = aiAnalysis.improvementPoints || []


                                    // Update scores in database
                                    try {
                                        await practiceService.updatePracticeQuestionScores(
                                            dbPracticeId,
                                            qa.questionId,
                                            qa.scores,
                                            qa.feedback,
                                            qa.totalScore
                                        )
                                    } catch (dbError) {
                                    }
                                } catch (aiError) {
                                    // Keep mock scores if OpenAI fails
                                }
                            } else {
                            }
                        } else if (transcription?.error) {
                            qa.transcript = `[Transcription unavailable: ${transcription.error}]`
                        }
                    }

                    // Update analysis with real analyzed questions
                    analysis.questionAnalyses = savedQuestions

                    // Recalculate total score based on real scores
                    if (savedQuestions.length > 0) {
                        const avgScore = Math.round(
                            savedQuestions.reduce((sum, q) => sum + (q.totalScore || 0), 0) / savedQuestions.length
                        )
                        analysis.totalScore = avgScore

                        // Recalculate average scores per criteria (ignoring nulls)
                        const calculateAverage = (questions, key) => {
                            const validQuestions = questions.filter(q => q.scores?.[key] !== null && q.scores?.[key] !== undefined)
                            if (validQuestions.length === 0) return 0
                            return Math.round(validQuestions.reduce((sum, q) => sum + q.scores[key], 0) / validQuestions.length)
                        }

                        analysis.scores = {
                            topicDevelopment: calculateAverage(savedQuestions, 'topicDevelopment'),
                            fluency: calculateAverage(savedQuestions, 'fluency'),
                            vocabulary: calculateAverage(savedQuestions, 'vocabulary'),
                            grammar: calculateAverage(savedQuestions, 'grammar')
                        }

                        // Aggregate all preservation and improvement points from all questions
                        const allPreservation = savedQuestions.flatMap(q => q.preservationPoints || [])
                        const allImprovement = savedQuestions.flatMap(q => q.improvementPoints || [])

                        // Remove duplicates and limit
                        analysis.strengths = [...new Set(allPreservation)].slice(0, 10)
                        analysis.improvements = [...new Set(allImprovement)].slice(0, 10)

                    }
                } else {
                }

                // Complete the practice with analysis results
                try {
                    await practiceService.completePractice(dbPracticeId, analysis)
                } catch (error) {
                }
            }

            const completedPractice = {
                ...currentPractice,
                ...analysis,
                id: dbPracticeId || currentPractice.id,
                status: 'completed',
                completedAt: new Date().toISOString()
            }

            if (demoMode || !isSupabaseConfigured) {
                // Demo mode - save to localStorage
                const newPractices = [completedPractice, ...practices]
                savePracticesToStorage(newPractices)
            } else {
                // Reload practices from database
                await loadPractices()
            }

            setCurrentPractice(null)
            setCurrentPracticeDbId(null)
            setLoading(false)

            return completedPractice
        } catch (error) {
            setLoading(false)
            return null
        }
    }

    const getPracticeById = async (id) => {
        // First check local state
        const localPractice = practices.find(p => p.id === id)
        if (localPractice) return localPractice

        // Demo mode - can only use local state
        if (demoMode || !isSupabaseConfigured) {
            return null
        }

        // Try to fetch from database
        try {
            const practice = await practiceService.getPracticeById(id)
            return {
                id: practice.id,
                type: practice.type,
                status: practice.status,
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
                questionAnalyses: practice.questionAnalyses
            }
        } catch (error) {
            return null
        }
    }

    const getStats = () => {
        if (practices.length === 0) {
            return {
                totalPractices: 0,
                averageScore: 0,
                moduleACount: 0,
                moduleBCount: 0,
                moduleCCount: 0,
                simulationCount: 0,

                recentPractices: [],
                recentScores: [],
                improvement: 0
            }
        }

        const completedPractices = practices.filter(p => p.status === 'completed')
        const scores = completedPractices.map(p => p.totalScore).filter(s => s != null)
        const averageScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0

        // Calculate improvement (last 5 vs previous 5)
        const last5 = scores.slice(0, 5)
        const prev5 = scores.slice(5, 10)
        const improvement = prev5.length > 0
            ? Math.round((last5.reduce((a, b) => a + b, 0) / last5.length) - (prev5.reduce((a, b) => a + b, 0) / prev5.length))
            : 0

        const recentPractices = completedPractices
            .sort((a, b) => new Date(a.completedAt || a.startedAt) - new Date(b.completedAt || b.startedAt))
            .slice(-10)

        return {
            totalPractices: completedPractices.length,
            averageScore,
            moduleACount: completedPractices.filter(p => p.type === 'module-a').length,
            moduleBCount: completedPractices.filter(p => p.type === 'module-b').length,
            moduleCCount: completedPractices.filter(p => p.type === 'module-c').length,
            simulationCount: completedPractices.filter(p => p.type === 'simulation').length,
            recentScores: scores.slice(0, 10).reverse(),
            recentPractices,
            improvement
        }
    }

    const clearHistory = async () => {
        if (demoMode || !isSupabaseConfigured) {
            // Demo mode
            setPractices([])
            localStorage.removeItem('bagrut_practices')
            return { success: true }
        }

        if (!user?.id) {
            return { success: false, error: 'Not authenticated' }
        }

        try {
            await practiceService.clearUserPractices(user.id)
            setPractices([])
            return { success: true }
        } catch (error) {
            return { success: false, error: 'Failed to clear history' }
        }
    }

    return (
        <PracticeContext.Provider value={{
            practices,
            currentPractice,
            loading: loading || initialLoading,
            demoMode: demoMode || !isSupabaseConfigured,
            getQuestions,
            getUnpracticedQuestions,
            startPractice,
            saveRecording,
            getRecordingForQuestion,
            deleteRecording,
            submitPractice,
            getPracticeById,
            getStats,
            clearHistory,
            refreshPractices: loadPractices
        }}>
            {children}
        </PracticeContext.Provider>
    )
}

export function usePractice() {
    const context = useContext(PracticeContext)
    if (!context) {
        throw new Error('usePractice must be used within a PracticeProvider')
    }
    return context
}

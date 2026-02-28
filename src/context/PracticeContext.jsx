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

    // Track viewed practices for "New!" badge
    const [viewedPractices, setViewedPractices] = useState({}) // { practiceId: true }

    // Load viewed status from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem('bagrut_viewed_practices')
            if (stored) {
                setViewedPractices(JSON.parse(stored))
            }
        } catch (e) {
            console.error('Failed to load viewed practices', e)
        }
    }, [])

    // Save viewed status to localStorage
    const markAsViewed = useCallback((practiceId) => {
        setViewedPractices(prev => {
            if (prev[practiceId]) return prev // Already viewed

            const newState = { ...prev, [practiceId]: true }
            localStorage.setItem('bagrut_viewed_practices', JSON.stringify(newState))
            return newState
        })
    }, [])

    // Check if a practice is unviewed (completed but not in viewed map)
    const isPracticeNew = useCallback((practiceId) => {
        return !viewedPractices[practiceId]
    }, [viewedPractices])

    // Get count of unviewed COMPLETED practices
    const getUnviewedCount = useCallback(() => {
        return practices.filter(p =>
            (p.status === 'completed' || p.processing_status === 'completed') &&
            !viewedPractices[p.id]
        ).length
    }, [practices, viewedPractices])

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
            // Demo mode - use the old synchronous flow with mock data
            if (demoMode || !isSupabaseConfigured) {
                const practiceToAnalyze = {
                    ...currentPractice,
                    recordings: recordingsRef.current
                }
                const analysis = generateMockAnalysis(practiceToAnalyze)
                const completedPractice = {
                    ...currentPractice,
                    ...analysis,
                    status: 'completed',
                    completedAt: new Date().toISOString()
                }
                const newPractices = [completedPractice, ...practices]
                savePracticesToStorage(newPractices)
                setCurrentPractice(null)
                setCurrentPracticeDbId(null)
                setLoading(false)
                return completedPractice
            }

            // === PRODUCTION MODE: Background Processing ===

            // Step 1: Create practice in DB with processing_status: 'pending'
            let dbPracticeId = currentPracticeDbId
            if (!dbPracticeId && user?.id) {
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
                    console.error('Failed to create practice:', error)
                    setLoading(false)
                    return null
                }
            }

            // Step 2: Upload all recordings to storage
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
                        console.error('Failed to upload recording:', error)
                    }
                }
            }

            // Step 3: Save practice questions with recording URLs (no scores yet)
            const questions = currentPractice.questions || []
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i]
                const recording = recordingsRef.current.find(r => r.questionId === q.id)

                const questionData = {
                    questionId: q.id,
                    questionText: q.text || q.questionText,
                    transcript: null, // Will be filled by background processing
                    duration: recording?.duration,
                    scores: null,
                    feedback: null,
                    totalScore: null,
                    recordingUrl: recording?.storagePath
                }

                try {
                    await practiceService.savePracticeQuestion(dbPracticeId, questionData, i)
                } catch (error) {
                    console.error('Failed to save question:', error)
                }
            }

            // Step 4: Client-side transcription using Azure SDK
            // (SDK requires browser APIs like AudioContext, so must run client-side)

            for (const recording of recordingsRef.current) {
                if (!recording.storagePath) continue

                try {
                    const result = await speechService.transcribeAudio(recording.storagePath)

                    // Trim pronunciation data — only keep what's needed for scoring
                    let trimmedPronunciation = null
                    if (result.pronunciationAssessment) {
                        const pa = result.pronunciationAssessment
                        trimmedPronunciation = {
                            accuracyScore: pa.accuracyScore,
                            fluencyScore: pa.fluencyScore,
                            prosodyScore: pa.prosodyScore,
                            pronunciationScore: pa.pronunciationScore,
                            totalWords: pa.totalWords,
                            errorCount: pa.errorCount,
                            problematicWords: (pa.problematicWords || []).map(w => ({
                                word: w.word,
                                accuracyScore: w.accuracyScore,
                                errorType: w.errorType
                            })),
                            longPauses: pa.longPauses || [],
                            longPauseCount: pa.longPauseCount,
                            totalLongPauseTime: pa.totalLongPauseTime
                        }
                    }

                    const transcript = result.text || '[No speech detected]'

                    // Save transcript + pronunciation to DB
                    await practiceService.updatePracticeQuestionTranscript(
                        dbPracticeId,
                        recording.questionId,
                        transcript,
                        trimmedPronunciation
                    )
                } catch (error) {
                    console.error(`Transcription failed for ${recording.questionId}:`, error)
                    // Save failure marker
                    try {
                        await practiceService.updatePracticeQuestionTranscript(
                            dbPracticeId,
                            recording.questionId,
                            '[Transcription failed]'
                        )
                    } catch (e) { /* ignore */ }
                }
            }

            // Step 5: Trigger background processing (fire-and-forget)
            // Edge Function reads transcripts + pronunciation from DB
            practiceService.triggerProcessing(dbPracticeId)
                .catch(err => console.error('Background processing error:', err))

            // Step 6: Return immediately - analysis continues server-side
            const pendingPractice = {
                ...currentPractice,
                id: dbPracticeId,
                status: 'in-progress',
                processingStatus: 'processing',
                startedAt: new Date().toISOString()
            }

            // Reload practices to show the new pending one
            await loadPractices()

            setCurrentPractice(null)
            setCurrentPracticeDbId(null)
            setLoading(false)

            return pendingPractice
        } catch (error) {
            console.error('Submit practice error:', error)
            setLoading(false)
            return null
        }
    }

    const getPracticeById = async (id, forceRefresh = false) => {
        // First check local state
        const localPractice = practices.find(p => p.id === id)

        if (localPractice && !forceRefresh) {
            return localPractice
        }

        // Demo mode - can only use local state
        if (demoMode || !isSupabaseConfigured) {
            return localPractice || null
        }

        // Try to fetch from database
        try {
            const practice = await practiceService.getPracticeById(id)
            return {
                id: practice.id,
                type: practice.type,
                status: practice.status,
                processing_status: practice.processing_status,
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
            refreshPractices: loadPractices,
            markAsViewed,
            isPracticeNew,
            getUnviewedCount
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

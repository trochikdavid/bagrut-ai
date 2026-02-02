import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePractice } from '../../context/PracticeContext'
import AudioRecorder from './AudioRecorder'
import { FiArrowRight, FiCheck, FiClock, FiPlay, FiAlertTriangle, FiTrash2 } from 'react-icons/fi'
import './Practice.css'

// Convert YouTube watch URL to embed URL
const getYouTubeEmbedUrl = (url) => {
    if (!url) return null

    // Already an embed URL
    if (url.includes('/embed/')) return url

    // YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
    if (watchMatch) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`
    }

    // YouTube short URL: https://youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/)
    if (shortMatch) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`
    }

    // Return original if no match (might be a different video service)
    return url
}

export default function Simulation() {
    const navigate = useNavigate()
    const { getQuestions, getUnpracticedQuestions, startPractice, saveRecording, getRecordingForQuestion, deleteRecording, submitPractice, loading } = usePractice()

    const [phase, setPhase] = useState('intro') // intro, moduleA, moduleB, moduleC, complete
    const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds
    const [timerActive, setTimerActive] = useState(false)

    // Module A state
    const [moduleAQuestions, setModuleAQuestions] = useState([])
    const [selectedModuleAQuestion, setSelectedModuleAQuestion] = useState(null)
    const [moduleARecorded, setModuleARecorded] = useState(false)

    // Module B state
    const [moduleBQuestion, setModuleBQuestion] = useState(null)
    const [moduleBRecorded, setModuleBRecorded] = useState(false)

    // Module C state
    const [moduleCContent, setModuleCContent] = useState(null)
    const [watchedVideo, setWatchedVideo] = useState(false)
    const [currentCQuestion, setCurrentCQuestion] = useState(0)
    const [moduleCRecordings, setModuleCRecordings] = useState({})
    const [viewingLastQuestion, setViewingLastQuestion] = useState(false)

    const [submitting, setSubmitting] = useState(false)
    const [loadingQuestions, setLoadingQuestions] = useState(true)
    const [showExitConfirm, setShowExitConfirm] = useState(false)
    const timerRef = useRef(null)

    const questionsInitialized = useRef(false)

    // Initialize questions with smart selection (when they become available from DB)
    useEffect(() => {
        // If already initialized, skip
        if (questionsInitialized.current) return

        const questionsA = getQuestions('module-a')
        const questionsB = getQuestions('module-b')
        const questionsC = getQuestions('module-c')

        // Check if at least one module has questions
        if (questionsA.length === 0 && questionsB.length === 0 && (!questionsC || questionsC.length === 0)) {
            return // Questions not loaded yet
        }

        // Use async function to get smart questions
        const loadSmartQuestions = async () => {
            setLoadingQuestions(true)
            console.log('🎬 Initializing simulation with smart question selection')

            // Get unpracticed questions for all modules in parallel
            const [smartQuestionsA, smartQuestionsB, smartQuestionsC] = await Promise.all([
                getUnpracticedQuestions('module-a', 2),
                getUnpracticedQuestions('module-b', 1),
                getUnpracticedQuestions('module-c', 1)
            ])

            console.log('🎯 Smart selection results:')
            console.log('   Module A:', smartQuestionsA.map(q => q.id))
            console.log('   Module B:', smartQuestionsB[0]?.id)
            console.log('   Module C:', smartQuestionsC[0]?.id)

            if (smartQuestionsA.length > 0) {
                setModuleAQuestions(smartQuestionsA)
            }
            if (smartQuestionsB.length > 0) {
                setModuleBQuestion(smartQuestionsB[0])
            }
            if (smartQuestionsC.length > 0) {
                console.log('🎬 Selected Module C content:', smartQuestionsC[0])
                setModuleCContent(smartQuestionsC[0])
            }

            setLoadingQuestions(false)
        }

        loadSmartQuestions()
        questionsInitialized.current = true
    }, [getQuestions, getUnpracticedQuestions])

    // Cleanup timer on unmount only
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [])

    const startSimulation = () => {
        // Don't start the practice with questions yet - we'll update when Module A is selected
        setPhase('moduleA')
        setTimerActive(true)

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current)
                    handleTimeUp()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const handleTimeUp = async () => {
        setTimerActive(false)
        setSubmitting(true)
        const result = await submitPractice()
        if (result) {
            navigate(`/analysis/${result.id}`)
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getTimerClass = () => {
        if (timeLeft <= 60) return 'danger'
        if (timeLeft <= 300) return 'warning'
        return ''
    }

    // Module A handlers
    const handleSelectModuleAQuestion = (q) => {
        setSelectedModuleAQuestion(q)
        // Find the index of selected question to preserve original order
        const selectedIndex = moduleAQuestions.findIndex(mq => mq.id === q.id)
        // Store both questions with their original positions
        const moduleAInfo = {
            questions: moduleAQuestions, // Both questions in original order
            selectedIndex: selectedIndex // Which one was selected (0 or 1)
        }

        // Include video transcript in Module C questions for AI analysis
        const moduleCQuestions = moduleCContent?.questions || []
        const moduleCQuestionsWithTranscript = moduleCQuestions.map(cq => ({
            ...cq,
            videoTranscript: moduleCContent?.videoTranscript || '',
            moduleType: 'module-c'
        }))

        // Now start the practice with only the selected questions (4 total)
        startPractice('simulation', [
            { ...q, moduleType: 'module-a' }, // Module A question with type
            { ...moduleBQuestion, moduleType: 'module-b' }, // Module B question with type
            ...moduleCQuestionsWithTranscript // Module C questions with transcript and type
        ], moduleAInfo) // Pass full Module A info for display in analysis
    }

    const handleModuleARecording = (audioBlob, duration) => {
        saveRecording(selectedModuleAQuestion.id, audioBlob, duration)
        setModuleARecorded(true)
    }

    const goToModuleB = () => {
        setPhase('moduleB')
    }

    const goBackToModuleA = () => {
        // Go back to Module A - keep recordings, allow redo
        setPhase('moduleA')
    }

    // Module B handlers
    const handleModuleBRecording = (audioBlob, duration) => {
        saveRecording(moduleBQuestion.id, audioBlob, duration)
        setModuleBRecorded(true)
    }

    const goToModuleC = () => {
        setPhase('moduleC')
    }

    const goBackToModuleB = () => {
        // Go back to Module B - keep recordings
        setPhase('moduleB')
    }

    // Module C handlers
    const handleModuleCRecording = (audioBlob, duration) => {
        const questions = moduleCContent?.questions || []
        const currentQuestion = questions[currentCQuestion]

        console.log('🎤 Module C Recording:', {
            currentCQuestion,
            questionCount: questions.length,
            currentQuestion,
            hasId: !!currentQuestion?.id
        })

        if (currentQuestion) {
            // Use generated ID or create one from index
            const questionId = currentQuestion.id || `moduleC-q${currentCQuestion}`
            saveRecording(questionId, audioBlob, duration)
            setModuleCRecordings(prev => ({ ...prev, [currentCQuestion]: true }))
            console.log('✅ Module C recording saved for question', currentCQuestion)
        } else {
            console.error('❌ Module C question not found:', currentCQuestion, moduleCContent)
        }
    }

    const nextCQuestion = () => {
        setCurrentCQuestion(prev => prev + 1)
    }

    const prevCQuestion = () => {
        if (currentCQuestion > 0) {
            setCurrentCQuestion(prev => prev - 1)
        } else {
            // Go back to Module B
            goBackToModuleB()
        }
    }

    const finishSimulation = async () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setSubmitting(true)
        const result = await submitPractice()
        if (result) {
            navigate(`/analysis/${result.id}`)
        }
    }

    const allCQuestionsAnswered = moduleCContent &&
        moduleCContent.questions &&
        Object.keys(moduleCRecordings).length === moduleCContent.questions.length

    // Show submission screen only if all answered AND not viewing last question
    const showSubmissionScreen = allCQuestionsAnswered && !viewingLastQuestion

    if (submitting || loading || loadingQuestions) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">{submitting ? 'מנתח את הסימולציה...' : 'טוען שאלות...'}</p>
                <p className="loading-subtext">{submitting ? 'מעבד את כל ההקלטות' : ''}</p>
            </div>
        )
    }

    return (
        <div className="page animate-fade-in" style={{ paddingTop: 0 }}>
            <div className="practice-session" style={{ marginTop: '40px' }}>
                <header className="practice-header simulation-header">
                    {/* Back button - RIGHT corner (first in DOM for RTL) */}
                    {phase !== 'intro' ? (
                        <button
                            className="back-button"
                            onClick={() => {
                                if (phase === 'moduleA') {
                                    // Allow unselecting Module A question
                                    if (selectedModuleAQuestion) {
                                        setSelectedModuleAQuestion(null)
                                        setModuleARecorded(false)
                                    }
                                    return
                                }
                                if (phase === 'moduleB') goBackToModuleA()
                                if (phase === 'moduleC') {
                                    const totalQuestions = moduleCContent?.questions?.length || 2
                                    // If on submission screen, go back to last question
                                    if (showSubmissionScreen) {
                                        setViewingLastQuestion(true)
                                        setCurrentCQuestion(totalQuestions - 1)
                                        return
                                    }
                                    // If viewing last question, go back to submission screen check
                                    if (viewingLastQuestion && currentCQuestion === totalQuestions - 1) {
                                        // Go to previous question
                                        if (currentCQuestion > 0) {
                                            setCurrentCQuestion(prev => prev - 1)
                                        } else {
                                            setWatchedVideo(false)
                                        }
                                        return
                                    }
                                    // Normal back navigation within Module C
                                    if (currentCQuestion > 0) {
                                        setCurrentCQuestion(prev => prev - 1)
                                    } else if (watchedVideo) {
                                        setWatchedVideo(false)
                                    } else {
                                        goBackToModuleB()
                                    }
                                }
                            }}
                            disabled={phase === 'moduleA' && !selectedModuleAQuestion}
                        >
                            <FiArrowRight />
                            חזור
                        </button>
                    ) : <div style={{ width: '80px' }}></div>}

                    {/* Timer or Title - center */}
                    {timerActive ? (
                        <div className={`simulation-timer ${getTimerClass()}`}>
                            <FiClock />
                            {formatTime(timeLeft)}
                        </div>
                    ) : (
                        <span className="simulation-header-title">סימולציה</span>
                    )}

                    {/* Exit button - LEFT corner (last in DOM for RTL) */}
                    {phase === 'intro' ? (
                        <Link to="/practice" className="exit-button" title="יציאה">
                            ✕
                        </Link>
                    ) : (
                        <button
                            className="exit-button"
                            onClick={() => setShowExitConfirm(true)}
                            title="יציאה מהסימולציה"
                        >
                            ✕
                        </button>
                    )}
                </header>

                {/* Intro Phase */}
                {phase === 'intro' && (
                    <div className="animate-fade-in">
                        <div className="question-card card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🎯</div>
                            <h2 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.25rem' }}>סימולציית בגרות בעל-פה</h2>
                            <p className="text-secondary" style={{ marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>
                                כל 3 המודולים • 30 דקות
                            </p>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--space-sm)',
                                marginBottom: 'var(--space-lg)',
                                textAlign: 'right'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>שאלה כללית או דעה</span>
                                    <strong style={{ fontSize: '0.875rem' }}>מודול A (25%)</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>שאלה על הפרויקט</span>
                                    <strong style={{ fontSize: '0.875rem' }}>מודול B (25%)</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>סרטון + 2 שאלות הבנה</span>
                                    <strong style={{ fontSize: '0.875rem' }}>מודול C (50%)</strong>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={startSimulation}
                                style={{ width: '100%' }}
                            >
                                <FiPlay />
                                התחל סימולציה
                            </button>
                        </div>
                    </div>
                )}

                {/* Module A Phase */}
                {phase === 'moduleA' && (
                    <div className="animate-fade-in">
                        <div className="module-progress">
                            <div className={`progress-step ${moduleARecorded ? 'completed' : 'active'}`}>
                                <div className="progress-step-indicator">{moduleARecorded ? <FiCheck /> : 'A'}</div>
                                <span className="progress-step-label">מודול A</span>
                            </div>
                            <div className="progress-connector"></div>
                            <div className="progress-step">
                                <div className="progress-step-indicator">B</div>
                                <span className="progress-step-label">מודול B</span>
                            </div>
                            <div className="progress-connector"></div>
                            <div className="progress-step">
                                <div className="progress-step-indicator">C</div>
                                <span className="progress-step-label">מודול C</span>
                            </div>
                        </div>

                        {!selectedModuleAQuestion ? (
                            <>
                                <div className="question-selector-card card" style={{
                                    background: 'linear-gradient(135deg, var(--surface-elevated) 0%, var(--surface) 100%)',
                                    border: '2px solid var(--primary)',
                                    textAlign: 'center',
                                    padding: 'var(--space-md)'
                                }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: 'var(--space-xs) var(--space-md)',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        marginBottom: 'var(--space-sm)'
                                    }}>
                                        <span>מודול A</span>
                                        <span>•</span>
                                        <span dir="ltr">25%</span>
                                    </div>
                                    <h3 style={{
                                        fontSize: '1.25rem',
                                        marginBottom: 'var(--space-xs)',
                                        color: 'var(--text-primary)'
                                    }}>בחירת שאלה</h3>
                                    <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
                                        יש לבחור אחת משתי האפשרויות
                                    </p>
                                </div>
                                <div className="question-choices" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--space-sm)',
                                    marginTop: 'var(--space-md)'
                                }}>
                                    {moduleAQuestions.map((q, idx) => (
                                        <button
                                            key={q.id}
                                            className="question-choice card"
                                            onClick={() => handleSelectModuleAQuestion(q)}
                                            style={{
                                                textAlign: 'right',
                                                padding: 'var(--space-lg)',
                                                cursor: 'pointer',
                                                transition: 'all var(--transition)',
                                                border: '1px solid var(--border)',
                                                background: 'var(--surface)'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 'var(--space-md)'
                                            }}>
                                                <span style={{
                                                    background: 'var(--primary-light)',
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <span>שאלה {idx + 1}</span>
                                                    <span>•</span>
                                                    <span dir="ltr">25%</span>
                                                </span>
                                                <div className="choice-text" style={{ flex: 1 }}>{q.text}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="question-card card">
                                    <span className="question-number" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <span>מודול A</span>
                                        <span>•</span>
                                        <span dir="ltr">25%</span>
                                    </span>
                                    <p className="question-text">{selectedModuleAQuestion.text}</p>
                                </div>

                                {/* Show existing recording if we have one */}
                                {moduleARecorded && getRecordingForQuestion(selectedModuleAQuestion.id)?.audioBlob ? (
                                    <div className="recording-preview card">
                                        <div className="preview-header">
                                            <h4>הקלטה שמורה</h4>
                                            <span className="text-muted">מודול A</span>
                                        </div>
                                        <audio
                                            controls
                                            className="audio-player"
                                            src={URL.createObjectURL(getRecordingForQuestion(selectedModuleAQuestion.id).audioBlob)}
                                        />
                                        <div className="preview-actions">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    deleteRecording(selectedModuleAQuestion.id)
                                                    setModuleARecorded(false)
                                                }}
                                            >
                                                <FiTrash2 /> מחק והקלט מחדש
                                            </button>
                                            <button className="btn btn-primary btn-lg" onClick={goToModuleB}>
                                                המשך למודול B
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <AudioRecorder
                                            onRecordingComplete={handleModuleARecording}
                                            key={`moduleA-${moduleARecorded ? 'recorded' : 'new'}`}
                                        />
                                        {moduleARecorded && (
                                            <div className="submit-section animate-slide-up">
                                                <p className="text-success"><FiCheck /> מודול A הושלם!</p>
                                                <button className="btn btn-primary btn-lg" onClick={goToModuleB}>המשך למודול B</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Module B Phase */}
                {phase === 'moduleB' && (
                    <div className="animate-fade-in">
                        <div className="module-progress">
                            <div className="progress-step completed">
                                <div className="progress-step-indicator"><FiCheck /></div>
                                <span className="progress-step-label">מודול A</span>
                            </div>
                            <div className="progress-connector completed"></div>
                            <div className={`progress-step ${moduleBRecorded ? 'completed' : 'active'}`}>
                                <div className="progress-step-indicator">{moduleBRecorded ? <FiCheck /> : 'B'}</div>
                                <span className="progress-step-label">מודול B</span>
                            </div>
                            <div className="progress-connector"></div>
                            <div className="progress-step">
                                <div className="progress-step-indicator">C</div>
                                <span className="progress-step-label">מודול C</span>
                            </div>
                        </div>

                        <>
                            <div className="question-card card">
                                <span className="question-number" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span>מודול B</span>
                                    <span>•</span>
                                    <span dir="ltr">25%</span>
                                </span>
                                <p className="question-text">{moduleBQuestion?.text}</p>
                            </div>

                            {/* Show existing recording if we have one */}
                            {moduleBRecorded && moduleBQuestion && getRecordingForQuestion(moduleBQuestion.id)?.audioBlob ? (
                                <div className="recording-preview card">
                                    <div className="preview-header">
                                        <h4>הקלטה שמורה</h4>
                                        <span className="text-muted">מודול B</span>
                                    </div>
                                    <audio
                                        controls
                                        className="audio-player"
                                        src={URL.createObjectURL(getRecordingForQuestion(moduleBQuestion.id).audioBlob)}
                                    />
                                    <div className="preview-actions">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                deleteRecording(moduleBQuestion.id)
                                                setModuleBRecorded(false)
                                            }}
                                        >
                                            <FiTrash2 /> מחק והקלט מחדש
                                        </button>
                                        <button className="btn btn-primary btn-lg" onClick={goToModuleC}>
                                            המשך למודול C
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <AudioRecorder
                                        onRecordingComplete={handleModuleBRecording}
                                        key={`moduleB-${moduleBRecorded ? 'recorded' : 'new'}`}
                                    />
                                    {moduleBRecorded && (
                                        <div className="submit-section animate-slide-up">
                                            <p className="text-success"><FiCheck /> מודול B הושלם!</p>
                                            <button className="btn btn-primary btn-lg" onClick={goToModuleC}>המשך למודול C</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    </div>
                )}

                {/* Module C Phase */}
                {phase === 'moduleC' && (
                    <div className="animate-fade-in">
                        <div className="module-progress">
                            <div className="progress-step completed">
                                <div className="progress-step-indicator"><FiCheck /></div>
                                <span className="progress-step-label">מודול A</span>
                            </div>
                            <div className="progress-connector completed"></div>
                            <div className="progress-step completed">
                                <div className="progress-step-indicator"><FiCheck /></div>
                                <span className="progress-step-label">מודול B</span>
                            </div>
                            <div className="progress-connector completed"></div>
                            <div className={`progress-step ${allCQuestionsAnswered ? 'completed' : 'active'}`}>
                                <div className="progress-step-indicator">{allCQuestionsAnswered ? <FiCheck /> : 'C'}</div>
                                <span className="progress-step-label">מודול C</span>
                            </div>
                        </div>

                        {!watchedVideo ? (
                            <>
                                <div className="question-card card">
                                    <span className="question-number" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <span>מודול C</span>
                                        <span>•</span>
                                        <span dir="ltr">50%</span>
                                    </span>
                                    <h3>צפייה בסרטון</h3>
                                </div>
                                {moduleCContent?.videoUrl ? (
                                    <div className="video-container">
                                        <iframe
                                            src={getYouTubeEmbedUrl(moduleCContent.videoUrl)}
                                            title={moduleCContent.videoTitle || 'Video'}
                                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                        <div className="video-title">📹 {moduleCContent?.videoTitleHe || moduleCContent?.videoTitle}</div>
                                    </div>
                                ) : (
                                    <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                                        <p className="text-warning">⚠️ לא נמצא סרטון למודול C</p>
                                        <p className="text-muted">אנא וודא שהוספו סרטוני מודול C במערכת הניהול</p>
                                    </div>
                                )}
                                <button className="btn btn-primary btn-lg" onClick={() => setWatchedVideo(true)} style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                                    <FiPlay />סיימתי לצפות, אפשר להמשיך
                                </button>
                            </>
                        ) : !showSubmissionScreen ? (
                            <>
                                {/* Navigation bar for Module C */}
                                <div className="module-c-nav card" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 'var(--space-sm)',
                                    padding: 'var(--space-xs) var(--space-md)'
                                }}>
                                    <button
                                        onClick={() => setWatchedVideo(false)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-xs)',
                                            color: 'var(--primary-light)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            padding: 'var(--space-xs) var(--space-sm)',
                                            borderRadius: 'var(--radius-sm)'
                                        }}
                                        className="hover-effect"
                                    >
                                        <FiPlay style={{ transform: 'rotate(180deg)' }} /> צפייה נוספת בסרטון
                                    </button>
                                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                                        שאלה {currentCQuestion + 1} מתוך {moduleCContent?.questions?.length || 2}
                                    </span>
                                </div>

                                <div className="question-card card">
                                    <span className="question-number" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <span>מודול C</span>
                                        <span>•</span>
                                        <span dir="ltr">25%</span>
                                    </span>
                                    <p className="question-text">{moduleCContent?.questions?.[currentCQuestion]?.text || 'שאלה לא נמצאה'}</p>
                                </div>

                                {/* Check if recording exists for this question */}
                                {(() => {
                                    const questionId = moduleCContent?.questions?.[currentCQuestion]?.id || `moduleC-q${currentCQuestion}`
                                    const existingRecording = getRecordingForQuestion(questionId)

                                    if (moduleCRecordings[currentCQuestion] && existingRecording?.audioBlob) {
                                        // Show recording preview with delete option
                                        return (
                                            <div className="recording-preview card animate-slide-up">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                                    <FiCheck style={{ color: 'var(--success)', fontSize: '1.5rem' }} />
                                                    <span className="text-success">הקלטה נשמרה!</span>
                                                </div>
                                                <audio
                                                    controls
                                                    src={URL.createObjectURL(existingRecording.audioBlob)}
                                                    style={{ width: '100%', marginBottom: 'var(--space-md)' }}
                                                />
                                                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => {
                                                            deleteRecording(questionId)
                                                            setModuleCRecordings(prev => ({ ...prev, [currentCQuestion]: false }))
                                                        }}
                                                    >
                                                        <FiTrash2 /> מחק והקלט מחדש
                                                    </button>
                                                    {currentCQuestion > 0 && (
                                                        <button className="btn btn-secondary" onClick={() => setCurrentCQuestion(prev => prev - 1)}>
                                                            ← שאלה קודמת
                                                        </button>
                                                    )}
                                                    {currentCQuestion < (moduleCContent?.questions?.length || 2) - 1 ? (
                                                        <button className="btn btn-primary" onClick={nextCQuestion}>המשך לשאלה הבאה</button>
                                                    ) : allCQuestionsAnswered && (
                                                        <button className="btn btn-primary" onClick={() => setViewingLastQuestion(false)}>המשך להגשה</button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    } else {
                                        // Show recorder
                                        return (
                                            <>
                                                <AudioRecorder
                                                    onRecordingComplete={handleModuleCRecording}
                                                    key={`moduleC-q${currentCQuestion}-new`}
                                                />
                                                {moduleCRecordings[currentCQuestion] && (
                                                    <div className="submit-section animate-slide-up">
                                                        <p className="text-success"><FiCheck /> תשובה נשמרה!</p>
                                                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                            {currentCQuestion > 0 && (
                                                                <button className="btn btn-secondary" onClick={() => setCurrentCQuestion(prev => prev - 1)}>
                                                                    ← שאלה קודמת
                                                                </button>
                                                            )}
                                                            {currentCQuestion < (moduleCContent?.questions?.length || 2) - 1 ? (
                                                                <button className="btn btn-primary" onClick={nextCQuestion}>המשך לשאלה הבאה</button>
                                                            ) : allCQuestionsAnswered && (
                                                                <button className="btn btn-primary" onClick={() => setViewingLastQuestion(false)}>המשך להגשה</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )
                                    }
                                })()}
                            </>
                        ) : (
                            <div className="submit-section animate-slide-up">
                                <div className="card" style={{
                                    textAlign: 'center',
                                    padding: 'var(--space-xl)',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                    border: '1px solid var(--primary-light)',
                                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)'
                                }}>
                                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)', animation: 'bounce 2s infinite' }}>🏆</div>
                                    <h2 style={{
                                        marginBottom: 'var(--space-sm)',
                                        background: 'var(--gradient-primary)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        display: 'inline-block'
                                    }}>כל הכבוד!</h2>
                                    <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
                                        סיימת את הסימולציה בהצלחה
                                    </p>
                                    <button className="btn btn-primary btn-lg" onClick={finishSimulation} style={{ width: '100%' }}>
                                        <FiCheck /> הגש סימולציה לניתוח
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="modal-overlay" onClick={() => setShowExitConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)', textAlign: 'center' }}>🤔</div>
                        <h3 style={{ marginBottom: 'var(--space-md)', textAlign: 'center' }}>רגע, בטוח?</h3>
                        <p style={{
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-xl)',
                            textAlign: 'center',
                            lineHeight: 1.6
                        }}>
                            אם תצאו עכשיו, ההקלטות שעשיתם לא יישמרו ותצטרכו להתחיל מחדש
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowExitConfirm(false)}
                            >
                                המשך להתאמן
                            </button>
                            <Link
                                to="/practice"
                                className="btn btn-danger"
                                onClick={() => {
                                    if (timerRef.current) clearInterval(timerRef.current)
                                }}
                            >
                                יציאה
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

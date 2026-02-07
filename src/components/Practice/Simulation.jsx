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

            // Get unpracticed questions for all modules in parallel
            const [smartQuestionsA, smartQuestionsB, smartQuestionsC] = await Promise.all([
                getUnpracticedQuestions('module-a', 2),
                getUnpracticedQuestions('module-b', 1),
                getUnpracticedQuestions('module-c', 1)
            ])


            if (smartQuestionsA.length > 0) {
                setModuleAQuestions(smartQuestionsA)
            }
            if (smartQuestionsB.length > 0) {
                setModuleBQuestion(smartQuestionsB[0])
            }
            if (smartQuestionsC.length > 0) {
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
            videoUrl: moduleCContent?.videoUrl,
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
        // Auto-advance to Module B
        goToModuleB()
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
        // Auto-advance to Module C
        goToModuleC()
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

        if (currentQuestion) {
            const questionId = currentQuestion.id || `moduleC-q${currentCQuestion}`
            saveRecording(questionId, audioBlob, duration)
            setModuleCRecordings(prev => ({ ...prev, [currentCQuestion]: true }))

            // Auto advance if not last
            if (currentCQuestion < questions.length - 1) {
                setTimeout(() => nextCQuestion(), 500) // Small delay for visual comfort
            }
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
        <div className="page" style={{ paddingTop: 0 }}>
            <div className="practice-session">
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
                        <div className="question-card card intro-content">
                            <div className="intro-icon">🎯</div>
                            <h2 className="intro-title">סימולציית בגרות בעל-פה</h2>
                            <p style={{
                                marginBottom: 'var(--space-md)',
                                fontSize: '0.875rem',
                                color: 'black',
                                textAlign: 'center',
                                width: '100%',
                                display: 'block',
                                margin: '0 auto var(--space-md)'
                            }}>
                                כל 3 המודולים • 30 דקות
                            </p>

                            <div className="intro-list">
                                <div className="intro-list-item">
                                    <span style={{ fontSize: '0.8rem', color: 'black' }}>שאלה כללית או דעה</span>
                                    <strong style={{ fontSize: '0.875rem', color: 'black' }}>מודול A (25%)</strong>
                                </div>
                                <div className="intro-list-item">
                                    <span style={{ fontSize: '0.8rem', color: 'black' }}>שאלה על הפרויקט</span>
                                    <strong style={{ fontSize: '0.875rem', color: 'black' }}>מודול B (25%)</strong>
                                </div>
                                <div className="intro-list-item">
                                    <span style={{ fontSize: '0.8rem', color: 'black' }}>סרטון + 2 שאלות הבנה</span>
                                    <strong style={{ fontSize: '0.875rem', color: 'black' }}>מודול C (50%)</strong>
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
                                <div className="question-selector-card card">
                                    <div className="question-selector-badge">
                                        <span>מודול A</span>
                                        <span>•</span>
                                        <span dir="ltr">25%</span>
                                    </div>
                                    <h3 style={{
                                        fontSize: '1.25rem',
                                        marginBottom: 'var(--space-xs)',
                                        color: 'var(--text-primary)'
                                    }}>בחירת שאלה</h3>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 'var(--space-sm)' }}>
                                        <p className="text-secondary" style={{ fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>
                                            יש לבחור אחת משתי האפשרויות
                                        </p>
                                    </div>
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
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 'var(--space-md)'
                                            }}>
                                                <span className="question-choice-badge">
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

                                {/* Show Recorder */}
                                <AudioRecorder
                                    onRecordingComplete={handleModuleARecording}
                                    submitLabel="המשך למודול B"
                                    key={selectedModuleAQuestion.id} // Reset if question changes
                                    initialAudioBlob={getRecordingForQuestion(selectedModuleAQuestion.id)?.audioBlob}
                                    initialDuration={getRecordingForQuestion(selectedModuleAQuestion.id)?.duration}
                                />
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
                            {/* Power Sentence */}
                            {/* <div className="practice-info card" ... /> (It was not here in Simulation but in ModuleB.jsx, here just Question Card) */}

                            <div className="question-card card">
                                <span className="question-number" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span>מודול B</span>
                                    <span>•</span>
                                    <span dir="ltr">25%</span>
                                </span>
                                <p className="question-text">{moduleBQuestion?.text}</p>
                            </div>

                            <AudioRecorder
                                onRecordingComplete={handleModuleBRecording}
                                submitLabel="המשך למודול C"
                                key={`moduleB-${moduleBQuestion?.id}`}
                                initialAudioBlob={getRecordingForQuestion(moduleBQuestion?.id)?.audioBlob}
                                initialDuration={getRecordingForQuestion(moduleBQuestion?.id)?.duration}
                            />
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

                                {/* Tip Card Slim */}
                                <div className="tip-card-slim animate-fade-in">
                                    <span className="tip-icon">💡</span>
                                    <p className="tip-text">
                                        <strong>טיפ:</strong> כדאי לקרוא קודם את השאלה הראשונה ורק אז לצפות בסרטון, כך תדעו למה לשים לב.
                                    </p>
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
                                        className="video-replay-btn hover-effect"
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

                                {/* Check if recording exists for this question (logic handled by AudioRecorder key reset) */}
                                <AudioRecorder
                                    onRecordingComplete={handleModuleCRecording}
                                    submitLabel={
                                        currentCQuestion < (moduleCContent?.questions?.length || 2) - 1
                                            ? "שמור והמשך"
                                            : "סיים מודול"
                                    }
                                    key={`moduleC-q${currentCQuestion}`}
                                    initialAudioBlob={getRecordingForQuestion(moduleCContent?.questions?.[currentCQuestion]?.id || `moduleC-q${currentCQuestion}`)?.audioBlob}
                                    initialDuration={getRecordingForQuestion(moduleCContent?.questions?.[currentCQuestion]?.id || `moduleC-q${currentCQuestion}`)?.duration}
                                />
                            </>
                        ) : (
                            <div className="submission-card animate-scale-in">
                                <div className="submission-card-bg"></div>
                                <div className="submission-icon">🏆</div>
                                <div className="submission-title">כל הכבוד!</div>
                                <p className="submission-text">
                                    סיימת בהצלחה את כל המודולים בסימולציה.
                                    <br />
                                    לחץ על הכפתור למטה כדי להגיש ולקבל ניתוח מלא.
                                </p>

                                <button
                                    className="btn btn-primary btn-lg submission-btn"
                                    onClick={finishSimulation}
                                >
                                    <FiCheck style={{ marginLeft: '10px' }} />
                                    הגש סימולציה וקבל ציון
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* Exit Confirmation Modal */}
            {
                showExitConfirm && (
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
                            <div className="modal-actions">
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
                )
            }
        </div >
    )
}

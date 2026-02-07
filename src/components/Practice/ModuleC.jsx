import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePractice } from '../../context/PracticeContext'
import AudioRecorder from './AudioRecorder'
import { FiArrowRight, FiCheck, FiPlay, FiTrash2 } from 'react-icons/fi'
import './Practice.css'

// Convert YouTube watch URL to embed URL
const getEmbedUrl = (url) => {
    if (!url) return ''

    // Already an embed URL
    if (url.includes('/embed/')) return url

    // Handle youtube.com/watch?v=VIDEO_ID format
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
    if (watchMatch) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`
    }

    // Handle youtu.be/VIDEO_ID format
    const shortMatch = url.match(/youtu\.be\/([^?]+)/)
    if (shortMatch) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`
    }

    return url
}

export default function ModuleC() {
    const navigate = useNavigate()
    const { getUnpracticedQuestions, startPractice, saveRecording, getRecordingForQuestion, deleteRecording, submitPractice, loading } = usePractice()
    const [videoContent, setVideoContent] = useState(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [watchedVideo, setWatchedVideo] = useState(false)
    const [recordings, setRecordings] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [loadingQuestions, setLoadingQuestions] = useState(true)
    const [showExitConfirm, setShowExitConfirm] = useState(false)

    useEffect(() => {
        const loadVideo = async () => {
            setLoadingQuestions(true)
            // Get 1 unpracticed video content (smart selection)
            const [smartVideo] = await getUnpracticedQuestions('module-c', 1)
            setVideoContent(smartVideo)

            if (smartVideo) {
                // Include video transcript in each question for AI analysis
                const questionsWithTranscript = smartVideo.questions.map(q => ({
                    ...q,
                    videoTranscript: smartVideo.videoTranscript || '',
                    videoUrl: smartVideo.videoUrl,
                    moduleType: 'module-c'
                }))

                startPractice('module-c', questionsWithTranscript)
            }
            setLoadingQuestions(false)
        }
        loadVideo()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleRecordingComplete = async (audioBlob, duration) => {
        const currentQuestion = videoContent.questions[currentQuestionIndex]
        await saveRecording(currentQuestion.id, audioBlob, duration)

        setRecordings(prev => ({
            ...prev,
            [currentQuestionIndex]: true
        }))

        // Auto-advance logic
        if (currentQuestionIndex < videoContent.questions.length - 1) {
            handleNextQuestion()
        } else {
            await handleSubmit()
        }
    }

    const handleNextQuestion = () => {
        if (currentQuestionIndex < videoContent.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        const result = await submitPractice()
        if (result) {
            navigate(`/analysis/${result.id}`)
        }
    }

    const isLastQuestion = videoContent && currentQuestionIndex === videoContent.questions.length - 1

    if (submitting || loading || loadingQuestions) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">{submitting ? 'מנתח את ההקלטות...' : 'טוען שאלות...'}</p>
                <p className="loading-subtext">{submitting ? 'זה עשוי לקחת מספר דקות. אין לסגור את הדף.' : ''}</p>
            </div>
        )
    }

    if (!videoContent) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <div className="page" style={{ paddingTop: 0 }}>
            <div className="practice-session">
                <header className="practice-header simulation-header">
                    {watchedVideo ? (
                        <button
                            className="back-button"
                            onClick={() => {
                                if (currentQuestionIndex > 0) {
                                    setCurrentQuestionIndex(prev => prev - 1)
                                } else {
                                    setWatchedVideo(false)
                                }
                            }}
                        >
                            <FiArrowRight />
                            חזור
                        </button>
                    ) : (
                        <div style={{ width: '80px' }}></div>
                    )}
                    <span className="simulation-header-title">מודול C</span>
                    <button
                        className="exit-button"
                        onClick={() => setShowExitConfirm(true)}
                        title="יציאה"
                    >
                        ✕
                    </button>
                </header>

                <div className="animate-fade-in" style={{ marginTop: '60px' }}>
                    {!watchedVideo ? (
                        <>
                            <div className="question-card card" style={{ textAlign: 'center' }}>
                                <span className="question-number">שלב 1 מתוך 3</span>
                                <h2 style={{ marginBottom: 'var(--space-sm)' }}>צפייה בסרטון</h2>
                                <p className="text-secondary">אחרי הצפייה, עוברים לשאלות ההבנה</p>
                            </div>

                            {/* Tip Card Slim */}
                            <div className="tip-card-slim animate-fade-in">
                                <span className="tip-icon">💡</span>
                                <p className="tip-text">
                                    <strong>טיפ:</strong> כדאי לקרוא קודם את השאלה הראשונה ורק אז לצפות בסרטון, כך תדעו למה לשים לב.
                                </p>
                            </div>

                            <div className="video-container">
                                <iframe
                                    src={getEmbedUrl(videoContent.videoUrl)}
                                    title={videoContent.videoTitle}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                                <div className="video-title">
                                    📹 {videoContent.videoTitleHe}
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => setWatchedVideo(true)}
                                style={{ width: '100%' }}
                            >
                                <FiPlay />
                                המשך לשאלות
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Progress indicator */}
                            <div className="module-progress">
                                <div className={`progress-step ${recordings[0] ? 'completed' : currentQuestionIndex === 0 ? 'active' : ''}`}>
                                    <div className="progress-step-indicator">
                                        {recordings[0] ? <FiCheck /> : '1'}
                                    </div>
                                    <span className="progress-step-label">שאלה 1</span>
                                </div>
                                <div className={`progress-connector ${recordings[0] ? 'completed' : ''}`}></div>
                                <div className={`progress-step ${recordings[1] ? 'completed' : currentQuestionIndex === 1 ? 'active' : ''}`}>
                                    <div className="progress-step-indicator">
                                        {recordings[1] ? <FiCheck /> : '2'}
                                    </div>
                                    <span className="progress-step-label">שאלה 2</span>
                                </div>
                            </div>

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
                                    שאלה {currentQuestionIndex + 1} מתוך {videoContent.questions.length}
                                </span>
                            </div>

                            <div className="question-card card">
                                <span className="question-number">
                                    שאלה {currentQuestionIndex + 1} מתוך {videoContent.questions.length} • 25%
                                </span>
                                <p className="question-text">
                                    {videoContent.questions[currentQuestionIndex].text}
                                </p>
                            </div>

                            <AudioRecorder
                                key={`q${currentQuestionIndex}-new`}
                                onRecordingComplete={handleRecordingComplete}
                                submitLabel={isLastQuestion ? "סיים ושלח" : "שמור והמשך"}
                                initialAudioBlob={getRecordingForQuestion(videoContent.questions[currentQuestionIndex].id)?.audioBlob}
                                initialDuration={getRecordingForQuestion(videoContent.questions[currentQuestionIndex].id)?.duration}
                            />
                        </>
                    )}
                </div>
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

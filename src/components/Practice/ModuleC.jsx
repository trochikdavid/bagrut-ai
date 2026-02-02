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
                    moduleType: 'module-c'
                }))

                startPractice('module-c', questionsWithTranscript)
            }
            setLoadingQuestions(false)
        }
        loadVideo()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleRecordingComplete = (audioBlob, duration) => {
        const currentQuestion = videoContent.questions[currentQuestionIndex]
        saveRecording(currentQuestion.id, audioBlob, duration)

        setRecordings(prev => ({
            ...prev,
            [currentQuestionIndex]: true
        }))
    }

    const handleNextQuestion = () => {
        if (currentQuestionIndex < videoContent.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const handleDeleteRecording = () => {
        const currentQuestion = videoContent.questions[currentQuestionIndex]
        deleteRecording(currentQuestion.id)
        setRecordings(prev => {
            const updated = { ...prev }
            delete updated[currentQuestionIndex]
            return updated
        })
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        const result = await submitPractice()
        if (result) {
            navigate(`/analysis/${result.id}`)
        }
    }

    const allQuestionsAnswered = videoContent &&
        Object.keys(recordings).length === videoContent.questions.length

    if (submitting || loading || loadingQuestions) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">{submitting ? 'מנתח את ההקלטות...' : 'טוען שאלות...'}</p>
                <p className="loading-subtext">{submitting ? 'זה עשוי לקחת מספר שניות' : ''}</p>
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
        <div className="page animate-fade-in">
            <div className="practice-session">
                <header className="practice-header">
                    <Link to="/practice" className="back-button">
                        <FiArrowRight />
                        חזרה
                    </Link>
                    <span className="badge badge-primary">מודול C • 50%</span>
                </header>

                {!watchedVideo ? (
                    <>
                        <div className="question-card card">
                            <span className="question-number">שלב 1 מתוך 3</span>
                            <h2 style={{ marginBottom: 'var(--space-sm)' }}>צפייה בסרטון</h2>
                            <p className="text-secondary">אחרי הצפייה, עוברים לשאלות ההבנה</p>
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
                            סיום צפייה ומעבר לשאלות
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

                        <div className="question-card card">
                            <span className="question-number">
                                שאלה {currentQuestionIndex + 1} מתוך {videoContent.questions.length} • 25%
                            </span>
                            <p className="question-text">
                                {videoContent.questions[currentQuestionIndex].text}
                            </p>
                        </div>

                        {!recordings[currentQuestionIndex] ? (
                            <AudioRecorder onRecordingComplete={handleRecordingComplete} key={`q${currentQuestionIndex}-new`} />
                        ) : (
                            <div className="recording-preview card animate-slide-up">
                                <div className="preview-header">
                                    <h4>הקלטה שמורה</h4>
                                    <span className="text-muted">שאלה {currentQuestionIndex + 1}</span>
                                </div>
                                <audio
                                    controls
                                    className="audio-player"
                                    src={URL.createObjectURL(getRecordingForQuestion(videoContent.questions[currentQuestionIndex].id).audioBlob)}
                                />
                                <div className="preview-actions">
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleDeleteRecording}
                                    >
                                        <FiTrash2 /> מחק והקלט מחדש
                                    </button>
                                    {!allQuestionsAnswered && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleNextQuestion}
                                        >
                                            המשך לשאלה הבאה
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {allQuestionsAnswered && (
                            <div className="submit-section animate-slide-up">
                                <p className="text-success">
                                    <FiCheck style={{ marginLeft: '0.5rem' }} />
                                    כל ההקלטות נשמרו בהצלחה!
                                </p>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleSubmit}
                                >
                                    שלח לניתוח
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

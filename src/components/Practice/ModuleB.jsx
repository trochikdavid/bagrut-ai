import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePractice } from '../../context/PracticeContext'
import AudioRecorder from './AudioRecorder'
import { FiArrowRight, FiCheck, FiTrash2, FiAlertTriangle } from 'react-icons/fi'
import './Practice.css'

export default function ModuleB() {
    const navigate = useNavigate()
    const { getUnpracticedQuestions, startPractice, saveRecording, getRecordingForQuestion, deleteRecording, submitPractice, loading } = usePractice()
    const [question, setQuestion] = useState(null)
    const [hasRecording, setHasRecording] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [loadingQuestions, setLoadingQuestions] = useState(true)
    const [showExitConfirm, setShowExitConfirm] = useState(false)

    useEffect(() => {
        const loadQuestion = async () => {
            setLoadingQuestions(true)
            // Get 1 unpracticed question (smart selection)
            const [smartQuestion] = await getUnpracticedQuestions('module-b', 1)
            setQuestion(smartQuestion)
            if (smartQuestion) {
                startPractice('module-b', [smartQuestion])
            }
            setLoadingQuestions(false)
        }
        loadQuestion()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleRecordingComplete = async (audioBlob, duration) => {
        // 1. Save locally
        await saveRecording(question.id, audioBlob, duration)

        // 2. Submit immediately
        setSubmitting(true)
        const result = await submitPractice()
        if (result) {
            navigate(`/analysis/${result.id}`)
        }
    }

    if (submitting || loading || loadingQuestions) {
        if (submitting) {
            return (
                <div className="upload-warning-overlay">
                    <FiAlertTriangle className="upload-warning-icon" />
                    <h2 className="upload-warning-title">מעלה את ההקלטות...</h2>
                    <p className="upload-warning-text">ההקלטות שלך נשמרות כרגע. אל תסגור את הדף!</p>
                    <p className="upload-warning-subtext">סגירת הדף תגרום לאיבוד ההקלטות ולא תוכל לקבל ציון.</p>

                    <div className="upload-progress-bar">
                        <div className="upload-progress-fill"></div>
                    </div>
                </div>
            )
        }

        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">טוען שאלות...</p>
            </div>
        )
    }

    if (!question) {
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
                    <div style={{ width: '80px' }}></div>
                    <span className="simulation-header-title">מודול B</span>
                    <button
                        className="exit-button"
                        onClick={() => setShowExitConfirm(true)}
                        title="יציאה"
                    >
                        ✕
                    </button>
                </header>

                <div className="animate-fade-in" style={{ marginTop: '60px' }}>
                    <div className="practice-info card" style={{ marginBottom: 'var(--space-xl)' }}>
                        <p>
                            <strong>📝 שאלה על הפרויקט</strong><br />
                            מענה על השאלה לפי הפרויקט האישי
                        </p>
                    </div>

                    <div className="tip-card-slim animate-fade-in" style={{ marginBottom: 'var(--space-md)' }}>
                        <span className="tip-icon">💡</span>
                        <p className="tip-text">
                            <strong>שימו לב:</strong> תשובה של פחות מדקה תגרור הורדת ציון בבגרות! כוונו ל-1-2 דקות.
                        </p>
                    </div>

                    <div className="question-card card">
                        <span className="question-number">שאלה</span>
                        <p className="question-text">{question.text}</p>
                    </div>

                    <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        submitLabel="שלח לניתוח"
                    />
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

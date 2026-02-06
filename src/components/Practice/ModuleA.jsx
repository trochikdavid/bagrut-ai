import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePractice } from '../../context/PracticeContext'
import AudioRecorder from './AudioRecorder'
import { FiArrowRight, FiCheck, FiTrash2 } from 'react-icons/fi'
import './Practice.css'

export default function ModuleA() {
    const navigate = useNavigate()
    const { getUnpracticedQuestions, startPractice, saveRecording, getRecordingForQuestion, deleteRecording, submitPractice, loading } = usePractice()
    const [questions, setQuestions] = useState([])
    const [selectedQuestion, setSelectedQuestion] = useState(null)
    const [hasRecording, setHasRecording] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [loadingQuestions, setLoadingQuestions] = useState(true)
    const [showExitConfirm, setShowExitConfirm] = useState(false)

    useEffect(() => {
        const loadQuestions = async () => {
            setLoadingQuestions(true)
            // Get 2 unpracticed questions (smart selection)
            const smartQuestions = await getUnpracticedQuestions('module-a', 2)
            setQuestions(smartQuestions)
            setLoadingQuestions(false)
        }
        loadQuestions()
    }, [getUnpracticedQuestions])

    const handleSelectQuestion = (question) => {
        setSelectedQuestion(question)
        startPractice('module-a', [question])
    }

    const handleRecordingComplete = async (audioBlob, duration) => {
        // 1. Save locally
        await saveRecording(selectedQuestion.id, audioBlob, duration)

        // 2. Submit for analysis immediately (since user confirmed in the card)
        setSubmitting(true)
        const result = await submitPractice()
        if (result) {
            navigate(`/analysis/${result.id}`)
        }
    }

    if (submitting || loading || loadingQuestions) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">{submitting ? 'מנתח את ההקלטה...' : 'טוען שאלות...'}</p>
                <p className="loading-subtext">{submitting ? 'זה עשוי לקחת מספר דקות. אין לסגור את הדף.' : ''}</p>
            </div>
        )
    }

    return (
        <div className="page" style={{ paddingTop: 0 }}>
            <div className="practice-session">
                <header className="practice-header simulation-header">
                    {/* Back Button */}
                    {selectedQuestion ? (
                        <button
                            className="back-button"
                            onClick={() => setSelectedQuestion(null)}
                        >
                            <FiArrowRight />
                            חזור
                        </button>
                    ) : (
                        <div style={{ width: '80px' }}></div>
                    )}

                    {/* Title */}
                    <span className="simulation-header-title">מודול A</span>

                    {/* Exit Button */}
                    <button
                        className="exit-button"
                        onClick={() => setShowExitConfirm(true)}
                        title="יציאה"
                    >
                        ✕
                    </button>
                </header>

                <div className="animate-fade-in" style={{ marginTop: '60px' }}>
                    {!selectedQuestion ? (
                        <>
                            <div className="question-card card" style={{ textAlign: 'center' }}>
                                <span className="question-number">שלב 1 מתוך 2</span>
                                <h2 style={{ marginBottom: 'var(--space-sm)' }}>בחירת שאלה</h2>
                                <p className="text-secondary">יש לבחור אחת משתי השאלות לתרגול</p>
                            </div>

                            <div className="question-choices">
                                {questions.map((q, index) => (
                                    <button
                                        key={q.id}
                                        className="question-choice"
                                        onClick={() => handleSelectQuestion(q)}
                                    >
                                        <div className="choice-text">{q.text}</div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="question-card card">
                                <span className="question-number">שלב 2 מתוך 2</span>
                                <p className="question-text">{selectedQuestion.text}</p>
                            </div>

                            <AudioRecorder
                                onRecordingComplete={handleRecordingComplete}
                                submitLabel="שלח לניתוח"
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

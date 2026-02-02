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
        await saveRecording(selectedQuestion.id, audioBlob, duration)
        setHasRecording(true)
    }

    const handleDeleteRecording = () => {
        deleteRecording(selectedQuestion.id)
        setHasRecording(false)
    }

    const handleSubmit = async () => {
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
                <p className="loading-subtext">{submitting ? 'זה עשוי לקחת מספר שניות' : ''}</p>
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
                    <span className="badge badge-primary">מודול A • 25%</span>
                </header>

                {!selectedQuestion ? (
                    <>
                        <div className="question-card card">
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

                        <AudioRecorder onRecordingComplete={handleRecordingComplete} key={hasRecording ? 'recorded' : 'new'} />

                        {hasRecording && getRecordingForQuestion(selectedQuestion.id)?.audioBlob && (
                            <div className="recording-preview card animate-slide-up">
                                <div className="preview-header">
                                    <h4>הקלטה שמורה</h4>
                                </div>
                                <audio
                                    controls
                                    className="audio-player"
                                    src={URL.createObjectURL(getRecordingForQuestion(selectedQuestion.id).audioBlob)}
                                />
                                <div className="preview-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleDeleteRecording}
                                    >
                                        <FiTrash2 /> מחק והקלט מחדש
                                    </button>
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={handleSubmit}
                                    >
                                        שלח לניתוח
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

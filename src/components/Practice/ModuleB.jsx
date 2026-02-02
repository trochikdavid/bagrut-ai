import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePractice } from '../../context/PracticeContext'
import AudioRecorder from './AudioRecorder'
import { FiArrowRight, FiCheck, FiTrash2 } from 'react-icons/fi'
import './Practice.css'

export default function ModuleB() {
    const navigate = useNavigate()
    const { getUnpracticedQuestions, startPractice, saveRecording, getRecordingForQuestion, deleteRecording, submitPractice, loading } = usePractice()
    const [question, setQuestion] = useState(null)
    const [hasRecording, setHasRecording] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [loadingQuestions, setLoadingQuestions] = useState(true)

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

    const handleRecordingComplete = (audioBlob, duration) => {
        saveRecording(question.id, audioBlob, duration)
        setHasRecording(true)
    }

    const handleDeleteRecording = () => {
        deleteRecording(question.id)
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

    if (!question) {
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
                    <span className="badge badge-primary">מודול B • 25%</span>
                </header>

                <div className="practice-info card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <p>
                        <strong>📝 שאלה על הפרויקט</strong><br />
                        מענה על השאלה לפי הפרויקט האישי
                    </p>
                </div>

                <div className="question-card card">
                    <span className="question-number">שאלה</span>
                    <p className="question-text">{question.text}</p>
                </div>

                <AudioRecorder onRecordingComplete={handleRecordingComplete} key={hasRecording ? 'recorded' : 'new'} />

                {hasRecording && getRecordingForQuestion(question.id)?.audioBlob && (
                    <div className="recording-preview card animate-slide-up">
                        <div className="preview-header">
                            <h4>הקלטה שמורה</h4>
                        </div>
                        <audio
                            controls
                            className="audio-player"
                            src={URL.createObjectURL(getRecordingForQuestion(question.id).audioBlob)}
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
            </div>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { usePractice } from '../../context/PracticeContext'
import { getRecordingUrl } from '../../services/storageService'
import { FiArrowRight, FiClock, FiPlay, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiVolume2, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import './Analysis.css'

export default function AnalysisPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { getPracticeById } = usePractice()
    const [practice, setPractice] = useState(null)
    const [loading, setLoading] = useState(true)

    const [expandedQuestions, setExpandedQuestions] = useState({})
    const [audioUrls, setAudioUrls] = useState({})
    const [playingAudio, setPlayingAudio] = useState(null)

    useEffect(() => {
        const loadPractice = async () => {
            setLoading(true)
            try {
                const data = await getPracticeById(id)
                if (data) {
                    setPractice(data)
                    // Expand all 5 questions by default
                    const expanded = { 0: true, 1: true, 2: true, 3: true, 4: true }
                    setExpandedQuestions(expanded)

                    // Fetch audio URLs
                    if (data.questionAnalyses) {
                        const urls = {}
                        await Promise.all(data.questionAnalyses.map(async (qa) => {
                            console.log(`🔍 Processing audio for Q${qa.questionId}. Raw URL:`, qa.audioUrl)
                            if (qa.audioUrl) {
                                if (qa.audioUrl.startsWith('http') || qa.audioUrl.startsWith('blob')) {
                                    urls[qa.questionId] = qa.audioUrl
                                } else {
                                    const publicUrl = await getRecordingUrl(qa.audioUrl)
                                    console.log(`🔗 Generated signed URL for Q${qa.questionId}:`, publicUrl)
                                    if (publicUrl) urls[qa.questionId] = publicUrl
                                }
                            } else {
                                console.warn(`⚠️ No audio URL found for Q${qa.questionId}`)
                            }
                        }))
                        console.log('✅ Final Audio URLs map:', urls)
                        setAudioUrls(urls)
                    }
                } else {
                    navigate('/history')
                }
            } catch (error) {
                console.error('Error loading practice:', error)
                navigate('/history')
            } finally {
                setLoading(false)
            }
        }

        loadPractice()
    }, [id, getPracticeById, navigate])

    const getScoreClass = (score) => {
        if (score >= 76) return 'score-excellent'
        if (score >= 55) return 'score-good'
        if (score >= 26) return 'score-average'
        return 'score-poor'
    }

    const getScoreLabel = (score) => {
        if (score >= 76) return 'מצוין (76-100)'
        if (score >= 55) return 'טוב (55-75)'
        if (score >= 26) return 'בינוני (26-54)'
        return 'דרוש שיפור (0-25)'
    }

    const getModuleLabel = (type) => {
        switch (type) {
            case 'module-a': return 'מודול A - נושא כללי'
            case 'module-b': return 'מודול B - פרויקט'
            case 'module-c': return 'מודול C - וידאו'
            case 'simulation': return 'סימולציה מלאה'
            default: return type
        }
    }

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const toggleQuestion = (idx) => {
        setExpandedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }))
    }

    // Calculate weighted contribution for display
    const calculateWeightedContribution = (score, weight) => {
        return ((score * weight) / 100).toFixed(1)
    }

    // Get criteria labels with weights - Module C has different weights (no fluency)
    const getCriteriaLabels = (isModuleC = false) => {
        if (isModuleC) {
            return {
                topicDevelopment: { name: 'פיתוח נושא', en: 'Topic Development', weight: 50 },
                vocabulary: { name: 'אוצר מילים', en: 'Vocabulary', weight: 25 },
                grammar: { name: 'דקדוק', en: 'Language', weight: 25 }
            }
        }
        return {
            topicDevelopment: { name: 'פיתוח נושא', en: 'Topic Development', weight: 50 },
            fluency: { name: 'שטף דיבור', en: 'Delivery', weight: 15 },
            vocabulary: { name: 'אוצר מילים', en: 'Vocabulary', weight: 20 },
            grammar: { name: 'דקדוק', en: 'Language', weight: 15 }
        }
    }

    // Default criteria labels for backward compatibility
    const criteriaLabels = getCriteriaLabels(practice?.type === 'module-c')

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    if (!practice) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h2>לא נמצא תרגול</h2>
                    <Link to="/history" className="btn btn-primary">
                        <FiArrowRight />
                        חזרה להיסטוריה
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="page animate-fade-in">
            <div className="analysis-page">
                <header className="practice-header">
                    <Link to="/history" className="back-button">
                        <FiArrowRight />
                        חזרה
                    </Link>
                    <span className="badge badge-primary">{getModuleLabel(practice.type)}</span>
                </header>

                {/* Score Hero */}
                <div className="score-hero card card-glow">
                    <div className={`score-circle ${getScoreClass(practice.totalScore)}`}>
                        <span className="score-value">{practice.totalScore}</span>
                        <span className="score-max">/100</span>
                    </div>
                    <div className="score-details">
                        <span className={`score-label ${getScoreClass(practice.totalScore)}`}>
                            {getScoreLabel(practice.totalScore)}
                        </span>
                        <div className="score-meta">
                            <span><FiClock /> {formatDuration(practice.duration)}</span>
                            <span>
                                {practice.completedAt && new Date(practice.completedAt).getFullYear() >= 2000
                                    ? new Date(practice.completedAt).toLocaleDateString('he-IL')
                                    : 'לא זמין'
                                }
                            </span>
                        </div>
                    </div>
                </div>

                {/* Per-Question Analysis - Show all 5 questions with unselected in gray */}
                {practice.questionAnalyses && practice.questionAnalyses.length > 0 && (
                    <section className="analysis-section">
                        <h3 className="section-title">ניתוח לפי שאלה</h3>

                        {/* Build the full list with Module A questions in original order */}
                        {(() => {
                            const allQuestions = []

                            if (practice.type === 'simulation' && practice.moduleAInfo) {
                                // Module A: Show both questions in their original order
                                practice.moduleAInfo.questions.forEach((maq, i) => {
                                    const isSelected = i === practice.moduleAInfo.selectedIndex
                                    if (isSelected) {
                                        // This question was answered - get its analysis
                                        allQuestions.push({
                                            ...practice.questionAnalyses[0],
                                            isAnswered: true,
                                            module: 'A',
                                            position: i + 1,
                                            originalIndex: i
                                        })
                                    } else {
                                        // This question was NOT answered - show grayed out
                                        allQuestions.push({
                                            questionId: maq.id,
                                            questionText: maq.text,
                                            isAnswered: false,
                                            module: 'A',
                                            position: i + 1,
                                            originalIndex: i
                                        })
                                    }
                                })
                                // Questions 3-5: B and C (in order)
                                practice.questionAnalyses.slice(1).forEach((qa, i) => {
                                    allQuestions.push({
                                        ...qa,
                                        isAnswered: true,
                                        module: i === 0 ? 'B' : 'C',
                                        position: i + 3
                                    })
                                })
                            } else {
                                // Non-simulation: just show all answered questions
                                practice.questionAnalyses.forEach((qa, i) => {
                                    allQuestions.push({ ...qa, isAnswered: true, position: i + 1 })
                                })
                            }

                            return allQuestions.map((qa, idx) => (
                                <div key={qa.questionId} className={`question-analysis card ${!qa.isAnswered ? 'question-unselected' : ''}`}>
                                    <button
                                        className="question-analysis-header"
                                        onClick={() => qa.isAnswered && toggleQuestion(idx)}
                                        disabled={!qa.isAnswered}
                                    >
                                        <div className="qa-header-content">
                                            <span className="qa-number">
                                                שאלה {qa.position}
                                                {qa.module && <span className="qa-module-badge">{qa.module}</span>}
                                            </span>
                                            {qa.isAnswered ? (
                                                <div className="qa-header-score">
                                                    <span className="qa-score-label">ציון משוקלל:</span>
                                                    <span className={`qa-score ${getScoreClass(qa.totalScore)}`}>
                                                        {qa.totalScore}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="unselected-badge">לא נבחרה</span>
                                            )}
                                        </div>
                                        {qa.isAnswered && (expandedQuestions[idx] ? <FiChevronUp /> : <FiChevronDown />)}
                                    </button>

                                    {/* Show question text for unselected */}
                                    {!qa.isAnswered && (
                                        <div className="question-analysis-content unselected-content">
                                            <div className="qa-question">
                                                <p className="qa-question-en">{qa.questionText}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Full analysis for answered questions */}
                                    {qa.isAnswered && expandedQuestions[idx] && (
                                        <div className="question-analysis-content animate-slide-up">
                                            {/* Question Text */}
                                            <div className="qa-question">
                                                <p className="qa-question-en">{qa.questionText}</p>
                                            </div>

                                            {/* Audio Playback */}
                                            <div className="qa-audio-section">
                                                <div className="qa-audio-player">
                                                    {audioUrls[qa.questionId] ? (
                                                        <audio
                                                            controls
                                                            src={audioUrls[qa.questionId]}
                                                            className="w-full"
                                                            style={{ height: '40px' }}
                                                        >
                                                            הדפדפן שלך לא תומך בהשמעת אודיו
                                                        </audio>
                                                    ) : (
                                                        <div className="text-muted text-sm">
                                                            <FiAlertCircle className="inline mr-1" />
                                                            הקלטה לא זמינה
                                                        </div>
                                                    )}
                                                    <span className="qa-duration">{formatDuration(qa.duration)}</span>
                                                </div>
                                            </div>

                                            {/* Transcript */}
                                            <div className="qa-transcript">
                                                <h5>תמלול</h5>
                                                {qa.transcript === null ? (
                                                    <p className="text-muted text-sm">
                                                        <FiClock className="inline mr-1" />
                                                        מעבד תמלול...
                                                    </p>
                                                ) : qa.transcript?.startsWith('[Transcription') ? (
                                                    <p className="text-warning text-sm">
                                                        <FiAlertCircle className="inline mr-1" />
                                                        {qa.transcript}
                                                    </p>
                                                ) : (
                                                    <p dir="ltr">{qa.transcript}</p>
                                                )}
                                            </div>

                                            {/* Weighted Score Calculation Table */}
                                            <div className="qa-scores">
                                                <h5>חישוב ציון משוקלל</h5>

                                                <div className="weighted-score-table">
                                                    <div className="weighted-score-header">
                                                        <span>קריטריון</span>
                                                        <span>ציון</span>
                                                        <span>משקל</span>
                                                        <span>תרומה</span>
                                                    </div>

                                                    {/* Use dynamic criteria based on whether this is a Module C question */}
                                                    {(() => {
                                                        const isModuleCQuestion = qa.module === 'C' || qa.moduleType === 'module-c'
                                                        const qaCriteria = getCriteriaLabels(isModuleCQuestion)
                                                        return Object.entries(qaCriteria)
                                                            .filter(([key]) => qa.scores[key] !== null && qa.scores[key] !== undefined)
                                                            .map(([key, criteria]) => {
                                                                const score = qa.scores[key]
                                                                const contribution = calculateWeightedContribution(score, criteria.weight)
                                                                return (
                                                                    <div key={key} className="weighted-score-row">
                                                                        <span className="criteria-name">
                                                                            {criteria.name}
                                                                            <small>({criteria.en})</small>
                                                                        </span>
                                                                        <span className={`criteria-score ${getScoreClass(score)}`}>{score}</span>
                                                                        <span className="criteria-weight">{criteria.weight}%</span>
                                                                        <span className="criteria-contribution">{contribution}</span>
                                                                    </div>
                                                                )
                                                            })
                                                    })()}

                                                    <div className="weighted-score-total">
                                                        <span>סה"כ ציון משוקלל</span>
                                                        <span className={`total-score ${getScoreClass(qa.totalScore)}`}>
                                                            {qa.totalScore}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detailed Feedback per Criteria */}
                                            <div className="qa-detailed-feedback">
                                                <h5>פידבק מפורט</h5>
                                                {Object.entries(qa.feedback)
                                                    .filter(([key, data]) => key !== 'pronunciation' && data !== null) // Skip fluency if null (Module C)
                                                    .map(([key, data]) => (
                                                        <div key={key} className="qa-feedback-item">
                                                            <div className="qa-feedback-header">
                                                                <span className="qa-feedback-name">{criteriaLabels[key]?.name}</span>
                                                                <div className="progress-bar" style={{ flex: 1, margin: '0 1rem' }}>
                                                                    <div
                                                                        className={`progress-bar-fill ${getScoreClass(data.score)}`}
                                                                        style={{ width: `${data.score}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className={`qa-feedback-score ${getScoreClass(data.score)}`}>
                                                                    {data.score}
                                                                </span>
                                                            </div>
                                                            <p className="qa-feedback-text">{data.feedback}</p>

                                                            {/* General feedback for all criteria with feedback assistants */}
                                                            {(key === 'topicDevelopment' || key === 'vocabulary' || key === 'grammar' || key === 'fluency') && data.generalFeedback && (
                                                                <p className="qa-general-feedback">{data.generalFeedback}</p>
                                                            )}

                                                            {/* Strengths for all criteria with feedback assistants */}
                                                            {(key === 'topicDevelopment' || key === 'vocabulary' || key === 'grammar' || key === 'fluency') && data.strengths && data.strengths.length > 0 && (
                                                                <div className="qa-preservation-points">
                                                                    <h6><FiCheckCircle className="text-success" /> נקודות חזקות</h6>
                                                                    {data.strengths.map((point, i) => (
                                                                        <div key={i} className="qa-preservation-item">
                                                                            <FiCheckCircle />
                                                                            <span>{point}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Improvements for all criteria with feedback assistants */}
                                                            {(key === 'topicDevelopment' || key === 'vocabulary' || key === 'grammar' || key === 'fluency') && data.improvements && data.improvements.length > 0 && (
                                                                <div className="qa-improvement-points">
                                                                    <h6><FiTrendingUp className="text-warning" /> נקודות לשיפור</h6>
                                                                    {data.improvements.map((point, i) => (
                                                                        <div key={i} className="qa-improvement-item">
                                                                            <FiAlertCircle />
                                                                            <span>{point}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {data.examples && data.examples.length > 0 && (
                                                                <div className="qa-examples">
                                                                    {data.examples.map((ex, i) => (
                                                                        <div key={i} className="qa-example-item">
                                                                            <FiCheckCircle />
                                                                            <span>{ex}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        })()}
                    </section>
                )}

                {/* Simulation Summary - Module Scores */}
                {practice.type === 'simulation' && practice.questionAnalyses && (
                    <section className="analysis-section simulation-summary">
                        <h3 className="section-title">סיכום סימולציה</h3>

                        <div className="simulation-summary-card card">
                            <h4>ציונים לפי שאלה</h4>
                            <div className="simulation-questions-table">
                                <div className="sim-table-header">
                                    <span>שאלה</span>
                                    <span>מודול</span>
                                    <span>ציון</span>
                                    <span>משקל</span>
                                    <span>תרומה</span>
                                </div>

                                {practice.questionAnalyses.map((qa, idx) => {
                                    // Determine module and weight
                                    let moduleName, moduleWeight
                                    if (idx === 0) {
                                        moduleName = 'A'
                                        moduleWeight = 25
                                    } else if (idx === 1) {
                                        moduleName = 'B'
                                        moduleWeight = 25
                                    } else {
                                        moduleName = 'C'
                                        moduleWeight = 25 // Each C question is 25%
                                    }
                                    const contribution = ((qa.totalScore * moduleWeight) / 100).toFixed(1)

                                    return (
                                        <div key={qa.questionId} className="sim-table-row">
                                            <span>שאלה {idx + 1}</span>
                                            <span className="module-badge">{moduleName}</span>
                                            <span className={`score ${getScoreClass(qa.totalScore)}`}>{qa.totalScore}</span>
                                            <span>{moduleWeight}%</span>
                                            <span className="contribution">{contribution}/{moduleWeight}</span>
                                        </div>
                                    )
                                })}

                                <div className="sim-table-total">
                                    <span>סה"כ</span>
                                    <span></span>
                                    <span></span>
                                    <span>100%</span>
                                    <span className={`total ${getScoreClass(practice.totalScore)}`}>
                                        {practice.totalScore}/100
                                    </span>
                                </div>
                            </div>

                            {/* Module Breakdown - Calculate from actual question scores */}
                            {(() => {
                                // Calculate real module scores from questions
                                const questions = practice.questionsAnswered || []

                                // Module A: 1 question, 25% weight
                                const moduleAQuestions = questions.filter(q => q.module === 'A')
                                const moduleAScore = moduleAQuestions.length > 0
                                    ? Math.round(moduleAQuestions.reduce((sum, q) => sum + (q.totalScore || 0), 0) / moduleAQuestions.length)
                                    : 0

                                // Module B: 1 question, 25% weight
                                const moduleBQuestions = questions.filter(q => q.module === 'B')
                                const moduleBScore = moduleBQuestions.length > 0
                                    ? Math.round(moduleBQuestions.reduce((sum, q) => sum + (q.totalScore || 0), 0) / moduleBQuestions.length)
                                    : 0

                                // Module C: 2 questions, 50% weight total (25% each)
                                const moduleCQuestions = questions.filter(q => q.module === 'C')
                                const moduleCScore = moduleCQuestions.length > 0
                                    ? Math.round(moduleCQuestions.reduce((sum, q) => sum + (q.totalScore || 0), 0) / moduleCQuestions.length)
                                    : 0

                                return (
                                    <div className="module-breakdown">
                                        <h4>סיכום לפי מודול</h4>
                                        <div className="module-scores-grid">
                                            <div className="module-score-card">
                                                <span className="module-score-label">מודול A (25%)</span>
                                                <span className={`module-contribution-value ${getScoreClass(moduleAScore)}`}>
                                                    {((moduleAScore * 25) / 100).toFixed(1)}/25
                                                </span>
                                                <span className="module-score-calc">
                                                    {moduleAScore} × 25% = {((moduleAScore * 25) / 100).toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="module-score-card">
                                                <span className="module-score-label">מודול B (25%)</span>
                                                <span className={`module-contribution-value ${getScoreClass(moduleBScore)}`}>
                                                    {((moduleBScore * 25) / 100).toFixed(1)}/25
                                                </span>
                                                <span className="module-score-calc">
                                                    {moduleBScore} × 25% = {((moduleBScore * 25) / 100).toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="module-score-card">
                                                <span className="module-score-label">מודול C (50%)</span>
                                                <span className={`module-contribution-value ${getScoreClass(moduleCScore)}`}>
                                                    {((moduleCScore * 50) / 100).toFixed(1)}/50
                                                </span>
                                                <span className="module-score-calc">
                                                    {moduleCScore} × 50% = {((moduleCScore * 50) / 100).toFixed(1)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Final Total Score */}
                                        <div className="final-score-summary">
                                            <span>ציון סופי סימולציה</span>
                                            <span className={`final-score ${getScoreClass(practice.totalScore)}`}>
                                                {practice.totalScore}/100
                                            </span>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </section>
                )}

                {/* Non-simulation: Overall Score Summary */}
                {practice.type !== 'simulation' && (
                    <section className="analysis-section">
                        <h3 className="section-title">סיכום ציון</h3>
                        <div className="overall-score-card card">
                            <div className="overall-calculation">
                                {Object.entries(criteriaLabels)
                                    .filter(([key]) => practice.scores?.[key] !== null && practice.scores?.[key] !== undefined)
                                    .map(([key, criteria]) => {
                                        const score = practice.scores?.[key] || 0
                                        const contribution = calculateWeightedContribution(score, criteria.weight)
                                        return (
                                            <div key={key} className="calc-row">
                                                <span>{criteria.name}</span>
                                                <span>{score} × {criteria.weight}% = <strong>{contribution}</strong></span>
                                            </div>
                                        )
                                    })}
                                <div className="calc-total">
                                    <span>ציון סופי</span>
                                    <span className={getScoreClass(practice.totalScore)}>{practice.totalScore}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Note: Strengths and Improvements are already shown per-question in the detailed feedback above */}

                {/* Actions */}
                <div className="analysis-actions">
                    <Link to="/practice" className="btn btn-primary btn-lg">
                        <FiPlay />
                        תרגול נוסף
                    </Link>
                </div>
            </div>
        </div>
    )
}

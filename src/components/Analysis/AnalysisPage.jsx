import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { usePractice } from '../../context/PracticeContext'
import { getRecordingUrl } from '../../services/storageService'
import { FiArrowRight, FiClock, FiPlay, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiVolume2, FiChevronDown, FiChevronUp, FiTarget, FiBookOpen, FiZap } from 'react-icons/fi'
import './Analysis.css'

export default function AnalysisPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { getPracticeById, markAsViewed } = usePractice()
    const [practice, setPractice] = useState(null)
    const [loading, setLoading] = useState(true)

    const [expandedQuestions, setExpandedQuestions] = useState({})
    const [audioUrls, setAudioUrls] = useState({})
    const [playingAudio, setPlayingAudio] = useState(null)

    useEffect(() => {
        let pollInterval = null

        const loadPractice = async () => {
            try {
                const data = await getPracticeById(id)
                if (data) {
                    setPractice(data)

                    // Mark as viewed if completed
                    if (data.status === 'completed' || data.processing_status === 'completed') {
                        markAsViewed(id)
                    }

                    // Expand all questions by default (0-9 covers potential range of Qs)
                    const expanded = {}
                    for (let i = 0; i < 10; i++) expanded[i] = true
                    setExpandedQuestions(expanded)

                    // Fetch audio URLs
                    if (data.questionAnalyses) {
                        const urls = {}
                        await Promise.all(data.questionAnalyses.map(async (qa) => {
                            if (qa.audioUrl) {
                                if (qa.audioUrl.startsWith('http') || qa.audioUrl.startsWith('blob')) {
                                    urls[qa.questionId] = qa.audioUrl
                                } else {
                                    const publicUrl = await getRecordingUrl(qa.audioUrl)
                                    if (publicUrl) urls[qa.questionId] = publicUrl
                                }
                            }
                        }))
                        setAudioUrls(urls)
                    }

                    // If still processing, poll every 5 seconds
                    if (data.status !== 'completed' && data.processing_status !== 'completed') {
                        if (!pollInterval) {
                            pollInterval = setInterval(async () => {
                                try {
                                    const updated = await getPracticeById(id)
                                    if (updated) {
                                        setPractice(updated)
                                        if (updated.status === 'completed' || updated.processing_status === 'completed') {
                                            clearInterval(pollInterval)
                                            pollInterval = null
                                            markAsViewed(id)
                                            // Fetch audio URLs for the completed practice
                                            if (updated.questionAnalyses) {
                                                const urls = {}
                                                await Promise.all(updated.questionAnalyses.map(async (qa) => {
                                                    if (qa.audioUrl) {
                                                        if (qa.audioUrl.startsWith('http') || qa.audioUrl.startsWith('blob')) {
                                                            urls[qa.questionId] = qa.audioUrl
                                                        } else {
                                                            const publicUrl = await getRecordingUrl(qa.audioUrl)
                                                            if (publicUrl) urls[qa.questionId] = publicUrl
                                                        }
                                                    }
                                                }))
                                                setAudioUrls(urls)
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.error('Polling error:', err)
                                }
                            }, 5000)
                        }
                    }
                } else {
                    navigate('/history')
                }
            } catch (error) {
                navigate('/history')
            } finally {
                setLoading(false)
            }
        }

        setLoading(true)
        loadPractice()

        return () => {
            if (pollInterval) clearInterval(pollInterval)
        }
    }, [id, getPracticeById, navigate])

    const getScoreClass = (score) => {
        if (score >= 76) return 'score-excellent'
        if (score >= 55) return 'score-good'
        if (score >= 26) return 'score-average'
        return 'score-poor'
    }

    const getScoreLabel = (score) => {
        if (score >= 76) return 'מצוין'
        if (score >= 55) return 'טוב'
        if (score >= 26) return 'בינוני'
        return 'דרוש שיפור'
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

    // Get criteria labels with weights - standardized for all modules
    const getCriteriaLabels = (isModuleC = false) => {
        // Now all modules (including C) use the same standard weights
        return {
            topicDevelopment: { name: 'פיתוח נושא', en: 'Topic Development', weight: 50, icon: <FiTarget /> },
            fluency: { name: 'שטף דיבור', en: 'Delivery', weight: 15, icon: <FiZap /> },
            vocabulary: { name: 'אוצר מילים', en: 'Vocabulary', weight: 20, icon: <FiBookOpen /> },
            grammar: { name: 'דקדוק', en: 'Language', weight: 15, icon: <FiCheckCircle /> }
        }
    }

    // Default criteria labels
    const criteriaLabels = getCriteriaLabels()

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

    // Show processing state when Edge Function is still analyzing
    if (practice.status !== 'completed' && practice.processing_status !== 'completed') {
        return (
            <div className="page animate-fade-in">
                <div className="analysis-page">
                    <header className="practice-header">
                        <Link to="/history" className="back-button">
                            <FiArrowRight />
                            חזרה להמשך
                        </Link>
                    </header>
                    <div className="analysis-loading-card">
                        <div className="premium-spinner"></div>
                        <h2 className="loading-text-glow">מנתחים את התשובות שלך...</h2>
                        <p className="loading-subtitle">
                            אנחנו עוברים על ההקלטות ומכינים עבורך משוב מפורט.
                            <span>אפשר להישאר כאן (העמוד יתעדכן אוטומטית) או לחזור מאוחר יותר.</span>
                        </p>

                        <div className="processing-insights">
                            <div className="insight-pill">
                                <FiVolume2 className="insight-icon" style={{ animation: 'pulse 2s infinite' }} />
                                <span className="insight-text">מעבד קול</span>
                            </div>
                            <div className="insight-pill">
                                <FiTarget className="insight-icon" style={{ animation: 'pulse 2s infinite 0.5s' }} />
                                <span className="insight-text">מנתח תוכן</span>
                            </div>
                            <div className="insight-pill">
                                <FiCheckCircle className="insight-icon" style={{ animation: 'pulse 2s infinite 1s' }} />
                                <span className="insight-text">מחשב ציון</span>
                            </div>
                        </div>

                        <Link to="/history" className="btn btn-outline" style={{ marginTop: '1rem' }}>
                            חזרה להיסטוריית התרגולים
                        </Link>
                    </div>
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

                </header>

                {/* Score Hero */}
                <div className="score-hero-wrapper">
                    <div className="score-hero card">
                        <div className={`score-circle ${getScoreClass(practice.totalScore)}`}>
                            <span className="score-value">{practice.totalScore}</span>
                            <span className="score-max">/100</span>
                        </div>
                        <div className="score-details">
                            <div className="score-header-row">
                                <span className={`score-label ${getScoreClass(practice.totalScore)}`}>
                                    {getScoreLabel(practice.totalScore)}
                                </span>
                                <span className="score-type-badge">{getModuleLabel(practice.type)}</span>
                            </div>
                            {(() => {
                                let emoji, text;
                                if (practice.totalScore >= 76) { emoji = '🎉'; text = 'עבודה מצוינת! כל הכבוד על ההשקעה!'; }
                                else if (practice.totalScore >= 55) { emoji = '👍'; text = 'ביצוע טוב! התקדמות יפה בדרך למצוינות'; }
                                else if (practice.totalScore >= 26) { emoji = '💪'; text = 'יש פוטנציאל! מומלץ להמשיך לתרגל'; }
                                else { emoji = '🚀'; text = 'כל התחלה קשה, אבל הכיוון נכון!'; }

                                return (
                                    <p className="score-motivation">
                                        {text}
                                        <span className="motivation-emoji" style={{ marginRight: '0.5rem' }}>{emoji}</span>
                                    </p>
                                )
                            })()}
                            <div className="score-meta">
                                <span className="meta-item meta-duration"><FiClock /> {formatDuration(practice.duration)}</span>
                                <span className="meta-item meta-date">
                                    {practice.completedAt && new Date(practice.completedAt).getFullYear() >= 2000
                                        ? new Date(practice.completedAt).toLocaleString('he-IL', { dateStyle: 'medium', timeStyle: 'short' })
                                        : 'לא זמין'
                                    }
                                </span>
                                <span className="meta-item meta-questions">
                                    <FiCheckCircle /> {practice.questionAnalyses?.length || 0} שאלות
                                </span>
                            </div>
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
                                <div key={qa.questionId} className={`question-analysis ${!qa.isAnswered ? 'question-unselected' : ''}`}>
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

                                            {/* Video Link */}
                                            {qa.feedback?.videoUrl && (
                                                <div className="qa-video-link" style={{ marginBottom: '1rem' }}>
                                                    <a
                                                        href={qa.feedback.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline btn-sm"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                                    >
                                                        <FiPlay />
                                                        צפייה בסרטון המקורי
                                                    </a>
                                                </div>
                                            )}

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

                                            {/* Tip Card Slim */}
                                            <div className="tip-card-slim animate-fade-in" style={{ marginTop: '-1rem', marginBottom: '2rem' }}>
                                                <span className="tip-icon">💡</span>
                                                <p className="tip-text">
                                                    <strong>טיפ:</strong> כדאי להאזין להקלטה ולודא שהתמלול תואם למה שהתכוונתם, אם התמלול לא תואם שפרו את ההגייה.
                                                </p>
                                            </div>

                                            {/* Weighted Score Calculation Table */}
                                            <div className="qa-scores">
                                                <h5>חישוב ציון משוקלל</h5>

                                                <div className="weighted-score-table">
                                                    <div className="weighted-score-header">
                                                        <span>קריטריון</span>
                                                        <span>ציון</span>
                                                        <span>משקל</span>
                                                        <span>ניקוד</span>
                                                    </div>

                                                    {/* Use dynamic criteria based on whether this is a Module C question */}
                                                    {(() => {
                                                        const isModuleCQuestion = qa.module === 'C' || qa.moduleType === 'module-c' || practice.type === 'module-c'
                                                        const qaCriteria = getCriteriaLabels(isModuleCQuestion)
                                                        return Object.entries(qaCriteria)
                                                            .filter(([key]) => qa.scores && qa.scores[key] !== null && qa.scores[key] !== undefined)
                                                            .map(([key, criteria]) => {
                                                                const score = qa.scores[key]
                                                                const contribution = calculateWeightedContribution(score, criteria.weight)
                                                                return (
                                                                    <div key={key} className="weighted-score-row">
                                                                        <span className="criteria-name">
                                                                            {criteria.name}
                                                                            <small>({criteria.en})</small>
                                                                        </span>
                                                                        <span className={`criteria-score ${getScoreClass(score)}`} data-label="ציון">{score}</span>
                                                                        <span className="criteria-weight" data-label="משקל">{criteria.weight}%</span>
                                                                        <span className="criteria-contribution" data-label="ניקוד">{contribution}</span>
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
                                                {/* Fixed order: topicDevelopment -> vocabulary -> grammar -> fluency */}
                                                {['topicDevelopment', 'vocabulary', 'grammar', 'fluency']
                                                    .filter(key => key !== 'pronunciation' && qa.feedback && qa.feedback[key] !== null && qa.feedback[key] !== undefined)
                                                    .map(key => ({ key, data: qa.feedback[key] }))
                                                    .map(({ key, data }) => (
                                                        <div key={key} className="qa-feedback-item">
                                                            <div className="qa-feedback-header">
                                                                <span className="qa-feedback-name">{criteriaLabels[key]?.name}</span>
                                                                <div className="progress-bar">
                                                                    <div
                                                                        className={`progress-bar-fill ${getScoreClass(data.score)}`}
                                                                        style={{ width: `${data.score}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className={`qa-feedback-score ${getScoreClass(data.score)}`}>
                                                                    {data.score}
                                                                </span>
                                                            </div>

                                                            {/* Feedback text - shown first, before strengths/improvements */}
                                                            <p className="qa-feedback-text">{data.feedback}</p>

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

                                                            {/* General feedback - shown at the end after strengths/improvements */}
                                                            {(key === 'topicDevelopment' || key === 'vocabulary' || key === 'grammar' || key === 'fluency') && data.generalFeedback && (
                                                                <p className="qa-general-feedback">{data.generalFeedback}</p>
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
                                    <span>ניקוד</span>
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
                                            <span className="sim-q-name">שאלה {idx + 1}</span>
                                            <span className="module-badge" data-label="מודול">{moduleName}</span>
                                            <span className={`score ${getScoreClass(qa.totalScore)}`} data-label="ציון">{qa.totalScore}</span>
                                            <span data-label="משקל">{moduleWeight}%</span>
                                            <span className="contribution" data-label="ניקוד">{contribution}/{moduleWeight}</span>
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
                                // Calculate real module scores from questionAnalyses
                                const qa = practice.questionAnalyses || []

                                // Module A: index 0, 25% weight
                                const moduleAScore = qa.length > 0 ? (qa[0]?.totalScore || 0) : 0

                                // Module B: index 1, 25% weight
                                const moduleBScore = qa.length > 1 ? (qa[1]?.totalScore || 0) : 0

                                // Module C: index 2+, 50% weight total (average of remaining questions)
                                const moduleCQuestions = qa.slice(2)
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
                        <h3 className="section-title">סיכום ציון משוקלל</h3>
                        <div className="criteria-summary-grid">
                            {Object.entries(criteriaLabels)
                                .filter(([key]) => practice.scores?.[key] !== null && practice.scores?.[key] !== undefined)
                                .map(([key, criteria]) => {
                                    const score = practice.scores?.[key] || 0
                                    const contribution = calculateWeightedContribution(score, criteria.weight)
                                    return (
                                        <div key={key} className="criteria-summary-card">
                                            <div className="criteria-summary-header">
                                                <div className="criteria-summary-title">
                                                    <span className="criteria-icon">{criteria.icon}</span>
                                                    <div className="criteria-names">
                                                        <span className="name-he">{criteria.name}</span>
                                                        <span className="name-en">{criteria.en}</span>
                                                    </div>
                                                </div>
                                                <div className={`criteria-summary-score ${getScoreClass(score)}`}>
                                                    {score}
                                                </div>
                                            </div>

                                            <div className="criteria-summary-progress">
                                                <div
                                                    className={`progress-fill ${getScoreClass(score)}`}
                                                    style={{ width: `${score}%` }}
                                                ></div>
                                            </div>

                                            <div className="criteria-summary-footer">
                                                <div className="footer-stat-box">
                                                    <span className="stat-label">משקל</span>
                                                    <span className="stat-value">{criteria.weight}%</span>
                                                </div>
                                                <div className="footer-stat-box">
                                                    <span className="stat-label">ניקוד</span>
                                                    <span className="stat-value contribution-val">{contribution}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>

                        <div className="final-summary-total card">
                            <div className="total-label">
                                <FiTrendingUp className="text-primary" />
                                <span>ציון סופי משוקלל</span>
                            </div>
                            <div className={`total-value ${getScoreClass(practice.totalScore)}`}>
                                {practice.totalScore}
                                <span className="total-max">/100</span>
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

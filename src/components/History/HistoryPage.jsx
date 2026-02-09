import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePractice } from '../../context/PracticeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { FiClock, FiCalendar, FiChevronLeft, FiMic, FiPlay, FiAward, FiArrowRight, FiLoader, FiAlertCircle } from 'react-icons/fi'
import './History.css'

export default function HistoryPage() {
    const { practices, loading, refreshPractices } = usePractice()
    const { user } = useAuth()
    const [filter, setFilter] = useState('all')

    // Subscribe to realtime updates for processing status changes
    useEffect(() => {
        if (!isSupabaseConfigured || !user?.id) return

        const channel = supabase
            .channel('practice-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'practices',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Practice updated:', payload)
                    // Refresh practices when processing status changes
                    if (payload.new.processing_status === 'completed' ||
                        payload.new.processing_status === 'failed') {
                        refreshPractices()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.id, refreshPractices])

    const getScoreClass = (score) => {
        if (!score) return 'text-muted'
        if (score >= 85) return 'score-excellent'
        if (score >= 70) return 'score-good'
        if (score >= 55) return 'score-average'
        return 'score-poor'
    }

    const filteredPractices = practices.filter(p => {
        if (filter === 'all') return true
        return p.type === filter
    })

    const formatDate = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString('he-IL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getIcon = (type) => {
        switch (type) {
            case 'simulation': return <FiPlay />
            default: return <FiMic />
        }
    }

    const getTitle = (type) => {
        switch (type) {
            case 'simulation': return 'סימולציה מלאה'
            case 'module-a': return 'מודול A'
            case 'module-b': return 'מודול B'
            case 'module-c': return 'מודול C'
            default: return 'תרגול'
        }
    }

    const isProcessing = (practice) => {
        return practice.processingStatus === 'pending' ||
            practice.processingStatus === 'processing'
    }

    const hasFailed = (practice) => {
        return practice.processingStatus === 'failed'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <div className="page animate-fade-in">
            <div className="history-page">
                <header className="history-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                        <Link
                            to="/dashboard"
                            className="btn btn-ghost btn-sm btn-back-nav"
                        >
                            <FiArrowRight />
                            חזרה למסך הראשי
                        </Link>
                    </div>
                    <h1 className="page-title" style={{ margin: 0 }}>היסטוריית תרגול</h1>
                </header>

                <div className="history-filters">
                    <button
                        className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        הכל
                    </button>
                    <button
                        className={`filter-chip ${filter === 'module-a' ? 'active' : ''}`}
                        onClick={() => setFilter('module-a')}
                    >
                        מודול A
                    </button>
                    <button
                        className={`filter-chip ${filter === 'module-b' ? 'active' : ''}`}
                        onClick={() => setFilter('module-b')}
                    >
                        מודול B
                    </button>
                    <button
                        className={`filter-chip ${filter === 'module-c' ? 'active' : ''}`}
                        onClick={() => setFilter('module-c')}
                    >
                        מודול C
                    </button>
                    <button
                        className={`filter-chip ${filter === 'simulation' ? 'active' : ''}`}
                        onClick={() => setFilter('simulation')}
                    >
                        סימולציות
                    </button>
                </div>

                <div className="history-list">
                    {filteredPractices.length === 0 ? (
                        <div className="history-empty card">
                            <FiClock style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                            {filter === 'all' ? (
                                <>
                                    <h3>עדיין לא התחלת לתרגל</h3>
                                    <p>ההיסטוריה שלך ריקה כרגע.</p>
                                    <p style={{ marginTop: '0.5rem', fontWeight: 500, textAlign: 'center' }}>בוא נתחיל את התרגול הראשון!</p>
                                </>
                            ) : (
                                <>
                                    <h3>עדיין לא תרגלת מודול זה</h3>
                                    <p style={{ marginTop: '0.5rem', fontWeight: 500, textAlign: 'center' }}>בוא נתחיל את התרגול הראשון!</p>
                                </>
                            )}
                            <Link to="/practice" className="btn btn-primary mt-lg">
                                התחל לתרגל
                            </Link>
                        </div>
                    ) : (
                        filteredPractices.map(practice => (
                            <Link
                                key={practice.id}
                                to={isProcessing(practice) ? '#' : `/analysis/${practice.id}`}
                                className={`history-item ${isProcessing(practice) ? 'processing' : ''} ${hasFailed(practice) ? 'failed' : ''}`}
                                onClick={(e) => isProcessing(practice) && e.preventDefault()}
                            >
                                <div className="history-main-row">
                                    <div className="history-icon">
                                        {isProcessing(practice) ? (
                                            <FiLoader className="spin" />
                                        ) : hasFailed(practice) ? (
                                            <FiAlertCircle />
                                        ) : (
                                            getIcon(practice.type)
                                        )}
                                    </div>
                                    <div className="history-info">
                                        <span className="history-title">{getTitle(practice.type)}</span>
                                        <span className="history-date">
                                            <FiCalendar className="inline-icon" /> {formatDate(practice.completedAt || practice.startedAt)}
                                        </span>
                                    </div>

                                    <div className="history-meta">
                                        {practice.duration && (
                                            <div className="meta-item">
                                                <FiClock />
                                                {Math.round(practice.duration / 60)} דק׳
                                            </div>
                                        )}
                                    </div>

                                    <div className="history-score">
                                        {isProcessing(practice) ? (
                                            <>
                                                <span className="score-value processing-text">מעבד...</span>
                                                <span className="score-label">אנא המתן</span>
                                            </>
                                        ) : hasFailed(practice) ? (
                                            <>
                                                <span className="score-value failed-text">שגיאה</span>
                                                <span className="score-label">נסה שוב</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className={`score-value ${getScoreClass(practice.totalScore)}`}>
                                                    {practice.totalScore ?? '-'}
                                                </span>
                                                <span className="score-label">ציון</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="history-footer">
                                    {isProcessing(practice) ? (
                                        <span className="history-processing-msg">
                                            הניתוח מתבצע ברקע, ניתן לצאת מהעמוד
                                        </span>
                                    ) : hasFailed(practice) ? (
                                        <span className="history-error-msg">
                                            {practice.processingError || 'שגיאה בעיבוד התרגול'}
                                        </span>
                                    ) : (
                                        <span className="history-details-btn">
                                            לצפייה במשוב המלא
                                            <FiChevronLeft className="btn-icon" />
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}


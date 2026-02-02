import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePractice } from '../../context/PracticeContext'
import { FiMic, FiTrendingUp, FiAward, FiClock, FiArrowLeft, FiPlay } from 'react-icons/fi'
import './Dashboard.css'

export default function Dashboard() {
    const { user } = useAuth()
    const { getStats, practices } = usePractice()
    const stats = getStats()

    const getScoreClass = (score) => {
        if (score >= 85) return 'score-excellent'
        if (score >= 70) return 'score-good'
        if (score >= 55) return 'score-average'
        return 'score-poor'
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'בוקר טוב'
        if (hour < 17) return 'צהריים טובים'
        if (hour < 21) return 'ערב טוב'
        return 'לילה טוב'
    }

    const getRecommendation = () => {
        if (stats.totalPractices === 0) {
            return {
                title: 'התחלה עם מודול A',
                description: 'תרגול נושא כללי הוא דרך מעולה להתחיל',
                action: '/practice/module-a',
                icon: FiMic
            }
        }

        if (stats.simulationCount === 0) {
            return {
                title: 'שנתרגל סימולציה מלאה?',
                description: 'התרגול הכי טוב למבחן',
                action: '/practice/simulation',
                icon: FiPlay
            }
        }

        const lastScore = practices[0]?.totalScore || 0
        if (lastScore < 70) {
            return {
                title: 'ממשיכים לתרגל',
                description: 'כדאי להמשיך לתרגל כדי לשפר את הציון',
                action: '/practice',
                icon: FiTrendingUp
            }
        }

        return {
            title: 'כל הכבוד! ממשיכים',
            description: 'תרגול קבוע שומר על הרמה',
            action: '/practice',
            icon: FiAward
        }
    }

    const recommendation = getRecommendation()

    // Generate simple chart data
    const maxScore = Math.max(...stats.recentScores, 100)

    return (
        <div className="page animate-fade-in">
            <div className="dashboard">
                {/* Welcome Section */}
                <section className="dashboard-welcome">
                    <h1 className="welcome-title">{getGreeting()}, {user?.name?.split(' ')[0]}!</h1>
                    <p className="welcome-subtitle">שנתחיל לתרגל להיום?</p>
                </section>

                {/* Quick Action */}
                <Link to={recommendation.action} className="dashboard-cta card card-glow">
                    <div className="cta-icon">
                        <recommendation.icon />
                    </div>
                    <div className="cta-content">
                        <h3 className="cta-title">{recommendation.title}</h3>
                        <p className="cta-description">{recommendation.description}</p>
                    </div>
                    <FiArrowLeft className="cta-arrow" />
                </Link>

                {/* Stats Grid */}
                <section className="dashboard-stats">
                    <div className="stat-card card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)' }}>
                            <FiAward />
                        </div>
                        <div className="stat-content">
                            <span className={`stat-value ${getScoreClass(stats.averageScore)}`}>
                                {stats.averageScore || '--'}
                            </span>
                            <span className="stat-label">ציון ממוצע</span>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.2)', color: 'var(--secondary)' }}>
                            <FiMic />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.totalPractices}</span>
                            <span className="stat-label">תרגולים</span>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
                            <FiTrendingUp />
                        </div>
                        <div className="stat-content">
                            <span className={`stat-value ${stats.improvement > 0 ? 'score-good' : stats.improvement < 0 ? 'score-poor' : ''}`}>
                                {stats.improvement > 0 ? '+' : ''}{stats.improvement || '0'}
                            </span>
                            <span className="stat-label">שינוי אחרון</span>
                        </div>
                    </div>

                    <div className="stat-card card">
                        <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>
                            <FiClock />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.simulationCount}</span>
                            <span className="stat-label">סימולציות</span>
                        </div>
                    </div>
                </section>

                {/* Progress Chart */}
                {(stats.recentPractices?.length > 0 || stats.recentScores?.length > 0) && (
                    <section className="dashboard-chart card">
                        <h3 className="chart-title">התקדמות אחרונה</h3>
                        <div className="chart-container">
                            <div className="chart-bars">
                                {stats.recentPractices?.length > 0 ? (
                                    stats.recentPractices.map((practice, index) => {
                                        const score = practice.totalScore || 0
                                        const date = new Date(practice.completedAt || practice.startedAt)
                                        const dateStr = `${date.getDate()}/${date.getMonth() + 1}`

                                        return (
                                            <div key={practice.id || index} className="chart-bar-wrapper">
                                                <div
                                                    className={`chart-bar ${getScoreClass(score)}`}
                                                    style={{ height: `${Math.min(score, 100)}%` }}
                                                    title={`ציון: ${score} - ${date.toLocaleDateString('he-IL')}`}
                                                >
                                                    <span className="chart-bar-value">{score}</span>
                                                </div>
                                                <span className="chart-label">{dateStr}</span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    // Fallback for legacy/empty data
                                    stats.recentScores.map((score, index) => (
                                        <div key={index} className="chart-bar-wrapper">
                                            <div
                                                className={`chart-bar ${getScoreClass(score)}`}
                                                style={{ height: `${Math.min(score, 100)}%` }}
                                            >
                                                <span className="chart-bar-value">{score}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="chart-baseline"></div>
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {stats.totalPractices === 0 && (
                    <section className="dashboard-empty card">
                        <div className="empty-illustration">🎯</div>
                        <h3 className="empty-title">עוד לא תירגלתם</h3>
                        <p className="empty-text">
                            התרגול הראשון יתחיל את המסע להצלחה בבגרות
                        </p>
                        <Link to="/practice" className="btn btn-primary">
                            <FiMic />
                            מתחילים עכשיו
                        </Link>
                    </section>
                )}

                {/* Recent Practices */}
                {practices.length > 0 && (
                    <section className="dashboard-recent">
                        <div className="section-header">
                            <h3 className="section-title">תרגולים אחרונים</h3>
                            <Link to="/history" className="section-link">
                                הכל
                                <FiArrowLeft />
                            </Link>
                        </div>
                        <div className="recent-list">
                            {practices.slice(0, 3).map(practice => {
                                const dateStr = practice.completedAt || practice.startedAt
                                const date = dateStr ? new Date(dateStr) : null
                                const isValidDate = date && !isNaN(date.getTime()) && date.getFullYear() >= 2000

                                return (
                                    <Link
                                        key={practice.id}
                                        to={`/analysis/${practice.id}`}
                                        className="recent-item card card-hover"
                                    >
                                        <div className="recent-info">
                                            <span className="recent-type">
                                                {practice.type === 'simulation' ? 'סימולציה' :
                                                    practice.type === 'module-a' ? 'מודול A' :
                                                        practice.type === 'module-b' ? 'מודול B' : 'מודול C'}
                                            </span>
                                            <span className="recent-date">
                                                {isValidDate ? date.toLocaleDateString('he-IL') :
                                                    (practice.status === 'in-progress' ? 'בתהליך' : 'לא ידוע')}
                                            </span>
                                        </div>
                                        <div className={`recent-score ${getScoreClass(practice.totalScore || 0)}`}>
                                            {practice.totalScore ?? '-'}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}

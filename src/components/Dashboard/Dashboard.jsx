import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePractice } from '../../context/PracticeContext'
import { FiMic, FiTrendingUp, FiTrendingDown, FiClock, FiPlay, FiTarget, FiBarChart2, FiChevronLeft } from 'react-icons/fi'
import ScoreChart from './ScoreChart'
import './Dashboard.css'

export default function Dashboard() {
    const { user } = useAuth()
    const { getStats, practices } = usePractice()
    const stats = getStats()

    // --- Logic Helpers ---

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) return 'בוקר טוב'
        if (hour >= 12 && hour < 17) return 'צהריים טובים'
        if (hour >= 17 && hour < 22) return 'ערב טוב'
        return 'לילה טוב'
    }

    // Get recent scores for mini trend
    const getRecentTrend = () => {
        const completed = practices
            .filter(p => p.status === 'completed' && p.totalScore != null)
            .sort((a, b) => new Date(a.completedAt || a.startedAt) - new Date(b.completedAt || b.startedAt))
            .slice(-5)
        return completed.map(p => p.totalScore)
    }

    const recentTrend = getRecentTrend()

    // Calculate trend direction based on improvement value
    const getTrendDirection = () => {
        if (stats.improvement > 0) return 'up'
        if (stats.improvement < 0) return 'down'
        return 'neutral'
    }

    const trendDirection = getTrendDirection()

    return (
        <div className="page animate-fade-in">
            <div className="dashboard-v2">

                {/* 1. Header */}
                <header className="dashboard-header-simple">
                    <h1 className="greeting-simple">{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
                </header>

                {/* 2. Navigation Stack (The Core Actions) */}
                <section className="nav-stack">
                    <Link to="/practice" className="nav-btn-lg primary-btn">
                        <div className="nav-icon-wrapper"><FiMic /></div>
                        <div className="nav-text">
                            <span className="nav-title">התחלת תרגול</span>
                            <span className="nav-desc">תרגול מודול בודד או סימולציה</span>
                        </div>
                        <div className="nav-arrow-left">
                            <FiChevronLeft />
                        </div>
                    </Link>

                    <Link to="/history" className="nav-btn-lg history-nav-btn">
                        <div className="nav-icon-wrapper"><FiClock /></div>
                        <div className="nav-text">
                            <span className="nav-title">התרגולים שלי</span>
                            <span className="nav-desc">צפייה במשובים קודמים</span>
                        </div>
                    </Link>

                    <Link to="/statistics" className="nav-btn-lg tertiary-btn">
                        <div className="nav-icon-wrapper"><FiBarChart2 /></div>
                        <div className="nav-text">
                            <span className="nav-title">סטטיסטיקה והתקדמות</span>
                            <span className="nav-desc">ניתוח ביצועים</span>
                        </div>
                    </Link>
                </section>

                {/* 3. Quick Stats Row */}
                <section className="quick-stats-row">
                    <div className="quick-stat-card">
                        <div className="quick-stat-icon">
                            <FiPlay />
                        </div>
                        <div className="quick-stat-content">
                            <span className="quick-stat-value">{stats.totalPractices}</span>
                            <span className="quick-stat-label">תרגולים</span>
                        </div>
                    </div>

                    <div className="quick-stat-card">
                        <div className="quick-stat-icon avg-icon">
                            <FiTarget />
                        </div>
                        <div className="quick-stat-content">
                            <span className="quick-stat-value">{stats.averageScore || '--'}</span>
                            <span className="quick-stat-label">ציון ממוצע</span>
                        </div>
                    </div>

                    <div className="quick-stat-card">
                        <div className={`quick-stat-icon trend-icon ${trendDirection}`}>
                            {trendDirection === 'down' ? <FiTrendingDown /> : <FiTrendingUp />}
                        </div>
                        <div className="quick-stat-content">
                            <span
                                className={`quick-stat-value ${trendDirection === 'up' ? 'trend-up' : trendDirection === 'down' ? 'trend-down' : ''}`}
                                dir="ltr"
                                style={{ textAlign: 'right' }}
                            >
                                {stats.improvement > 0 ? `+${stats.improvement}` : stats.improvement || '0'}
                            </span>
                            <span className="quick-stat-label">שינוי</span>
                        </div>
                    </div>
                </section>

                {/* 4. Interactive Score Chart */}
                <section className="score-chart-section">
                    <ScoreChart practices={practices} />
                </section>

            </div>
        </div>
    )
}



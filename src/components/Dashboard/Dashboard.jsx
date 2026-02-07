import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePractice } from '../../context/PracticeContext'
import { FiMic, FiClock, FiActivity, FiCheckCircle, FiTarget, FiBarChart2, FiChevronLeft } from 'react-icons/fi'
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




    // Calculate practices this week
    const practicesThisWeek = practices.filter(p => {
        if (p.status !== 'completed') return false
        const d = new Date(p.completedAt || p.startedAt)
        const now = new Date()
        return (now - d) < 7 * 24 * 60 * 60 * 1000
    }).length

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
                        <div className="nav-arrow-left">
                            <FiChevronLeft />
                        </div>
                    </Link>

                    <Link to="/statistics" className="nav-btn-lg tertiary-btn">
                        <div className="nav-icon-wrapper"><FiBarChart2 /></div>
                        <div className="nav-text">
                            <span className="nav-title">סטטיסטיקה והתקדמות</span>
                            <span className="nav-desc">ניתוח ביצועים</span>
                        </div>
                        <div className="nav-arrow-left">
                            <FiChevronLeft />
                        </div>
                    </Link>
                </section>

                {/* 3. Quick Stats Row */}
                <section className="quick-stats-row">
                    <div className="overview-card">
                        <div className="icon-wrapper bg-blue">
                            <FiActivity />
                        </div>
                        <div className="overview-content">
                            <span className="overview-label">ציון ממוצע</span>
                            <span className="overview-value">{stats.averageScore || '-'}</span>
                        </div>
                    </div>

                    <div className="overview-card">
                        <div className="icon-wrapper bg-orange">
                            <FiCheckCircle />
                        </div>
                        <div className="overview-content">
                            <span className="overview-label">סה"כ תרגולים</span>
                            <span className="overview-value">{stats.totalPractices || 0}</span>
                            <span className="overview-trend">
                                {practicesThisWeek} השבוע
                            </span>
                        </div>
                    </div>

                    <div className="overview-card">
                        <div className="icon-wrapper bg-purple">
                            <FiTarget />
                        </div>
                        <div className="overview-content">
                            <span className="overview-label">הציון הכי גבוה</span>
                            <span className="overview-value">{Math.max(...(stats.recentScores || [0]), 0)}</span>
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



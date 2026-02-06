import { Link } from 'react-router-dom'
import { usePractice } from '../../context/PracticeContext'
import { FiArrowRight, FiTarget, FiPieChart, FiActivity, FiCheckCircle, FiCalendar } from 'react-icons/fi'
import ScoreChart from '../Dashboard/ScoreChart'
import './Statistics.css'

export default function StatisticsPage() {
    const { practices, getStats } = usePractice()
    const stats = getStats()


    // --- Data Processing ---

    // 1. Module Breakdown
    const getModuleStats = (moduleName) => {
        const modulePractices = practices.filter(p => p.type === moduleName)
        if (modulePractices.length === 0) return { avg: 0, count: 0 }

        const totalParams = modulePractices.reduce((sum, p) => sum + (p.totalScore || 0), 0)
        return {
            avg: Math.round(totalParams / modulePractices.length),
            count: modulePractices.length
        }
    }

    const moduleA = getModuleStats('module-a')
    const moduleB = getModuleStats('module-b')
    const moduleC = getModuleStats('module-c')
    const simulation = getModuleStats('simulation')

    // 2. Trend Data (Reverse chronological order for display, but chronological for graph)
    // ScoreChart component handles its own data processing

    // 3. Consistency
    // Mocking a heat map data structure or similar if needed, 
    // for now just simple frequency text
    const practicesThisWeek = practices.filter(p => {
        if (p.status !== 'completed') return false
        const d = new Date(p.completedAt || p.startedAt)
        const now = new Date()
        return (now - d) < 7 * 24 * 60 * 60 * 1000
    }).length

    const getScoreClass = (score) => {
        if (score >= 85) return 'score-excellent'
        if (score >= 70) return 'score-good'
        if (score >= 55) return 'score-average'
        return 'score-poor'
    }

    return (
        <div className="page animate-fade-in">
            <div className="statistics-page">
                {/* Header */}
                <header className="stats-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                        <Link to="/dashboard" className="btn btn-ghost btn-sm btn-back-nav">
                            <FiArrowRight /> חזרה למסך הראשי
                        </Link>
                    </div>
                    <h1 className="page-title" style={{ margin: 0 }}>סטטיסטיקה והתקדמות</h1>
                </header>

                {/* 1. Overview Cards */}
                <section className="stats-overview">
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

                {/* 2. Score Trend Chart */}
                <ScoreChart practices={practices} />

                {/* 3. Module Breakdown */}
                <section className="stats-section card">
                    <div className="section-header">
                        <h2><FiPieChart /> חלוקה לפי מודולים</h2>
                    </div>
                    <div className="modules-grid">
                        <div className="module-stat-item">
                            <div className="module-header">
                                <span>Module A</span>
                                <span className={getScoreClass(moduleA.avg)}>{moduleA.avg}</span>
                            </div>
                            <div className="progress-bg">
                                <div className="progress-fill a-fill" style={{ width: `${moduleA.avg}%` }}></div>
                            </div>
                            <div className="module-footer">{moduleA.count} תרגולים</div>
                        </div>

                        <div className="module-stat-item">
                            <div className="module-header">
                                <span>Module B</span>
                                <span className={getScoreClass(moduleB.avg)}>{moduleB.avg}</span>
                            </div>
                            <div className="progress-bg">
                                <div className="progress-fill b-fill" style={{ width: `${moduleB.avg}%` }}></div>
                            </div>
                            <div className="module-footer">{moduleB.count} תרגולים</div>
                        </div>

                        <div className="module-stat-item">
                            <div className="module-header">
                                <span>Module C</span>
                                <span className={getScoreClass(moduleC.avg)}>{moduleC.avg}</span>
                            </div>
                            <div className="progress-bg">
                                <div className="progress-fill c-fill" style={{ width: `${moduleC.avg}%` }}></div>
                            </div>
                            <div className="module-footer">{moduleC.count} תרגולים</div>
                        </div>

                        <div className="module-stat-item simulation">
                            <div className="module-header">
                                <span>סימולציות</span>
                                <span className={getScoreClass(simulation.avg)}>{simulation.avg}</span>
                            </div>
                            <div className="progress-bg">
                                <div className="progress-fill sim-fill" style={{ width: `${simulation.avg}%` }}></div>
                            </div>
                            <div className="module-footer">{simulation.count} תרגולים</div>
                        </div>
                    </div>
                </section>



            </div>
        </div>
    )
}

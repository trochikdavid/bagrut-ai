import { Link } from 'react-router-dom'
import { FiMessageSquare, FiFileText, FiVideo, FiPlay, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import './Practice.css'

export default function ModuleSelector() {
    const modules = [
        {
            id: 'module-a',
            title: 'מודול A',
            subtitle: 'נושא כללי / דעה אישית',
            description: 'בחירת שאלה אחת מתוך שתיים ודיבור על נושא אישי או הבעת דעה',
            icon: FiMessageSquare,
            weight: '25%',
            color: 'var(--primary)',
            bgColor: '#EEF2FF' // Indigo 50
        },
        {
            id: 'module-b',
            title: 'מודול B',
            subtitle: 'שאלות על הפרויקט',
            description: 'מענה על שאלות הקשורות לפרויקט הגמר',
            icon: FiFileText,
            weight: '25%',
            color: 'var(--info)',
            bgColor: '#F0F9FF' // Sky 50
        },
        {
            id: 'module-c',
            title: 'מודול C',
            subtitle: 'סרטון + שאלות הבנה',
            description: 'צפייה בסרטון ומענה על שתי שאלות הבנה',
            icon: FiVideo,
            weight: '50%',
            color: 'var(--success)',
            bgColor: '#F0FDF4' // Green 50
        }
    ]

    return (
        <div className="page animate-fade-in" style={{ paddingTop: 'var(--space-sm)' }}>
            <div className="practice-selector">
                <header className="page-header" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                        <Link
                            to="/dashboard"
                            className="btn btn-ghost btn-sm btn-back-nav"
                        >
                            <FiArrowRight />
                            חזרה למסך הראשי
                        </Link>
                    </div>
                    <div>
                        <h1 className="page-title" style={{ marginTop: 0 }}>באיזה מודול נתרגל היום?</h1>
                        <p className="page-subtitle">אפשר לתרגל מודול בודד או סימולציה מלאה</p>
                    </div>
                </header>

                {/* Tip Card */}
                <div className="tip-card-slim animate-fade-in">
                    <span className="tip-icon">💡</span>
                    <p className="tip-text">
                        <strong>טיפ:</strong> כדאי להתחיל מתרגול של מודול בודד לפני הסימולציה המלאה כדי להתקדם בהדרגה.
                    </p>
                </div>

                {/* Simulation CTA */}
                <Link to="/practice/simulation" className="simulation-cta card card-glow">
                    <div className="simulation-icon">
                        <FiPlay />
                    </div>
                    <div className="simulation-content">
                        <h2 className="simulation-title">סימולציה מלאה</h2>
                        <p className="simulation-description">
                            כל שלושת המודולים יחד, עם טיימר של 30 דקות – בדיוק כמו במבחן האמיתי
                        </p>
                        <div className="simulation-weights">
                            <span className="weight-badge">A: 25%</span>
                            <span className="weight-badge">B: 25%</span>
                            <span className="weight-badge">C: 50%</span>
                        </div>
                    </div>
                    <FiArrowLeft className="simulation-arrow" />
                </Link>

                <div className="divider-text">
                    <span>או תרגול של מודול בודד</span>
                </div>

                {/* Module Cards */}
                <div className="modules-grid">
                    {modules.map(module => (
                        <Link
                            key={module.id}
                            to={`/practice/${module.id}`}
                            className="module-card card card-hover"
                        >
                            <div
                                className="module-icon"
                                style={{ background: module.bgColor, color: module.color }}
                            >
                                <module.icon />
                            </div>
                            <div className="module-content">
                                <div className="module-header">
                                    <h3 className="module-title">{module.title}</h3>
                                    <span className="module-weight" style={{ color: module.color }}>
                                        {module.weight}
                                    </span>
                                </div>
                                <p className="module-subtitle">{module.subtitle}</p>
                                <p className="module-description">{module.description}</p>
                            </div>
                            <FiArrowLeft className="module-arrow" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

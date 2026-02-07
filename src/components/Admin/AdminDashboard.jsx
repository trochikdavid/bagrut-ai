import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { mockQuestions } from '../../services/mockData'
import * as adminService from '../../services/adminService'
import {
    FiUsers, FiActivity, FiMic, FiClock, FiArrowRight,
    FiPlus, FiTrash2, FiEdit, FiLogOut, FiHome, FiVideo, FiX, FiRefreshCw,
    FiCheck, FiSlash
} from 'react-icons/fi'
import './Admin.css'

export default function AdminDashboard() {
    const { user, logout } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [questions, setQuestions] = useState({ 'module-a': [], 'module-b': [], 'module-c': [] })
    const [showAddQuestion, setShowAddQuestion] = useState(false)
    const [showAddModuleC, setShowAddModuleC] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [newQuestion, setNewQuestion] = useState({ text: '', module: 'module-a' })
    const [newModuleC, setNewModuleC] = useState({
        videoUrl: '',
        videoTitle: '',
        videoTitleHe: '',
        videoTranscript: '',
        questions: [
            { text: '' },
            { text: '' }
        ]
    })

    // State for editing Module C questions
    const [showEditModuleC, setShowEditModuleC] = useState(false)
    const [editingModuleC, setEditingModuleC] = useState(null)

    // Real data from Supabase
    const [users, setUsers] = useState([])
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        totalPractices: 0,
        avgSessionTime: '0:00',
        practicesThisWeek: [0, 0, 0, 0, 0, 0, 0],
        scoreDistribution: { excellent: 0, good: 0, average: 0, needsWork: 0 }
    })
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [loadingStats, setLoadingStats] = useState(false)

    // Load data on mount and tab change
    useEffect(() => {
        if (activeTab === 'overview') {
            loadStats()
        } else if (activeTab === 'users') {
            loadUsers()
        } else if (activeTab === 'questions') {
            loadQuestions()
        }
    }, [activeTab])

    const loadQuestions = async () => {
        try {
            const fetchedQuestions = await adminService.getQuestions()
            setQuestions(fetchedQuestions)
        } catch (error) {
            alert('שגיאה בטעינת שאלות')
        }
    }

    const loadUsers = async () => {
        setLoadingUsers(true)
        try {
            const fetchedUsers = await adminService.getAllUsers()
            setUsers(fetchedUsers)
        } catch (error) {
        } finally {
            setLoadingUsers(false)
        }
    }

    const loadStats = async () => {
        setLoadingStats(true)
        try {
            const fetchedStats = await adminService.getAdminStats()
            setStats(fetchedStats)
        } catch (error) {
        } finally {
            setLoadingStats(false)
        }
    }

    const handleLogout = () => {
        setShowLogoutConfirm(true)
    }

    const confirmLogout = () => {
        setShowLogoutConfirm(false)
        logout()
    }

    const handleAddQuestion = async () => {
        if (newQuestion.text) {
            try {
                const createdQ = await adminService.createQuestion({
                    module: newQuestion.module,
                    text: newQuestion.text
                })

                setQuestions(prev => ({
                    ...prev,
                    [newQuestion.module]: [...(prev[newQuestion.module] || []), createdQ]
                }))

                setNewQuestion({ text: '', module: 'module-a' })
                setShowAddQuestion(false)
            } catch (error) {
                alert('שגיאה ביצירת שאלה')
            }
        }
    }

    const handleAddModuleC = async () => {
        if (newModuleC.videoUrl && newModuleC.videoTitle &&
            newModuleC.questions[0].text && newModuleC.questions[1].text) {

            try {
                const createdVideo = await adminService.createQuestion({
                    module: 'module-c',
                    videoUrl: newModuleC.videoUrl,
                    videoTitle: newModuleC.videoTitle,
                    videoTitleHe: newModuleC.videoTitleHe,
                    videoTranscript: newModuleC.videoTranscript,
                    questions: newModuleC.questions
                })

                setQuestions(prev => ({
                    ...prev,
                    'module-c': [...(prev['module-c'] || []), createdVideo]
                }))

                setNewModuleC({
                    videoUrl: '',
                    videoTitle: '',
                    videoTitleHe: '',
                    videoTranscript: '',
                    questions: [{ text: '' }, { text: '' }]
                })
                setShowAddModuleC(false)
            } catch (error) {
                alert('שגיאה ביצירת סרטון')
            }
        }
    }

    const handleDeleteQuestion = async (module, questionId) => {
        if (window.confirm('האם למחוק שאלה זו?')) {
            try {
                await adminService.deleteQuestion(questionId)
                setQuestions(prev => ({
                    ...prev,
                    [module]: prev[module].filter(q => q.id !== questionId)
                }))
            } catch (error) {
                alert('שגיאה במחיקת שאלה')
            }
        }
    }

    const updateModuleCQuestion = (index, field, value) => {
        setNewModuleC(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === index ? { ...q, [field]: value } : q
            )
        }))
    }

    const handleToggleApproval = async (userId, currentStatus) => {
        try {
            await adminService.toggleUserApproval(userId, currentStatus)
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, isApproved: !currentStatus } : u
            ))
        } catch (error) {
            alert('שגיאה בעדכון סטטוס משתמש')
        }
    }

    const handleDeleteUser = async (userId) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה? מחיקה זו היא סופית וכוללת את כל נתוני המשתמש.')) {
            try {
                await adminService.deleteUser(userId)
                setUsers(prev => prev.filter(u => u.id !== userId))
            } catch (error) {
                alert('שגיאה במחיקת משתמש')
            }
        }
    }

    // Open edit modal for Module C video
    const handleEditModuleC = (video) => {
        setEditingModuleC({
            id: video.id,
            videoUrl: video.videoUrl,
            videoTitle: video.videoTitle,
            videoTitleHe: video.videoTitleHe,
            videoTranscript: video.videoTranscript || '',
            questions: video.questions || [{ text: '' }, { text: '' }]
        })
        setShowEditModuleC(true)
    }

    // Update editing Module C question
    const updateEditingModuleCQuestion = (index, field, value) => {
        setEditingModuleC(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === index ? { ...q, [field]: value } : q
            )
        }))
    }

    // Save edited Module C
    const handleSaveModuleC = async () => {
        if (!editingModuleC) return

        try {
            const updated = await adminService.updateQuestion(editingModuleC.id, {
                videoUrl: editingModuleC.videoUrl,
                videoTitle: editingModuleC.videoTitle,
                videoTitleHe: editingModuleC.videoTitleHe,
                videoTranscript: editingModuleC.videoTranscript,
                questions: editingModuleC.questions
            })

            setQuestions(prev => ({
                ...prev,
                'module-c': prev['module-c'].map(v =>
                    v.id === editingModuleC.id ? updated : v
                )
            }))

            setShowEditModuleC(false)
            setEditingModuleC(null)
        } catch (error) {
            alert('שגיאה בעדכון סרטון')
        }
    }

    const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

    // Calculate percentages for score distribution
    const totalScored = stats.scoreDistribution.excellent + stats.scoreDistribution.good +
        stats.scoreDistribution.average + stats.scoreDistribution.needsWork
    const getPercentage = (value) => totalScored > 0 ? Math.round((value / totalScored) * 100) : 0

    return (
        <div className="admin-dashboard">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">🎯</div>
                    <span className="sidebar-title">בגרות AI</span>
                    <span className="sidebar-badge">אדמין</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FiActivity />
                        סקירה כללית
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <FiUsers />
                        משתמשים
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'questions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('questions')}
                    >
                        <FiMic />
                        בנק שאלות
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <Link to="/dashboard" className="nav-item">
                        <FiHome />
                        חזרה לאפליקציה
                    </Link>
                    <button className="nav-item danger" onClick={handleLogout}>
                        <FiLogOut />
                        התנתקות
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <h1>
                        {activeTab === 'overview' && 'סקירה כללית'}
                        {activeTab === 'users' && 'ניהול משתמשים'}
                        {activeTab === 'questions' && 'בנק שאלות'}
                    </h1>
                    <div className="admin-user">
                        <span>{user?.name}</span>
                    </div>
                </header>

                <div className="admin-content">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="overview-tab animate-fade-in">
                            <div className="section-header">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={loadStats}
                                    disabled={loadingStats}
                                >
                                    <FiRefreshCw className={loadingStats ? 'animate-spin' : ''} />
                                    רענן
                                </button>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-card card">
                                    <div className="stat-card-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)' }}>
                                        <FiUsers />
                                    </div>
                                    <div className="stat-card-content">
                                        <span className="stat-card-value">{stats.totalUsers}</span>
                                        <span className="stat-card-label">סה"כ משתמשים</span>
                                    </div>
                                </div>

                                <div className="stat-card card">
                                    <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
                                        <FiActivity />
                                    </div>
                                    <div className="stat-card-content">
                                        <span className="stat-card-value">{stats.activeToday}</span>
                                        <span className="stat-card-label">פעילים היום</span>
                                    </div>
                                </div>

                                <div className="stat-card card">
                                    <div className="stat-card-icon" style={{ background: 'rgba(14, 165, 233, 0.2)', color: 'var(--secondary)' }}>
                                        <FiMic />
                                    </div>
                                    <div className="stat-card-content">
                                        <span className="stat-card-value">{stats.totalPractices}</span>
                                        <span className="stat-card-label">סה"כ תרגולים</span>
                                    </div>
                                </div>

                                <div className="stat-card card">
                                    <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>
                                        <FiClock />
                                    </div>
                                    <div className="stat-card-content">
                                        <span className="stat-card-value">{stats.avgSessionTime}</span>
                                        <span className="stat-card-label">זמן ממוצע</span>
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Chart */}
                            <div className="card chart-card">
                                <h3>תרגולים השבוע</h3>
                                <div className="weekly-chart">
                                    {stats.practicesThisWeek.map((count, index) => {
                                        const maxCount = Math.max(...stats.practicesThisWeek, 1)
                                        return (
                                            <div key={index} className="chart-column">
                                                <div className="chart-bar-container">
                                                    <div
                                                        className="chart-bar"
                                                        style={{ height: `${(count / maxCount) * 100}%` }}
                                                    >
                                                        <span className="chart-bar-label">{count}</span>
                                                    </div>
                                                </div>
                                                <span className="chart-day">{weekDays[index]}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Score Distribution */}
                            <div className="card">
                                <h3>התפלגות ציונים</h3>
                                <div className="score-distribution">
                                    <div className="distribution-item">
                                        <div className="distribution-bar">
                                            <div className="distribution-fill excellent" style={{ width: `${getPercentage(stats.scoreDistribution.excellent)}%` }}></div>
                                        </div>
                                        <span className="distribution-label">מצוין (90-100)</span>
                                        <span className="distribution-value">{stats.scoreDistribution.excellent} ({getPercentage(stats.scoreDistribution.excellent)}%)</span>
                                    </div>
                                    <div className="distribution-item">
                                        <div className="distribution-bar">
                                            <div className="distribution-fill good" style={{ width: `${getPercentage(stats.scoreDistribution.good)}%` }}></div>
                                        </div>
                                        <span className="distribution-label">טוב (70-89)</span>
                                        <span className="distribution-value">{stats.scoreDistribution.good} ({getPercentage(stats.scoreDistribution.good)}%)</span>
                                    </div>
                                    <div className="distribution-item">
                                        <div className="distribution-bar">
                                            <div className="distribution-fill average" style={{ width: `${getPercentage(stats.scoreDistribution.average)}%` }}></div>
                                        </div>
                                        <span className="distribution-label">בינוני (55-69)</span>
                                        <span className="distribution-value">{stats.scoreDistribution.average} ({getPercentage(stats.scoreDistribution.average)}%)</span>
                                    </div>
                                    <div className="distribution-item">
                                        <div className="distribution-bar">
                                            <div className="distribution-fill poor" style={{ width: `${getPercentage(stats.scoreDistribution.needsWork)}%` }}></div>
                                        </div>
                                        <span className="distribution-label">דרוש שיפור (0-54)</span>
                                        <span className="distribution-value">{stats.scoreDistribution.needsWork} ({getPercentage(stats.scoreDistribution.needsWork)}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="users-tab animate-fade-in">
                            <div className="section-header">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={loadUsers}
                                    disabled={loadingUsers}
                                >
                                    <FiRefreshCw className={loadingUsers ? 'animate-spin' : ''} />
                                    רענן
                                </button>
                            </div>

                            <div className="users-table card">
                                {loadingUsers ? (
                                    <div className="loading-state">
                                        <div className="spinner" style={{ width: 40, height: 40 }}></div>
                                        <p>טוען משתמשים...</p>
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="empty-state">
                                        <FiUsers size={48} />
                                        <p>אין משתמשים רשומים עדיין</p>
                                    </div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>שם</th>
                                                <th>אימייל</th>
                                                <th>סטטוס</th>
                                                <th>תרגולים</th>
                                                <th>ציון ממוצע</th>
                                                <th>פעילות אחרונה</th>
                                                <th>פעולות</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id}>
                                                    <td>
                                                        <div className="user-cell">
                                                            <div className="user-avatar">{u.name?.charAt(0) || '?'}</div>
                                                            <div className="user-info">
                                                                <span className="user-name">{u.name}</span>
                                                                <span className="user-role-badge">{u.role === 'admin' ? 'מנהל' : 'תלמיד'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        <span className={`status-badge ${u.isApproved ? 'approved' : 'pending'}`}>
                                                            {u.isApproved ? 'מאושר' : 'ממתין'}
                                                        </span>
                                                    </td>
                                                    <td>{u.practiceCount}</td>
                                                    <td>
                                                        <span className={`score-badge ${u.avgScore >= 76 ? 'excellent' : u.avgScore >= 55 ? 'good' : 'average'}`}>
                                                            {u.avgScore || '-'}
                                                        </span>
                                                    </td>
                                                    <td>{u.lastActive || '-'}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className={`btn-icon small ${u.isApproved ? 'warning' : 'success'}`}
                                                                onClick={() => handleToggleApproval(u.id, u.isApproved)}
                                                                title={u.isApproved ? 'חסום משתמש' : 'אשר משתמש'}
                                                            >
                                                                {u.isApproved ? <FiSlash /> : <FiCheck />}
                                                            </button>
                                                            <button
                                                                className="btn-icon small danger"
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                title="מחק משתמש"
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Questions Tab */}
                    {activeTab === 'questions' && (
                        <div className="questions-tab animate-fade-in">
                            <div className="questions-header">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowAddQuestion(true)}
                                >
                                    <FiPlus />
                                    הוסף שאלה (A/B)
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModuleC(true)}
                                >
                                    <FiVideo />
                                    הוסף וידאו (C)
                                </button>
                            </div>

                            {/* Module A Questions */}
                            <div className="questions-section card">
                                <h3>מודול A - נושאים כלליים ({questions['module-a']?.length || 0} שאלות)</h3>
                                <div className="questions-list">
                                    {questions['module-a']?.map(q => (
                                        <div key={q.id} className="question-item">
                                            <div className="question-content">
                                                <p className="question-en">{q.text}</p>
                                            </div>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleDeleteQuestion('module-a', q.id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Module B Questions */}
                            <div className="questions-section card">
                                <h3>מודול B - שאלות פרויקט ({questions['module-b']?.length || 0} שאלות)</h3>
                                <div className="questions-list">
                                    {questions['module-b']?.map(q => (
                                        <div key={q.id} className="question-item">
                                            <div className="question-content">
                                                <p className="question-en">{q.text}</p>
                                            </div>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleDeleteQuestion('module-b', q.id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Module C Videos */}
                            <div className="questions-section card">
                                <h3>מודול C - סרטונים ושאלות ({questions['module-c']?.length || 0} סרטונים)</h3>
                                <div className="questions-list">
                                    {questions['module-c']?.map(video => (
                                        <div key={video.id} className="video-item">
                                            <div className="video-item-header">
                                                <div className="video-info">
                                                    <FiVideo className="video-icon" />
                                                    <div>
                                                        <p className="video-title">{video.videoTitle}</p>
                                                        <p className="video-title-he">{video.videoTitleHe}</p>
                                                        <div className="video-meta">
                                                            {video.videoUrl && (
                                                                <a
                                                                    href={video.videoUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="video-link"
                                                                >
                                                                    🔗 צפה בסרטון
                                                                </a>
                                                            )}
                                                            <span className={`transcript-badge ${video.videoTranscript ? 'has-transcript' : 'no-transcript'}`}>
                                                                {video.videoTranscript ? '✓ יש תמלול' : '✗ אין תמלול'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="video-actions">
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => handleEditModuleC(video)}
                                                        title="ערוך סרטון"
                                                    >
                                                        <FiEdit />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => handleDeleteQuestion('module-c', video.id)}
                                                        title="מחק סרטון"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="video-questions">
                                                {video.questions?.map((q, idx) => (
                                                    <div key={q.id || idx} className="video-question">
                                                        <span className="video-question-num">ש{idx + 1}</span>
                                                        <div>
                                                            <p className="question-en">{q.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>התנתקות</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowLogoutConfirm(false)}>
                                <FiX />
                            </button>
                        </div>
                        <p style={{ margin: 'var(--space-md) 0', color: 'var(--text-secondary)' }}>
                            האם לצאת מחשבון האדמין?
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                ביטול
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={confirmLogout}
                            >
                                התנתק
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Question Modal (A/B) */}
            {showAddQuestion && (
                <div className="modal-backdrop" onClick={() => setShowAddQuestion(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>הוסף שאלה חדשה</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAddQuestion(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">מודול</label>
                            <select
                                className="form-input"
                                value={newQuestion.module}
                                onChange={e => setNewQuestion(prev => ({ ...prev, module: e.target.value }))}
                            >
                                <option value="module-a">מודול A</option>
                                <option value="module-b">מודול B</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">שאלה באנגלית</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={newQuestion.text}
                                onChange={e => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                                placeholder="Enter the question in English..."
                                dir="ltr"
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowAddQuestion(false)}
                            >
                                ביטול
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddQuestion}
                            >
                                הוסף
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Module C Modal */}
            {showAddModuleC && (
                <div className="modal-backdrop" onClick={() => setShowAddModuleC(false)}>
                    <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>הוסף וידאו חדש - מודול C</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModuleC(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">קישור YouTube (embed)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newModuleC.videoUrl}
                                onChange={e => setNewModuleC(prev => ({ ...prev, videoUrl: e.target.value }))}
                                placeholder="https://www.youtube.com/embed/..."
                                dir="ltr"
                            />
                            <small className="form-hint">העתק את קישור ה-embed מיוטיוב</small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">שם הסרטון (אנגלית)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newModuleC.videoTitle}
                                    onChange={e => setNewModuleC(prev => ({ ...prev, videoTitle: e.target.value }))}
                                    placeholder="Video title..."
                                    dir="ltr"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">שם הסרטון (עברית)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newModuleC.videoTitleHe}
                                    onChange={e => setNewModuleC(prev => ({ ...prev, videoTitleHe: e.target.value }))}
                                    placeholder="שם הסרטון..."
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">תמלול הסרטון (אופציונלי)</label>
                            <textarea
                                className="form-input transcript-input"
                                rows={5}
                                value={newModuleC.videoTranscript}
                                onChange={e => setNewModuleC(prev => ({ ...prev, videoTranscript: e.target.value }))}
                                placeholder="הדבק כאן את תמלול הסרטון מיוטיוב... (לא יוצג למשתמשים, ישמש לניתוח AI בעתיד)"
                                dir="ltr"
                            />
                            <small className="form-hint">התמלול ישמש בעתיד לניתוח תשובות התלמידים באמצעות AI</small>
                        </div>

                        <div className="form-divider">
                            <span>שאלות על הסרטון</span>
                        </div>

                        {[0, 1].map(idx => (
                            <div key={idx} className="question-input-group">
                                <div className="question-input-header">
                                    <span className="question-input-num">שאלה {idx + 1} (25%)</span>
                                </div>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newModuleC.questions[idx].text}
                                        onChange={e => updateModuleCQuestion(idx, 'text', e.target.value)}
                                        placeholder="Question in English..."
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowAddModuleC(false)}
                            >
                                ביטול
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddModuleC}
                            >
                                הוסף סרטון
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Module C Modal */}
            {showEditModuleC && editingModuleC && (
                <div className="modal-backdrop" onClick={() => { setShowEditModuleC(false); setEditingModuleC(null); }}>
                    <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>עריכת וידאו - מודול C</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowEditModuleC(false); setEditingModuleC(null); }}>
                                <FiX />
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">קישור YouTube (embed)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={editingModuleC.videoUrl}
                                onChange={e => setEditingModuleC(prev => ({ ...prev, videoUrl: e.target.value }))}
                                placeholder="https://www.youtube.com/embed/..."
                                dir="ltr"
                            />
                            {editingModuleC.videoUrl && (
                                <a
                                    href={editingModuleC.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="video-preview-link"
                                >
                                    🔗 פתח סרטון בחלון חדש
                                </a>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">שם הסרטון (אנגלית)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editingModuleC.videoTitle}
                                    onChange={e => setEditingModuleC(prev => ({ ...prev, videoTitle: e.target.value }))}
                                    placeholder="Video title..."
                                    dir="ltr"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">שם הסרטון (עברית)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editingModuleC.videoTitleHe}
                                    onChange={e => setEditingModuleC(prev => ({ ...prev, videoTitleHe: e.target.value }))}
                                    placeholder="שם הסרטון..."
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">תמלול הסרטון</label>
                            <textarea
                                className="form-input transcript-input"
                                rows={8}
                                value={editingModuleC.videoTranscript}
                                onChange={e => setEditingModuleC(prev => ({ ...prev, videoTranscript: e.target.value }))}
                                placeholder="הדבק כאן את תמלול הסרטון מיוטיוב... (לא יוצג למשתמשים, ישמש לניתוח AI בעתיד)"
                                dir="ltr"
                            />
                            <small className="form-hint">התמלול ישמש בעתיד לניתוח תשובות התלמידים באמצעות AI</small>
                        </div>

                        <div className="form-divider">
                            <span>שאלות על הסרטון</span>
                        </div>

                        {editingModuleC.questions.map((q, idx) => (
                            <div key={idx} className="question-input-group">
                                <div className="question-input-header">
                                    <span className="question-input-num">שאלה {idx + 1} (25%)</span>
                                </div>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={q.text}
                                        onChange={e => updateEditingModuleCQuestion(idx, 'text', e.target.value)}
                                        placeholder="Question in English..."
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setShowEditModuleC(false); setEditingModuleC(null); }}
                            >
                                ביטול
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveModuleC}
                            >
                                שמור שינויים
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

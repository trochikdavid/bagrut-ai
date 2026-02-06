import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePractice } from '../../context/PracticeContext'
import {
    FiUser, FiMail, FiPackage, FiLogOut, FiTrash2,
    FiChevronLeft, FiShield, FiKey
} from 'react-icons/fi'
import './Profile.css'

export default function ProfilePage() {
    const { user, logout, deleteAccount, updateProfile } = useAuth()
    const { clearHistory, getStats } = usePractice()
    const stats = getStats()

    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [newName, setNewName] = useState(user?.name || '')

    const handleLogout = () => {
        setShowLogoutConfirm(true)
    }

    const confirmLogout = () => {
        setShowLogoutConfirm(false)
        logout()
    }

    const handleDeleteAccount = async () => {
        setLoading(true)
        await clearHistory()
        await deleteAccount()
        setLoading(false)
    }

    const handleUpdateName = async () => {
        if (newName.trim() && newName !== user.name) {
            await updateProfile({ name: newName.trim() })
        }
        setEditingName(false)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <>
            <div className="page animate-fade-in">
                <div className="profile-page">
                    <header className="page-header">
                        <h1 className="page-title">הפרופיל שלי</h1>
                    </header>

                    {/* Profile Card */}
                    <div className="profile-card card">
                        <div className="profile-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="profile-info">
                            {editingName ? (
                                <div className="profile-edit-name">
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={handleUpdateName}>
                                        שמור
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}>
                                        ביטול
                                    </button>
                                </div>
                            ) : (
                                <h2 className="profile-name" onClick={() => setEditingName(true)}>
                                    {user?.name}
                                    <span className="edit-hint">לחץ לעריכה</span>
                                </h2>
                            )}
                            <p className="profile-email">{user?.email}</p>
                            <p className="profile-joined">
                                הצטרפות ב: {formatDate(user?.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="profile-stats card">
                        <div className="profile-stat">
                            <span className="profile-stat-value">{stats.totalPractices}</span>
                            <span className="profile-stat-label">תרגולים</span>
                        </div>
                        <div className="profile-stat">
                            <span className="profile-stat-value">{stats.averageScore || '--'}</span>
                            <span className="profile-stat-label">ציון ממוצע</span>
                        </div>
                        <div className="profile-stat">
                            <span className="profile-stat-value">{stats.simulationCount}</span>
                            <span className="profile-stat-label">סימולציות</span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="profile-menu">
                        <div className="menu-section">
                            <h4 className="menu-section-title">חשבון</h4>

                            <div className="menu-item card">
                                <FiPackage className="menu-icon" />
                                <div className="menu-content">
                                    <span className="menu-label">חבילה</span>
                                    <span className="menu-value">חינמי (MVP)</span>
                                </div>
                            </div>

                            <button className="menu-item card" onClick={handleLogout}>
                                <FiLogOut className="menu-icon" />
                                <div className="menu-content">
                                    <span className="menu-label">התנתקות</span>
                                </div>
                                <FiChevronLeft className="menu-arrow" />
                            </button>
                        </div>

                        <div className="menu-section">
                            <h4 className="menu-section-title">פרטיות ואבטחה</h4>

                            <Link to="#" className="menu-item card">
                                <FiShield className="menu-icon" />
                                <div className="menu-content">
                                    <span className="menu-label">מדיניות פרטיות</span>
                                </div>
                                <FiChevronLeft className="menu-arrow" />
                            </Link>

                            <button
                                className="menu-item card danger"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <FiTrash2 className="menu-icon" />
                                <div className="menu-content">
                                    <span className="menu-label">מחיקת חשבון</span>
                                </div>
                                <FiChevronLeft className="menu-arrow" />
                            </button>
                        </div>

                        {user?.isAdmin && (
                            <div className="menu-section">
                                <h4 className="menu-section-title">ניהול</h4>
                                <Link to="/admin" className="menu-item card admin">
                                    <FiKey className="menu-icon" />
                                    <div className="menu-content">
                                        <span className="menu-label">פאנל אדמין</span>
                                    </div>
                                    <FiChevronLeft className="menu-arrow" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>התנתקות</h3>
                        <p style={{ margin: 'var(--space-md) 0', color: 'var(--text-secondary)' }}>
                            האם לצאת מהחשבון?
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>מחיקת חשבון</h3>
                        <p style={{ margin: 'var(--space-md) 0', color: 'var(--text-secondary)' }}>
                            פעולה זו תמחק את כל הנתונים שלך לצמיתות, כולל היסטוריית התרגולים.
                            לא ניתן לשחזר את המידע לאחר מחיקה.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                ביטול
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteAccount}
                                disabled={loading}
                            >
                                {loading ? 'מוחק...' : 'מחק חשבון'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

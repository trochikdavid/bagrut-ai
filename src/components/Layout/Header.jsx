import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiSettings } from 'react-icons/fi'

export default function Header() {
    const { user } = useAuth()

    const getInitials = (name) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/dashboard" className="header-logo">
                    <div className="header-logo-icon">🎯</div>
                    <span className="header-logo-text">בגרות AI</span>
                </Link>

                <div className="header-user">
                    <div className="flex flex-col items-end">
                        <span className="header-user-name">{user?.name}</span>
                        {user?.isAdmin && (
                            <span style={{
                                fontSize: '0.65rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--primary-light)',
                                padding: '2px 6px',
                                borderRadius: '999px',
                                fontWeight: 600
                            }}>
                                מנהל מערכת
                            </span>
                        )}
                    </div>
                    <Link to="/profile" className="header-avatar" title="הגדרות פרופיל">
                        {getInitials(user?.name)}
                    </Link>
                </div>
            </div>
        </header>
    )
}

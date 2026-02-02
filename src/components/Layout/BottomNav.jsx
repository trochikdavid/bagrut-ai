import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiHome, FiMic, FiClock, FiUser, FiSettings } from 'react-icons/fi'

export default function BottomNav() {
    const { user } = useAuth()

    const navItems = [
        { to: '/dashboard', icon: FiHome, label: 'בית' },
        { to: '/practice', icon: FiMic, label: 'תרגול' },
        { to: '/history', icon: FiClock, label: 'היסטוריה' },
        { to: '/profile', icon: FiUser, label: 'פרופיל' }
    ]

    if (user?.isAdmin) {
        navItems.push({ to: '/admin', icon: FiSettings, label: 'ניהול' })
    }

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-content">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon className="bottom-nav-icon" />
                        <span className="bottom-nav-label">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}

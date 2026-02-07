import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiMic, FiClock, FiUser, FiSettings } from 'react-icons/fi'
import logo from '../../assets/logo.png'

export default function BottomNav() {
    const { user } = useAuth()

    const navItems = [
        { to: '/dashboard', label: 'בית', isLogo: true },
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
                {navItems.map(({ to, icon: Icon, label, isLogo }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''} ${isLogo ? 'nav-logo-item' : ''}`}
                    >
                        {isLogo ? (
                            <img src={logo} alt="Home" className="bottom-nav-logo-img" />
                        ) : (
                            <Icon className="bottom-nav-icon" />
                        )}
                        <span className="bottom-nav-label">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}

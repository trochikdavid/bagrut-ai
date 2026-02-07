import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi'
import './Auth.css'

import logo from '../../assets/logo.png'

export default function RegisterPage() {
    const { register } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [registrationSuccess, setRegistrationSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('הסיסמאות לא תואמות')
            return
        }

        if (password.length < 6) {
            setError('הסיסמה חייבת להכיל לפחות 6 תווים')
            return
        }

        setLoading(true)

        const result = await register(name, email, password)

        if (!result.success) {
            setError(result.error)
            setLoading(false)
        } else {
            // Show success message instead of redirecting
            setRegistrationSuccess(true)
            setLoading(false)
        }
    }

    // Success screen after registration
    if (registrationSuccess) {
        return (
            <div className="auth-page">
                <div className="auth-container animate-slide-up">
                    <div className="auth-header">
                        <div className="auth-logo success-icon">
                            <FiCheckCircle size={48} color="var(--success)" />
                        </div>
                        <h1 className="auth-title">איזה יופי, נרשמת! 🎉</h1>
                        <p className="auth-subtitle">
                            שלחנו מייל אימות לכתובת:
                        </p>
                        <p className="auth-email-highlight">{email}</p>
                    </div>

                    <div className="verification-notice">
                        <div className="notice-icon">📧</div>
                        <div className="notice-content">
                            <h3>יש לאמת את כתובת המייל</h3>
                            <p>
                                לחיצה על הלינק שבמייל תפעיל את החשבון.
                                <br />
                                אחרי האימות אפשר להתחבר ולהתחיל לתרגל!
                            </p>
                        </div>
                    </div>

                    <div className="verification-tips">
                        <p>לא מצאת את המייל?</p>
                        <ul>
                            <li>בדקו בתיקיית הספאם</li>
                            <li>האם הכתובת נכונה?</li>
                            <li>אפשר לחכות כמה דקות ולנסות שוב</li>
                        </ul>
                    </div>

                    <div className="auth-footer">
                        <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                            מעבר להתחברות
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <div className="auth-container animate-slide-up">
                <div className="auth-header">
                    <img src={logo} alt="SpeakIT" className="auth-logo-img" />
                    <p className="auth-subtitle">פתיחת חשבון חדש</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="auth-error animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">שם מלא</label>
                        <div className="input-with-icon">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="השם שלך"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">אימייל</label>
                        <div className="input-with-icon">
                            <FiMail className="input-icon" />
                            <input
                                type="email"
                                className="form-input"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">סיסמה</label>
                        <div className="input-with-icon">
                            <FiLock className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="לפחות 6 תווים"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                dir="ltr"
                            />
                            <button
                                type="button"
                                className="input-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">אימות סיסמה</label>
                        <div className="input-with-icon">
                            <FiLock className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="הזן שוב את הסיסמה"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner"></span>
                                יוצר חשבון...
                            </span>
                        ) : (
                            'הרשמה'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>כבר יש לך חשבון?</p>
                    <Link to="/login" className="auth-link">התחברות</Link>
                </div>
            </div>
        </div>
    )
}

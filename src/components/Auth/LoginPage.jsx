import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import './Auth.css'

import logo from '../../assets/logo.png'

export default function LoginPage() {
    const { login, user } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Auto-redirect if session exists (handles both login and email confirmation)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session || user) {
                navigate('/dashboard')
            }
        }
        checkSession()
    }, [user, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await login(email, password)

        if (!result.success) {
            setError(result.error)
            setLoading(false)
        }
        // No need to navigate here, the useEffect or PublicRoute will catch it
    }

    return (
        <div className="auth-page">
            <div className="auth-container animate-slide-up">
                <div className="auth-header">
                    <img src={logo} alt="SpeakIT" className="auth-logo-img" />
                    <p className="auth-subtitle">התחברות למערכת התרגול</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="auth-error animate-fade-in">
                            {error}
                        </div>
                    )}

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
                                placeholder="••••••••"
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

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner"></span>
                                מתחבר...
                            </span>
                        ) : (
                            'התחברות'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <div style={{ marginBottom: '1rem' }}>
                        <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.9rem' }}>שכחת סיסמה?</Link>
                    </div>
                    <p>אין לך חשבון?</p>
                    <Link to="/register" className="auth-link">הרשמה</Link>
                </div>


            </div>
        </div>
    )
}

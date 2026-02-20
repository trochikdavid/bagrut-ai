import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import './Auth.css'
import logo from '../../assets/logo.png'

export default function ResetPasswordPage() {
    const { updatePassword } = useAuth()
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (password !== confirmPassword) {
            return setError('הסיסמאות אינן תואמות')
        }

        if (password.length < 6) {
            return setError('הסיסמה חייבת להכיל לפחות 6 תווים')
        }

        setLoading(true)
        const result = await updatePassword(password)

        if (!result.success) {
            setError(result.error)
            setLoading(false)
        } else {
            setMessage('הסיסמה שונתה בהצלחה! מועבר להתחברות...')
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container animate-slide-up">
                <div className="auth-header">
                    <img src={logo} alt="SpeakIT" className="auth-logo-img" />
                    <p className="auth-subtitle">איפוס סיסמה</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error animate-fade-in">{error}</div>}
                    {message && <div className="auth-success animate-fade-in" style={{ backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{message}</div>}

                    <div className="form-group">
                        <label className="form-label">סיסמה חדשה</label>
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

                    <div className="form-group">
                        <label className="form-label">אימות סיסמה חדשה</label>
                        <div className="input-with-icon">
                            <FiLock className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="••••••••"
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
                        disabled={loading || !!message}
                    >
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner"></span>
                                מעדכן...
                            </span>
                        ) : (
                            'עדכן סיסמה'
                        )}
                    </button>
                </form>

            </div>
        </div>
    )
}

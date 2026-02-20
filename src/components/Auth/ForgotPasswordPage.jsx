import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiMail } from 'react-icons/fi'
import './Auth.css'
import logo from '../../assets/logo.png'

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setLoading(true)

        const result = await resetPassword(email)

        if (!result.success) {
            setError(result.error)
        } else {
            setMessage('אם קיים חשבון עם כתובת זו, נשלח אליך קישור לאיפוס סיסמה.')
        }
        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="auth-container animate-slide-up">
                <div className="auth-header">
                    <img src={logo} alt="SpeakIT" className="auth-logo-img" />
                    <p className="auth-subtitle">שחזור סיסמה</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error animate-fade-in">{error}</div>}
                    {message && <div className="auth-success animate-fade-in" style={{ backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{message}</div>}

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

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner"></span>
                                שולח...
                            </span>
                        ) : (
                            'שלח קישור לאיפוס'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <Link to="/login" className="auth-link">חזרה להתחברות</Link>
                </div>
            </div>
        </div>
    )
}

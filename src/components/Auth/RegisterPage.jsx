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
    const [agreeTerms, setAgreeTerms] = useState(false)
    const [agreePrivacy, setAgreePrivacy] = useState(false)
    const [isAdult, setIsAdult] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [registrationSuccess, setRegistrationSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!agreeTerms || !agreePrivacy || !isAdult) {
            setError('יש לאשר את כל התנאים כדי להירשם')
            return
        }

        if (password !== confirmPassword) {
            setError('הסיסמאות לא תואמות')
            return
        }

        if (password.length < 6) {
            setError('הסיסמה חייבת להכיל לפחות 6 תווים')
            return
        }

        setLoading(true)

        const agreementData = {
            termsAgreed: agreeTerms,
            termsVersion: '1.0',
            privacyAgreed: agreePrivacy,
            privacyVersion: '1.0',
            isAdult: isAdult
        }

        const result = await register(name, email, password, agreementData)

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
                <div className="auth-container success-state animate-slide-up">
                    <div className="auth-header text-center">
                        <div className="success-icon-wrapper">
                            <FiCheckCircle className="success-icon-bounce" />
                        </div>
                        <h1 className="auth-title">איזה יופי, נרשמת! 🎉</h1>
                        <p className="auth-subtitle">שלחנו עכשיו מכתב אימות לכתובת:</p>
                        <div className="auth-email-highlight">{email}</div>
                    </div>

                    <div className="verification-notice">
                        <div className="notice-icon-wrapper">
                            <FiMail className="notice-icon-svg" />
                        </div>
                        <div className="notice-content">
                            <h3>שלב אחרון לפני שמתחילים!</h3>
                            <p>
                                כדי להפעיל את החשבון, יש ללחוץ על הלינק שבמייל.
                                <br />
                                לאחר מכן, תועברו לבחירת מסלול התשלום שמתאים לכם ותוכלו להתחיל לתרגל מיד!
                            </p>
                        </div>
                    </div>

                    <div className="verification-tips border-top-subtle">
                        <h4>לא קיבלתם את המייל?</h4>
                        <ul>
                            <li>הציצו בתיקיית ה<strong>ספאם</strong> או ה<strong>קידומי מכירות</strong>.</li>
                            <li>וודאו שכתובת המייל שהזנתם נכונה לחלוטין.</li>
                            <li>לפעמים לוקח למייל כמה דקות להגיע, שווה להמתין.</li>
                        </ul>
                    </div>

                    <div className="auth-footer modern-footer">
                        <Link to="/login" className="btn btn-primary btn-lg full-width-btn">
                            הבנתי, למסך ההתחברות
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

                    <div className="auth-checkboxes">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="custom-checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                required
                            />
                            <span>קראתי ואני מסכים ל<Link to="/terms" target="_blank" className="auth-link-inline">תנאי השימוש</Link> של המערכת.</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="custom-checkbox"
                                checked={agreePrivacy}
                                onChange={(e) => setAgreePrivacy(e.target.checked)}
                                required
                            />
                            <span>אני מאשר את <Link to="/privacy" target="_blank" className="auth-link-inline">מדיניות הפרטיות</Link>, לרבות עיבוד ושמירת נתוני שמע (הקלטות).</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="custom-checkbox"
                                checked={isAdult}
                                onChange={(e) => setIsAdult(e.target.checked)}
                                required
                            />
                            <span>אני מצהיר כי אני בן 18 ומעלה.</span>
                        </label>
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

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaLock, FaCrown, FaCheck, FaCreditCard, FaArrowLeft } from 'react-icons/fa'
import './PaymentRequiredPage.css'

const PaymentRequiredPage = () => {
    const { user, logout, refreshProfile } = useAuth()
    const navigate = useNavigate()

    // Redirect if already premium
    useEffect(() => {
        if (user?.isPremium) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    // Meshulam Payment Link
    const BASE_PAYMENT_LINK = 'https://pay.grow.link/b85cbd024eb58e63c53f9e3d9af1c5bd-MzA4NDY4Mw'
    const paymentLink = BASE_PAYMENT_LINK

    // Poll for status update
    React.useEffect(() => {
        if (!user) return
        const interval = setInterval(async () => {
            await refreshProfile()
        }, 3000)
        return () => clearInterval(interval)
    }, [user, refreshProfile])

    return (
        <div className="payment-page-wrapper" dir="rtl">
            <div className="payment-content-container">

                <div className="payment-card-modern">
                    {/* Visual Header */}
                    <div className="payment-visual">
                        <div className="visual-icon-container">
                            <FaCrown className="visual-icon" />
                        </div>
                        <div className="visual-glow"></div>
                    </div>

                    <div className="payment-text-content">
                        <h1 className="modern-title">שדרוג לגרסת Pro</h1>
                        <p className="modern-subtitle">
                            היי {user?.name}, כדי להמשיך לתרגל ולהשתפר, עליך להפעיל את המנוי שלך.
                        </p>

                        <div className="features-preview">
                            <div className="feature-row">
                                <div className="check-icon"><FaCheck /></div>
                                <span>גישה מלאה לכל שאלוני הבגרות</span>
                            </div>
                            <div className="feature-row">
                                <div className="check-icon"><FaCheck /></div>
                                <span>סימולציות דיבור ללא הגבלה</span>
                            </div>
                            <div className="feature-row">
                                <div className="check-icon"><FaCheck /></div>
                                <span>משוב AI מתקדם וניתוח ביצועים</span>
                            </div>
                        </div>

                        <button
                            onClick={() => window.open(paymentLink, '_blank', 'noopener,noreferrer')}
                            className="btn-upgrade-modern"
                        >
                            <span>מעבר לתשלום מאובטח</span>
                            <FaCreditCard className="btn-icon-small" />
                        </button>

                        <p className="payment-note">
                            התשלום מאובטח ע״י Meshulam. חשבונית נשלחת למייל אוטומטית.
                        </p>
                    </div>

                    <div className="payment-footer-actions">
                        <button onClick={() => window.location.reload()} className="footer-link">
                            כבר שילמתי? רענן
                        </button>
                        <span className="divider">•</span>
                        <button onClick={logout} className="footer-link">
                            יציאה
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentRequiredPage

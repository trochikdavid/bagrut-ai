import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiMic, FiBarChart2, FiCpu, FiLogOut, FiRefreshCw, FiStar, FiX, FiInfo, FiShield } from 'react-icons/fi'
import { FaCrown } from 'react-icons/fa'
import './PaymentRequiredPage.css'

const PaymentRequiredPage = () => {
    const { user, logout, refreshProfile } = useAuth()
    const navigate = useNavigate()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [emailConfirmation, setEmailConfirmation] = useState(null)
    const [hasClickedRefresh, setHasClickedRefresh] = useState(false)

    useEffect(() => {
        if (user?.isPremium) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    const BASE_PAYMENT_LINK = 'https://pay.grow.link/b85cbd024eb58e63c53f9e3d9af1c5bd-MzA4NDY4Mw'
    const paymentLink = BASE_PAYMENT_LINK

    React.useEffect(() => {
        if (!user) return
        const interval = setInterval(async () => {
            await refreshProfile()
        }, 3000)
        return () => clearInterval(interval)
    }, [user, refreshProfile])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        setHasClickedRefresh(true)
        await refreshProfile()
        setTimeout(() => setIsRefreshing(false), 1500)
    }

    const openPaymentModal = () => {
        setShowModal(true)
        setEmailConfirmation(null)
    }

    const closePaymentModal = () => {
        setShowModal(false)
    }

    const proceedToPayment = () => {
        window.open(paymentLink, '_blank', 'noopener,noreferrer')
        closePaymentModal()
    }

    return (
        <div className="pay-page modern-theme" dir="rtl">
            {/* Animated background blobs */}
            <div className="pay-hero-bg-blobs">
                <div className="pay-blob pay-blob-1"></div>
                <div className="pay-blob pay-blob-2"></div>
            </div>

            <div className="pay-container">
                {/* Header Section */}
                <div className="pay-header">
                    <div className="pay-badge">
                        <span className="pay-pulsing-dot"></span>
                        חשבון נוצר בהצלחה
                    </div>
                    <h1 className="pay-title">
                        היי {user?.name?.split(' ')[0]} 👋<br />
                        <span className="pay-highlight-text">מוכנים להתחיל לתרגל?</span>
                    </h1>
                    <p className="pay-subtitle">
                        הפעילו את מנוי ה-Pro כדי לפתוח גישה מלאה לכל המודולים (A, B, C) ולסימולציות שמדמות את המבחן האמיתי. קבלו פידבק AI מתקדם ומיידי על כל תשובה, ותגיעו לבגרות שלכם בביטחון של 100%.
                    </p>
                </div>

                {/* Features Card */}
                <div className="pay-features-card">
                    <div className="pay-feature-item">
                        <div className="pay-feature-icon-wrapper blue">
                            <FiMic />
                        </div>
                        <div className="pay-feature-content">
                            <span className="pay-feature-title">תרגול ללא הגבלה</span>
                            <span className="pay-feature-desc">כל המודולים (A, B, C) וסימולציות בגרות מלאות.</span>
                        </div>
                    </div>

                    <div className="pay-divider"></div>

                    <div className="pay-feature-item">
                        <div className="pay-feature-icon-wrapper purple">
                            <FiCpu />
                        </div>
                        <div className="pay-feature-content">
                            <span className="pay-feature-title">פידבק AI מתקדם ומיידי</span>
                            <span className="pay-feature-desc">ניתוח מעמיק לכל תשובה — זמנים, דקדוק, הגייה ואוצר מילים.</span>
                        </div>
                    </div>

                    <div className="pay-divider"></div>

                    <div className="pay-feature-item">
                        <div className="pay-feature-icon-wrapper orange">
                            <FiBarChart2 />
                        </div>
                        <div className="pay-feature-content">
                            <span className="pay-feature-title">הכנה כמו בבחינה האמיתית</span>
                            <span className="pay-feature-desc">תזמון מדויק ומבנה שאלות זהה, כדי שתגיעו בביטחון מלא.</span>
                        </div>
                    </div>

                    {/* CTA inside card for better encapsulation */}
                    <div className="pay-cta-wrapper">
                        <button
                            onClick={openPaymentModal}
                            className="pay-btn-pill"
                        >
                            הפעלת מנוי Pro עכשיו
                            <FiStar style={{ fill: "currentColor" }} />
                        </button>
                        <div className="pay-secure-info">
                            <FiShield />
                            <span>תשלום מאובטח דרך משולם</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div className="pay-actions">
                        <button onClick={handleRefresh} className={`pay-action-btn pay-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}>
                            <FiRefreshCw className={isRefreshing ? 'spin' : ''} />
                            <span>{isRefreshing ? 'בודק...' : 'שילמתי, רענן'}</span>
                        </button>
                        <button onClick={logout} className="pay-action-btn">
                            <FiLogOut />
                            <span>התנתקות</span>
                        </button>
                    </div>
                    {hasClickedRefresh && (
                        <div style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', maxWidth: '300px', fontWeight: '500' }}>
                            קליטת התשלום במערכת לוקחת עד 5 דקות.
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Verification Modal */}
            {showModal && (
                <div className="pay-modal-overlay" onClick={closePaymentModal}>
                    <div className="pay-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="pay-modal-close" onClick={closePaymentModal}>
                            <FiX />
                        </button>

                        <div className="pay-modal-header">
                            <div className="pay-modal-icon">
                                <FiInfo />
                            </div>
                            <h2>רגע לפני שעוברים לתשלום...</h2>
                            <p>
                                שים לב, כדי שהמנוי יתעדכן בחשבונך באופן אוטומטי מיד לאחר התשלום, נבקשך להזין בקופת התשלום את <strong>כתובת הדואר האלקטרוני</strong> איתה נרשמת למערכת.
                            </p>
                        </div>

                        <div className="pay-modal-email-display">
                            <span className="pay-modal-email-label">הדואר האלקטרוני שלך במערכת הוא:</span>
                            <span className="pay-modal-email-value">{user?.email}</span>
                        </div>

                        <div className="pay-modal-image-instruction">
                            <span className="pay-modal-image-label">כאן לכתוב את האימייל במסך הבא:</span>
                            <img src="/images/payment-example.png" alt="דוגמה למיקום הזנת האימייל" className="pay-modal-example-image" />
                        </div>

                        <div className="pay-modal-footer">
                            <button
                                className="pay-btn-pill pay-modal-submit"
                                onClick={proceedToPayment}
                            >
                                הבנתי, מעבר לתשלום המאובטח
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PaymentRequiredPage

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiShield, FiCheckCircle, FiMic, FiBarChart2, FiCpu, FiLogOut, FiRefreshCw } from 'react-icons/fi'
import { FaCrown } from 'react-icons/fa'
import './PaymentRequiredPage.css'

const PaymentRequiredPage = () => {
    const { user, logout, refreshProfile } = useAuth()
    const navigate = useNavigate()
    const [isRefreshing, setIsRefreshing] = useState(false)

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
        await refreshProfile()
        setTimeout(() => setIsRefreshing(false), 1500)
    }

    return (
        <div className="pay-page" dir="rtl">
            {/* Animated background blobs */}
            <div className="pay-bg-blob pay-blob-1"></div>
            <div className="pay-bg-blob pay-blob-2"></div>
            <div className="pay-bg-blob pay-blob-3"></div>

            <div className="pay-container">
                {/* Top Crown Badge */}
                <div className="pay-crown-badge">
                    <FaCrown />
                    <span>Pro</span>
                </div>

                {/* Gradient-bordered Hero Card */}
                <div className="pay-hero-border">
                    <div className="pay-hero-card">
                        <h1 className="pay-hero-title">
                            היי {user?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="pay-hero-subtitle">
                            החשבון שלך נוצר בהצלחה!
                            <br />
                            הפעל את המנוי כדי לשחרר את כל הכלים.
                        </p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="pay-features-grid">
                    <div className="pay-feature-card">
                        <div className="pay-feature-icon bg-blue">
                            <FiMic />
                        </div>
                        <div className="pay-feature-text">
                            <span className="pay-feature-title">תרגול ללא הגבלה</span>
                            <span className="pay-feature-desc">Module A, B, C + סימולציה</span>
                        </div>
                    </div>

                    <div className="pay-feature-card">
                        <div className="pay-feature-icon bg-purple">
                            <FiCpu />
                        </div>
                        <div className="pay-feature-text">
                            <span className="pay-feature-title">משוב AI מתקדם</span>
                            <span className="pay-feature-desc">ניתוח מעמיק לכל תשובה</span>
                        </div>
                    </div>

                    <div className="pay-feature-card">
                        <div className="pay-feature-icon bg-orange">
                            <FiBarChart2 />
                        </div>
                        <div className="pay-feature-text">
                            <span className="pay-feature-title">מעקב התקדמות</span>
                            <span className="pay-feature-desc">סטטיסטיקות וגרפים אישיים</span>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="pay-cta-wrapper">
                    <button
                        onClick={() => window.open(paymentLink, '_blank', 'noopener,noreferrer')}
                        className="pay-cta-btn"
                    >
                        <span>הפעלת מנוי Pro</span>
                        <FiShield className="pay-cta-icon" />
                    </button>
                    <div className="pay-secure-row">
                        <FiShield className="pay-secure-icon" />
                        <span>תשלום מאובטח דרך Meshulam</span>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="pay-actions">
                    <button onClick={handleRefresh} className={`pay-action-btn pay-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}>
                        <FiRefreshCw className={isRefreshing ? 'spin' : ''} />
                        <span>{isRefreshing ? 'בודק...' : 'כבר שילמתי? רענן'}</span>
                    </button>
                    <button onClick={logout} className="pay-action-btn pay-logout-btn">
                        <FiLogOut />
                        <span>יציאה</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PaymentRequiredPage

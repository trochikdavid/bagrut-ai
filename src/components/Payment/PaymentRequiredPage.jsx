import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase as supabaseBrowser } from '../../lib/supabase'
import { FaLock, FaCrown, FaCheck, FaCreditCard } from 'react-icons/fa'
import './PaymentRequiredPage.css'

const PaymentRequiredPage = () => {
    const { user, logout, refreshProfile } = useAuth()

    // Meshulam Payment Link
    // Using user-provided Grow.link URL
    const BASE_PAYMENT_LINK = 'https://pay.grow.link/b85cbd024eb58e63c53f9e3d9af1c5bd-MzA4NDY4Mw'

    // Construct the link with User ID
    // Base link has no query params, so we start with '?'
    const paymentLink = user?.id
        ? `${BASE_PAYMENT_LINK}?user_id=${user.id}&userId=${user.id}&cField1=${user.id}`
        : '#'

    // Poll for status update (in case webhook updates DB while user is here)
    React.useEffect(() => {
        if (!user) return

        const interval = setInterval(async () => {
            await refreshProfile()
        }, 3000)

        return () => clearInterval(interval)
    }, [user, refreshProfile])

    return (
        <div className="payment-page-container" dir="rtl">

            <div className="card payment-card">
                {/* Header */}
                <div className="payment-header">
                    <div className="payment-header-bg-accent"></div>
                    <div className="relative z-10">
                        <div className="icon-wrapper">
                            <FaLock className="text-white text-2xl" />
                        </div>
                        <h1 className="payment-title">המנוי לא פעיל</h1>
                        <p className="payment-subtitle">
                            החשבון של <strong>{user?.name}</strong> נוצר בהצלחה, אך נדרש מנוי כדי להמשיך.
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="payment-body">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">רכוש מנוי וקבל גישה מיידית</h2>
                        <p className="text-secondary text-sm">
                            שחרר את הפוטנציאל שלך עם גישה מלאה לכל כלי התרגול של Speakit.
                        </p>
                    </div>

                    {/* Features List */}
                    <ul className="features-list">
                        <li className="feature-item">
                            <div className="feature-icon icon-green">
                                <FaCheck />
                            </div>
                            <span className="text-sm font-medium">גישה לכל שאלוני הבגרות (A, B, C, E, G)</span>
                        </li>
                        <li className="feature-item">
                            <div className="feature-icon icon-blue">
                                <FaCrown />
                            </div>
                            <span className="text-sm font-medium">סימולציות ללא הגבלה עם משוב AI</span>
                        </li>
                        <li className="feature-item">
                            <div className="feature-icon icon-purple">
                                <FaCheck />
                            </div>
                            <span className="text-sm font-medium">סטטיסטיקות ומעקב שיפור אישי</span>
                        </li>
                    </ul>

                    {/* CTA Button - Using btn-primary from system */}
                    {/* CTA Button - Using btn-primary from system */}
                    <button
                        onClick={async () => {
                            try {
                                // Log payment attempt
                                await supabaseBrowser.from('payment_attempts').insert({
                                    user_id: user.id
                                })
                            } catch (e) {
                                console.error('Failed to log payment attempt', e)
                            }
                            // Redirect to payment
                            window.open(paymentLink, '_blank', 'noopener,noreferrer')
                        }}
                        className="btn btn-primary payment-button shadow-lg w-full flex justify-center items-center gap-2"
                    >
                        <span>מעבר לתשלום מאובטח</span>
                        <FaCreditCard />
                    </button>

                    <p className="secure-note">
                        התשלום מאובטח באמצעות משולם (Meshulam)
                    </p>

                    {/* Actions */}
                    <div className="payment-actions">
                        <button
                            onClick={logout}
                            className="action-link text-muted hover:text-primary"
                        >
                            התנתק
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="action-link text-primary font-medium"
                        >
                            כבר שילמתי? רענן
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentRequiredPage

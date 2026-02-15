import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { FaLock, FaCrown, FaCheck, FaCreditCard } from 'react-icons/fa'
import './PaymentRequiredPage.css'

const PaymentRequiredPage = () => {
    const { user, logout } = useAuth()

    // Meshulam Payment Link
    // We pass the user_id in BOTH description and cField1 to be safe and robust for the webhook.
    const BASE_PAYMENT_LINK = 'https://meshulam.co.il/purchase?b=e07797899808369527500171a4781440'

    // Construct the link with User ID
    const paymentLink = user?.id
        ? `${BASE_PAYMENT_LINK}&cField1=${user.id}&description=${user.id}`
        : '#'

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
                    <a
                        href={paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary payment-button shadow-lg"
                    >
                        <span>מעבר לתשלום מאובטח</span>
                        <FaCreditCard />
                    </a>

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

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa'
import './PaymentSuccessPage.css'

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { updateProfile } = useAuth()

    // Status: 'loading', 'success', 'error'
    const [status, setStatus] = useState('loading')
    const [message, setMessage] = useState('מאמת את התשלום...')

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Extract params from URL
                // Meshulam redirects with params like ?processId=...&processToken=...&cField1=...
                const processId = searchParams.get('processId')
                const processToken = searchParams.get('processToken')
                const cField1 = searchParams.get('cField1')

                // If we have cField1 (userId), we can be optimistic
                // But for security, we should ideally verify with backend
                // For now, let's call our webhook function as an API endpoint to update the user

                if (!cField1) {
                    throw new Error('חסרים פרטי זיהוי בתשובה (cField1)')
                }

                console.log('Verifying payment for user:', cField1)

                // Call our Edge Function to secure the update
                // We use the same function but send a specific payload
                const { data, error } = await supabase.functions.invoke('handle-payment-webhook', {
                    body: {
                        verification_mode: true, // Custom flag to tell function it's a client check
                        userId: cField1,
                        processId,
                        processToken
                    }
                })

                if (error) {
                    console.error('Edge function error:', error)
                    throw error
                }

                // Success!
                setStatus('success')
                setMessage('התשלום עבר בהצלחה! החשבון שלך שודרג.')

                // Update local auth context immediately
                await updateProfile({ isPremium: true })

                // Redirect to dashboard after a delay
                setTimeout(() => {
                    navigate('/dashboard')
                }, 3000)

            } catch (err) {
                console.error('Payment verification failed:', err)
                setStatus('error')
                setMessage('הייתה בעיה באימות התשלום. אנא צור קשר עם התמיכה אם חויבת.')
            }
        }

        verifyPayment()
    }, [searchParams, navigate, updateProfile])

    return (
        <div className="success-page-container" dir="rtl">
            <div className="success-card">

                {status === 'loading' && (
                    <>
                        <div className="loading-spinner-large"></div>
                        <h2 className="success-title">מעבד תשלום...</h2>
                        <p className="success-message">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="success-icon-wrapper">
                            <FaCheck />
                        </div>
                        <h2 className="success-title">תודה רבה!</h2>
                        <p className="success-message">{message}</p>
                        <p className="text-sm text-muted">מעביר אותך לאזור האישי...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="success-icon-wrapper error-icon-wrapper">
                            <FaTimes />
                        </div>
                        <h2 className="success-title">שגיאה</h2>
                        <p className="success-message">{message}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn btn-primary mt-4"
                        >
                            חזור לדף הבית
                        </button>
                    </>
                )}

            </div>
        </div>
    )
}

export default PaymentSuccessPage

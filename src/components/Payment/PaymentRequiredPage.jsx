import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { FaLock, FaCrown, FaCheck, FaCreditCard } from 'react-icons/fa'

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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir="rtl">

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-primary p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-600 opacity-20 transform -skew-y-6 origin-top-left"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                            <FaLock className="text-white text-2xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">המנוי לא פעיל</h1>
                        <p className="text-blue-100 text-sm">
                            החשבון של <strong>{user?.name}</strong> נוצר בהצלחה, אך נדרש מנוי כדי להמשיך.
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">רכוש מנוי וקבל גישה מיידית</h2>
                        <p className="text-gray-500 text-sm">
                            שחרר את הפוטנציאל שלך עם גישה מלאה לכל כלי התרגול של Speakit.
                        </p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 ml-3 flex-shrink-0">
                                <FaCheck size={14} />
                            </div>
                            <span className="text-sm font-medium">גישה לכל שאלוני הבגרות (A, B, C, E, G)</span>
                        </li>
                        <li className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 ml-3 flex-shrink-0">
                                <FaCrown size={14} />
                            </div>
                            <span className="text-sm font-medium">סימולציות ללא הגבלה עם משוב AI</span>
                        </li>
                        <li className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 ml-3 flex-shrink-0">
                                <FaCheck size={14} />
                            </div>
                            <span className="text-sm font-medium">סטטיסטיקות ומעקב שיפור אישי</span>
                        </li>
                    </ul>

                    {/* CTA Button */}
                    <a
                        href={paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
                    >
                        <span>מעבר לתשלום מאובטח</span>
                        <FaCreditCard />
                    </a>

                    <p className="text-xs text-center text-gray-400 mt-4">
                        התשלום מאובטח באמצעות משולם (Meshulam)
                    </p>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-100">
                        <button
                            onClick={logout}
                            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            התנתק
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-sm text-primary font-medium hover:text-primary-hover transition-colors"
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

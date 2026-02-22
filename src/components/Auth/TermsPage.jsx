import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiFileText } from 'react-icons/fi'
import './DocumentPage.css'

export default function TermsPage() {
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="document-page">
            <div className="document-container">
                <div className="document-header">
                    <Link to="/register" className="back-link">
                        <FiArrowRight /> חזרה להרשמה
                    </Link>
                    <h1><FiFileText className="header-icon" /> תנאי שימוש</h1>
                </div>

                <div className="document-content">
                    <iframe
                        src="/docs/terms.pdf"
                        title="תנאי שימוש"
                        width="100%"
                        height="600px"
                        className="pdf-viewer"
                    >
                        <p>הדפדפן שלך אינו תומך בהצגת מסמכי PDF. <a href="/docs/terms.pdf" download>לחץ כאן להורדת המסמך</a>.</p>
                    </iframe>
                </div>
            </div>
        </div>
    )
}

import { useState } from 'react';
import { FiMessageCircle, FiX, FiMail } from 'react-icons/fi';
import './SupportButton.css';

export default function SupportButton() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className="support-button-container">
            {isOpen && (
                <div className="support-popover animate-fade-in-up">

                    <div className="support-content">
                        <h4>צריכים עזרה?</h4>
                        <p>נתקלתם בבעיה? אנחנו כאן כדי לעזור! צרו איתנו קשר ונענה בהקדם.</p>
                        <a
                            href="mailto:team@speakit-app.com"
                            className="btn btn-primary support-contact-btn"
                        >
                            <FiMail className="contact-icon" />
                            <span>team@speakit-app.com</span>
                        </a>
                    </div>
                </div>
            )}

            <button
                className={`support-fab ${isOpen ? 'open' : ''}`}
                onClick={toggleOpen}
                aria-label="Support"
            >
                {isOpen ? <FiX /> : <FiMessageCircle />}
            </button>
        </div>
    );
}

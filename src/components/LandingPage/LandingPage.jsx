import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMicrophone, FaChartLine, FaUserGraduate, FaChevronDown, FaCheckCircle, FaStar, FaArrowLeft } from 'react-icons/fa';
import { FiMic, FiBarChart2, FiShield, FiCheck, FiArrowLeft } from 'react-icons/fi';
import './LandingPage.css';

const LandingPage = () => {
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const features = [
        {
            icon: <FiMic />,
            title: "סימולציה מדויקת",
            description: "תרגול שמדמה את מבחן הבגרות האמיתי באנגלית, כולל זמנים ושאלות אותנטיות.",
            color: '#6366F1'
        },
        {
            icon: <FiBarChart2 />,
            title: "פידבק בזמן אמת",
            description: "קבלו משוב מיידי על כל תשובה, כולל דיוק לשוני, אוצר מילים ושטף דיבור.",
            color: '#0EA5E9'
        },
        {
            icon: <FiShield />,
            title: "שיפור הביטחון",
            description: "תרגלו שוב ושוב בסביבה בטוחה עד שתגיעו למבחן מוכנים ורגועים.",
            color: '#10B981'
        }
    ];

    const steps = [
        {
            number: "01",
            title: "בוחרים שאלון",
            description: "בוחרים את המודול שרוצים לתרגל (A, B, C) או סימולציה מלאה"
        },
        {
            number: "02",
            title: "מתרגלים ומדברים",
            description: "עונים על שאלות מול הבוחן הווירטואלי בזמן אמת, בדיוק כמו במבחן"
        },
        {
            number: "03",
            title: "מקבלים ציון ופידבק",
            description: "רואים ניתוח מפורט, נקודות חזקות ונקודות לשיפור"
        }
    ];

    const faqs = [
        {
            question: "האם הסימולציה מתאימה לכל השאלונים?",
            answer: "כן, המערכת תומכת בכל שאלוני הבגרות באנגלית (Module A, B, C) ומותאמת למבנה הבחינה העדכני."
        },
        {
            question: "כמה עולה להשתמש במערכת?",
            answer: "הגישה למערכת היא במחיר של שיעור פרטי בודד, ונותנת לך תרגול ללא הגבלה."
        },
        {
            question: "האם אני צריך מיקרופון מיוחד?",
            answer: "לא, ניתן להשתמש במיקרופון המובנה של המחשב או הטלפון, או באוזניות סטנדרטיות."
        },
        {
            question: "האם המערכת עובדת גם בטלפון?",
            answer: "כן! אפשר לתרגל מכל מקום ובכל זמן, גם מהמחשב וגם מהנייד."
        }
    ];

    return (
        <div className="landing-page">
            {/* Header/Nav */}
            <header className="landing-header">
                <div className="landing-header-inner">
                    <div className="landing-logo">
                        <FaMicrophone className="landing-logo-icon" /> Speakit
                    </div>
                    <nav className="landing-nav">
                        <a href="#features">יתרונות</a>
                        <a href="#how-it-works">איך זה עובד</a>
                        <a href="#faq">שאלות ותשובות</a>
                    </nav>
                    <Link to="/login" className="landing-header-cta">
                        התחברות / הרשמה
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-shapes">
                    <div className="hero-shape hero-shape-1"></div>
                    <div className="hero-shape hero-shape-2"></div>
                    <div className="hero-shape hero-shape-3"></div>
                </div>
                <div className="hero-content">
                    <div className="hero-badge">
                        <FiMic /> הפלטפורמה #1 בישראל לתרגול בגרות באנגלית
                    </div>
                    <h1 className="hero-title">
                        <span className="hero-title-en">Practice before you speak it</span>
                        <span className="hero-title-he">תרגול אינסופי בסימולציה המדויקת ביותר לבגרות</span>
                    </h1>
                    <p className="hero-subtitle">
                        דברו, קבלו פידבק מיידי ושפרו את הביטחון שלכם – והכל במחיר של שיעור פרטי אחד.
                    </p>
                    <div className="hero-cta-group">
                        <Link to="/register" className="hero-btn-primary">
                            התחילו לתרגל עכשיו
                            <FiArrowLeft />
                        </Link>
                        <Link to="/login" className="hero-btn-secondary">
                            יש לי כבר חשבון
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-value">3</span>
                            <span className="hero-stat-label">מודולים</span>
                        </div>
                        <div className="hero-stat-divider"></div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">AI</span>
                            <span className="hero-stat-label">ניתוח חכם</span>
                        </div>
                        <div className="hero-stat-divider"></div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">∞</span>
                            <span className="hero-stat-label">תרגולים</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-container">
                    <h2 className="section-title">למה לבחור ב-Speakit?</h2>
                    <p className="section-subtitle">הכלים שיעזרו לכם להצליח בבגרות באנגלית</p>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card" style={{ '--feature-color': feature.color }}>
                                <div className="feature-icon-wrapper">
                                    {feature.icon}
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-section">
                <div className="section-container">
                    <h2 className="section-title">איך זה עובד?</h2>
                    <p className="section-subtitle">שלושה צעדים פשוטים להצלחה</p>
                    <div className="steps-grid">
                        {steps.map((step, index) => (
                            <div key={index} className="step-card">
                                <div className="step-number-circle">{step.number}</div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-desc">{step.description}</p>
                                {index < steps.length - 1 && <div className="step-connector"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="social-proof-section">
                <div className="section-container">
                    <div className="social-proof-card">
                        <div className="social-proof-stars">
                            <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                        </div>
                        <blockquote className="social-proof-quote">
                            "הביטחון שלי השתפר פלאים. הגעתי למבחן הבגרות מוכן לחלוטין"
                        </blockquote>
                        <p className="social-proof-join">
                            הצטרפו לתלמידים שכבר מתרגלים ומשפרים את האנגלית שלהם
                        </p>
                        <div className="social-proof-badges">
                            <div className="proof-badge">
                                <FiCheck />
                                <span>סימולציה אמיתית</span>
                            </div>
                            <div className="proof-badge">
                                <FiCheck />
                                <span>ניתוח AI</span>
                            </div>
                            <div className="proof-badge">
                                <FiCheck />
                                <span>תמיכה בנייד</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="faq-section">
                <div className="section-container">
                    <h2 className="section-title">שאלות נפוצות</h2>
                    <div className="faq-container">
                        {faqs.map((faq, index) => (
                            <div key={index} className={`faq-item ${openFaq === index ? 'faq-open' : ''}`}>
                                <button
                                    className="faq-question"
                                    onClick={() => toggleFaq(index)}
                                >
                                    <span>{faq.question}</span>
                                    <FaChevronDown className="faq-chevron" />
                                </button>
                                <div className="faq-answer-wrapper">
                                    <div className="faq-answer">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="final-cta-section">
                <div className="section-container">
                    <h2 className="final-cta-title">מוכנים להתחיל?</h2>
                    <p className="final-cta-subtitle">הצטרפו עכשיו ותתחילו לתרגל בשניות</p>
                    <Link to="/register" className="hero-btn-primary">
                        התחילו לתרגל עכשיו
                        <FiArrowLeft />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <FaMicrophone /> <span>Speakit</span>
                    </div>
                    <p className="footer-copyright">© {new Date().getFullYear()} Speakit. כל הזכויות שמורות.</p>
                    <div className="footer-links">
                        <Link to="/login">כניסה</Link>
                        <Link to="/register">הרשמה</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

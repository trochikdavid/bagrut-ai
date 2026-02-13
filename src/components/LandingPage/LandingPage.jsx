import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMicrophone, FaChartLine, FaUserGraduate, FaChevronDown, FaCheckCircle, FaStar } from 'react-icons/fa';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const features = [
        {
            icon: <FaMicrophone />,
            title: "סימולציה מדויקת",
            description: "תרגול שמדמה את מבחן הבגרות האמיתי באנגלית, כולל זמנים ושאלות אותנטיות."
        },
        {
            icon: <FaChartLine />,
            title: "פידבק בזמן אמת",
            description: "קבלו משוב מיידי על כל תשובה, כולל דיוק לשוני, אוצר מילים ושטף דיבור."
        },
        {
            icon: <FaUserGraduate />,
            title: "שיפור הביטחון",
            description: "תרגלו שוב ושוב בסביבה בטוחה עד שתגיעו למבחן מוכנים ורגועים."
        }
    ];

    const faqs = [
        {
            question: "האם הסימולציה מתאימה לכל השאלונים?",
            answer: "כן, המערכת תומכת בכל שאלוני הבגרות באנגלית (Module A, B, C, E, G) ומותאמת למבנה הבחינה העדכני."
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
            <header className="flex justify-between items-center p-4 max-w-6xl mx-auto">
                <div className="text-2xl font-bold text-primary flex items-center gap-2">
                    <FaMicrophone /> Speakit
                </div>
                <nav className="hidden md:flex gap-6">
                    <a href="#features" className="text-secondary hover:text-primary transition-colors">יתרונות</a>
                    <a href="#how-it-works" className="text-secondary hover:text-primary transition-colors">איך זה עובד</a>
                    <a href="#faq" className="text-secondary hover:text-primary transition-colors">שאלות ותשובות</a>
                </nav>
                <Link to="/login" className="btn btn-primary">
                    התחברות / הרשמה
                </Link>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title animate-fade-in">
                        Speakit - Practice before you speak it
                        <br />
                        <span className="text-primary text-4xl block mt-4">תרגול אינסופי בסימולציה המדויקת ביותר לבגרות</span>
                    </h1>
                    <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        דברו, קבלו פידבק מיידי ושפרו את הביטחון שלכם – והכל במחיר של שיעור פרטי אחד.
                        הפלטפורמה הראשונה בישראל שמדמה את הבגרות בעל פה באנגלית.
                    </p>
                    <div className="hero-cta-group animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            התחילו לתרגל עכשיו
                        </Link>
                        <Link to="/login" className="btn btn-outline btn-lg">
                            יש לי כבר חשבון
                        </Link>
                    </div>
                </div>
                {/* Abstract shape or image placeholder could go here */}
                {/* <div className="hero-image-container"> ... </div> */}
            </section>

            {/* Value Proposition Strip */}
            <div className="bg-white py-12 border-y border-gray-100">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-6">כל ההכנה לבגרות במקום אחד</h2>
                    <p className="text-gray-600 text-lg">
                        מתרגלים בסימולציה שמרגישה בדיוק כמו המבחן האמיתי, מקבלים תיקונים בזמן אמת, משפרים ומתרגלים ללא הגבלה כדי להגיע לבחינה הכי מוכנים שיש.
                    </p>
                </div>
            </div>

            {/* Features Section */}
            <section id="features" className="features-section">
                <h2 className="section-title">למה לבחור ב-Speakit?</h2>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="feature-icon-wrapper">
                                {feature.icon}
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="text-secondary">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works (Simplified) */}
            <section id="how-it-works" className="how-it-works-section">
                <h2 className="section-title">איך זה עובד?</h2>
                <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                        <h3 className="font-bold text-lg mb-2">בוחרים שאלון</h3>
                        <p className="text-gray-600">בוחרים את המודול שרוצים לתרגל (A, B, C...)</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                        <h3 className="font-bold text-lg mb-2">מתרגלים מדברים</h3>
                        <p className="text-gray-600">עונים על שאלות מול הבוחן הווירטואלי בזמן אמת</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                        <h3 className="font-bold text-lg mb-2">מקבלים ציון</h3>
                        <p className="text-gray-600">רואים איפה טעינו ומשתפרים לפעם הבאה</p>
                    </div>
                </div>
            </section>

            {/* Testimonials / Social Proof (Optional placeholder) */}
            <section className="py-16 bg-white text-center">
                <div className="container">
                    <div className="flex justify-center mb-4 text-yellow-400 gap-1 text-2xl">
                        <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">"הביטחון שלי השתפר פלאים"</h3>
                    <p className="text-gray-600">הצטרפו לתלמידים שכבר מתרגלים ומשפרים את האנגלית שלהם.</p>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="faq-section">
                <h2 className="section-title">שאלות נפוצות</h2>
                <div className="faq-container">
                    {faqs.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <div
                                className="faq-question"
                                onClick={() => toggleFaq(index)}
                            >
                                {faq.question}
                                <FaChevronDown
                                    style={{
                                        transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0)',
                                        transition: 'transform 0.3s'
                                    }}
                                />
                            </div>
                            {openFaq === index && (
                                <div className="faq-answer">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="flex items-center gap-2 mb-4">
                        <FaMicrophone /> <span className="font-bold text-lg">Speakit</span>
                    </div>
                    <p className="text-sm">© {new Date().getFullYear()} Speakit. כל הזכויות שמורות.</p>
                    <div className="flex gap-4 mt-4 text-sm">
                        <Link to="/login" className="hover:text-white">כניסה</Link>
                        <Link to="/register" className="hover:text-white">הרשמה</Link>
                        <a href="#" className="hover:text-white">תנאי שימוש</a>
                        <a href="#" className="hover:text-white">מדיניות פרטיות</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMicrophone, FaChevronDown, FaStar, FaChevronLeft, FaChevronRight, FaBars, FaTimes } from 'react-icons/fa';
import { FiMic, FiBarChart2, FiRefreshCw, FiMonitor, FiSmartphone, FiTablet, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './LandingPage.css';
import logoImg from '../../assets/logo.png';

const LandingPage = () => {
    const [openFaq, setOpenFaq] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [activeSlide, setActiveSlide] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const features = [
        {
            icon: <FiMic />,
            title: "סימולציה שמדמה את המבחן האמיתי",
            description: "תתרגלו בדיוק כמו ביום הבחינה — שאלות בפורמט האמיתי, תזמון מדויק ומבנה זהה למבחן. ככה כשתיכנסו לכיתה, שום דבר לא יפתיע אתכם.",
            slides: [
                { img: "/images/module-selection.png", caption: "מסך בחירת מודול — בחרו את המודול שתרצו לתרגל" },
                { img: "/images/simulation-question.png", caption: "שאלת סימולציה — ענו בדיוק כמו בבחינה האמיתית" },
                { img: "/images/feedback-recommendations.png", caption: "דף תוצאות — צפו בציון ובניתוח מפורט" }
            ]
        },
        {
            icon: <FiBarChart2 />,
            title: "פידבק מיידי על כל תשובה",
            description: "אחרי כל תרגול תקבלו ניתוח מפורט של: פיתוח נושא, אוצר מילים, שימוש בזמנים, דקדוק והגייה. תדעו בדיוק על מה לעבוד.",
            slides: [
                { img: "/images/feedback-recommendations.png", caption: "המלצות אישיות — טיפים ממוקדים לשיפור" },
                { img: "/images/score-analysis.png", caption: "ניתוח תשובה — ציון לכל פרמטר בנפרד" },
                { img: "/images/score-details.png", caption: "ניתוח תשובה — ציון לכל פרמטר בנפרד" }
            ]
        },
        {
            icon: <FiRefreshCw />,
            title: "תרגול ללא הגבלה — עד שמרגישים מוכנים",
            description: "אין מגבלה על מספר התרגולים. תתרגלו שוב ושוב, בכל שעה ומכל מקום, עד שתרגישו שאתם באמת שולטים בחומר.",
            slides: [
                { img: "/images/progress-chart.png", caption: "היסטוריית תרגולים — עקבו אחרי ההתקדמות שלכם" }
            ]
        }
    ];

    const faqs = [
        {
            question: "מה בדיוק אני מקבל במערכת?",
            answer: "גישה מלאה לסימולציות בגרות בעל פה באנגלית — כולל Module A, B ו-C. כל סימולציה כוללת שאלות אותנטיות, תזמון אמיתי, ופידבק מיידי עם ניתוח מפורט של הדיבור שלכם."
        },
        {
            question: "כמה סימולציות אפשר לעשות?",
            answer: "ללא הגבלה! אחרי הרשמה תוכלו לתרגל כמה שתרצו, 24/7, עד שתרגישו שאתם באמת מוכנים למבחן."
        },
        {
            question: "האם הסימולציה באמת דומה למבחן האמיתי?",
            answer: "כן, הסימולציות שלנו בנויות בדיוק לפי מבנה הבחינה של משרד החינוך — כולל סוגי שאלות, זמני תשובה ורמת קושי. תלמידים מדווחים שהגיעו למבחן ולא הופתעו."
        },
        {
            question: "כמה עולה להשתמש במערכת?",
            answer: "הגישה למערכת היא במחיר של שיעור פרטי בודד, אבל נותנת לכם תרגול ללא הגבלה למשך שנה שלמה. השקעה חד-פעמית שמחליפה עשרות שיעורים."
        },
        {
            question: "האם אני צריך ציוד מיוחד?",
            answer: "לא, מספיק המיקרופון המובנה במחשב או בטלפון. אפשר גם להשתמש באוזניות רגילות. לא צריך שום ציוד מיוחד."
        },
        {
            question: "האם המערכת עובדת גם מהטלפון?",
            answer: "בהחלט! המערכת מותאמת לכל מכשיר — מחשב, טאבלט וטלפון. תוכלו לתרגל בדרך לבית ספר, בהפסקה, או מהבית."
        },
        {
            question: "מתאים גם למי שמרגיש חלש באנגלית?",
            answer: "בהחלט. דווקא תלמידים שמרגישים פחות בטוחים נהנים הכי הרבה מהמערכת — הם מתרגלים בסביבה בטוחה, בלי לחץ, ומגלים שהביטחון עולה מהר כשמתרגלים מספיק."
        },
        {
            question: "מה עדיף — לתרגל מודולים בודדים או סימולציה מלאה?",
            answer: "מומלץ להתחיל מתרגול של מודולים בודדים (A, B, C) כדי לחזק כל חלק בנפרד. ברגע שאתם מרגישים בטוחים, עברו לסימולציה המלאה שמדמה את כל הבחינה ברצף — בדיוק כמו ביום האמיתי."
        }
    ];

    // Reviews carousel scroll
    const reviewsTrackRef = useRef(null);

    // Center the reviews carousel on mount
    useEffect(() => {
        const track = reviewsTrackRef.current;
        if (track) {
            // Wait for cards to render, then center
            setTimeout(() => {
                // In RTL, scrollLeft is negative. Center = half the overflow distance, negated
                const maxScroll = track.scrollWidth - track.clientWidth;
                track.scrollLeft = -(maxScroll / 2);
            }, 300);
        }
    }, []);

    const scrollReviews = (direction) => {
        const track = reviewsTrackRef.current;
        if (track) {
            const scrollAmount = 360;
            track.scrollBy({ left: direction === 'right' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    // Feature slides navigation
    const nextSlide = () => {
        const maxSlides = features[activeTab].slides.length;
        setActiveSlide(prev => (prev + 1) % maxSlides);
    };
    const prevSlide = () => {
        const maxSlides = features[activeTab].slides.length;
        setActiveSlide(prev => (prev - 1 + maxSlides) % maxSlides);
    };

    // Reset slide when tab changes
    const handleTabChange = (index) => {
        setActiveTab(index);
        setActiveSlide(0);
    };

    return (
        <div className="landing-page modern-theme">
            {/* Header/Nav */}
            <header className="landing-header">
                <div className="landing-header-inner" style={{ maxWidth: '100%', paddingRight: '1rem', paddingLeft: '1rem' }}>
                    <div className="landing-logo" style={{ marginRight: '0' }}>
                        <img src={logoImg} alt="Speakit Logo" className="landing-logo-img" />
                    </div>
                    <nav className={`landing-nav ${isMobileMenuOpen ? 'open' : ''}`} style={{ marginLeft: 'auto', marginRight: '2rem' }}>
                        <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>היתרונות שלנו</a>
                        <a href="#reviews" onClick={() => setIsMobileMenuOpen(false)}>ביקורות</a>
                        <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>שאלות נפוצות</a>
                    </nav>
                    <div className="header-actions">
                        <Link to="/login" className="nav-login-link">התחברות</Link>
                        <button onClick={() => navigate('/register')} className="header-cta-pill">
                            התחילו לתרגל
                        </button>
                        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-blobs">
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                </div>
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="pulsing-dot"></span>
                            הפלטפורמה #1 בארץ להכנה לבגרות בעל פה באנגלית
                        </div>
                        <h1 className="hero-title">
                            <span className="hero-title-en">Practice before you <span className="hero-title-accent">speak it</span></span>
                            <span className="highlight-text">להגיע לבגרות בעל פה בביטחון מלא.</span>
                        </h1>
                        <p className="hero-subtitle">
                            המערכת שמכינה אתכם לבגרות בעל פה באנגלית — סימולציות אמיתיות, פידבק מיידי, ותחושת ביטחון שאי אפשר לקבל משום מקום אחר.
                        </p>
                        <div className="hero-cta-group">
                            <button onClick={() => navigate('/register')} className="btn-pill-primary">
                                התחילו לתרגל עכשיו
                            </button>
                            <a href="#features" className="btn-pill-secondary">
                                למה תלמידים בוחרים בנו?
                            </a>
                        </div>
                    </div>

                    {/* Hero App Mockup Placeholder */}
                    <div className="hero-mockup-container">
                        <div className="mockup-placeholder main-dashboard-mockup">
                            <div className="mockup-header">
                                <div className="mockup-dots"><span></span><span></span><span></span></div>
                            </div>
                            <div className="mockup-body">
                                <img src="/images/dashboard-mockup.png" alt="Speakit Dashboard" className="hero-dashboard-img" />
                            </div>
                        </div>
                        {/* Mobile Phone Mockup Overlay */}
                        <img src="/images/mobile-mockup.png" alt="Speakit Mobile App" className="hero-mobile-mockup-img" />
                    </div>
                </div>
            </section>

            {/* Reviews Carousel */}
            <section id="reviews" className="reviews-section">
                <div className="reviews-container">
                    <h2 className="reviews-title">מה התלמידים שלנו אומרים</h2>
                    <div className="reviews-carousel-wrapper">
                        <button className="reviews-arrow reviews-arrow-right" onClick={() => scrollReviews('right')} aria-label="הקודם">
                            <FaChevronRight />
                        </button>
                        <div className="reviews-track" ref={reviewsTrackRef}>
                            <div className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-avatar">נ</div>
                                    <div className="reviewer-info">
                                        <h4>נועה כ.</h4>
                                        <div className="review-date">תלמידת י"ב, רמת גן</div>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                    <span className="review-rating-score">5.0</span>
                                </div>
                                <p className="review-text">
                                    "תמיד התפדחתי לדבר אנגלית ליד כולם בכיתה. התחלתי לתרגל פה שבועיים לפני הבגרות והגעתי למבחן בשיא הביטחון. אפילו המורה שלי הייתה בשוק מהציון! 😂"
                                </p>
                            </div>

                            <div className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-avatar reviewer-avatar-blue">ע</div>
                                    <div className="reviewer-info">
                                        <h4>עומר ל.</h4>
                                        <div className="review-date">תלמיד י"ב, תל אביב</div>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                    <span className="review-rating-score">5.0</span>
                                </div>
                                <p className="review-text">
                                    "הייתי קבוע על אזור ה-70 ולא הבנתי למה. נכנסתי לתרגל 10 דקות ביום, והפידבק תמיד כיוון אותי בדיוק לטעויות שלי. סיימתי עם 92 סופי."
                                </p>
                            </div>

                            <div className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-avatar reviewer-avatar-purple">מ</div>
                                    <div className="reviewer-info">
                                        <h4>מאיה א.</h4>
                                        <div className="review-date">תלמידת י"ב, חיפה</div>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                    <span className="review-rating-score">5.0</span>
                                </div>
                                <p className="review-text">
                                    "אני אחת שלחץ הורס לה מבחנים, במיוחד כשזה בעל פה. התרגול פה הרגיש בול כמו הדבר האמיתי, אז בבגרות עצמה כבר הרגשתי בנוח. עזר לי בטירוף!"
                                </p>
                            </div>

                            <div className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-avatar reviewer-avatar-teal">ד</div>
                                    <div className="reviewer-info">
                                        <h4>דניאל ש.</h4>
                                        <div className="review-date">תלמיד י"ב, באר שבע</div>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                    <span className="review-rating-score">5.0</span>
                                </div>
                                <p className="review-text">
                                    "למועד א' ניגשתי 'על עיוור' וקיבלתי חושך... למועד ב' חרשתי פה על המערכת וקיבלתי 88! חבל שלא הכרתי את זה לפני מועד א', היה חוסך לי המון תסכול."
                                </p>
                            </div>

                            <div className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-avatar">ש</div>
                                    <div className="reviewer-info">
                                        <h4>שירה ב.</h4>
                                        <div className="review-date">תלמידת י"ב, ירושלים</div>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                    <span className="review-rating-score">5.0</span>
                                </div>
                                <p className="review-text">
                                    "הייתי בטוחה שאני יודעת אנגלית סבבה עד שקיבלתי 62 במועד א'. חברה שלחה לי קישור, ראיתי איפה אני נופלת בזמנים, ובמועד ב' כבר קפצתי ל-91."
                                </p>
                            </div>

                            <div className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-avatar reviewer-avatar-blue">י</div>
                                    <div className="reviewer-info">
                                        <h4>יונתן כ.</h4>
                                        <div className="review-date">תלמיד י"ב, נתניה</div>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                    <span className="review-rating-score">5.0</span>
                                </div>
                                <p className="review-text">
                                    "הבגרות בעל פה הייתה הסיוט שלי מתחילת השנה. אחרי שבועיים של תרגולים פשוט נכנסתי לבוחנת רגוע לגמרי. ידעתי בדיוק למה לצפות."
                                </p>
                            </div>

                            <div className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-avatar reviewer-avatar-purple">ל</div>
                                    <div className="reviewer-info">
                                        <h4>ליאור מ.</h4>
                                        <div className="review-date">תלמיד י"ב, פתח תקווה</div>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                    <span className="review-rating-score">5.0</span>
                                </div>
                                <p className="review-text">
                                    "הייתי בטוח שאני 'דובר אנגלית' ולא צריך ללמוד. מזל שחבר ישב לי על הראש לנסות... הבנתי שבשביל לקבל 100 צריך לדעת איך לענות נכון."
                                </p>
                            </div>

                            <div className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-avatar reviewer-avatar-teal">ת</div>
                                    <div className="reviewer-info">
                                        <h4>תמר ד.</h4>
                                        <div className="review-date">תלמידת י"ב, הרצליה</div>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                    <span className="review-rating-score">5.0</span>
                                </div>
                                <p className="review-text">
                                    "תמיד חשבתי שאני מדברת שוטף, עד שהפידבק הראה לי שאני עושה סלט שלם מזמני עבר ועתיד. ברגע שעבדתי על זה, הכל נשמע הרבה יותר טוב."
                                </p>
                            </div>
                        </div>
                        <button className="reviews-arrow reviews-arrow-left" onClick={() => scrollReviews('left')} aria-label="הבא">
                            <FaChevronLeft />
                        </button>
                    </div>
                </div>
            </section>

            {/* Dark Features Section (Tabs) */}
            <section id="features" className="dark-features-section">
                <div className="dark-section-container">
                    <div className="features-header-text">
                        <h2>לומדים חכם, מגיעים מוכנים.</h2>
                        <p>כל מה שצריך כדי להצליח בבגרות בעל פה באנגלית — במקום אחד.</p>
                    </div>

                    <div className="features-tab-grid">
                        <div className="features-tab-list">
                            {features.map((feature, index) => (
                                <button
                                    key={index}
                                    className={`feature-tab ${activeTab === index ? 'active' : ''}`}
                                    onClick={() => handleTabChange(index)}
                                >
                                    <div className="tab-icon">{feature.icon}</div>
                                    <div className="tab-content">
                                        <h3>{feature.title}</h3>
                                        <p>{feature.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="features-tab-visualizer">
                            <div className="visualizer-slide-caption">
                                {features[activeTab].slides[activeSlide].caption}
                            </div>
                            {features[activeTab].slides[activeSlide].img ? (
                                <div className="visualizer-content has-image">
                                    <img src={features[activeTab].slides[activeSlide].img} alt={features[activeTab].slides[activeSlide].caption} className="visualizer-real-image" />
                                </div>
                            ) : (
                                <div className="visualizer-content placeholder-image">
                                    <div className="placeholder-text">
                                        <FiMonitor className="placeholder-icon" />
                                        <span>כאן תופיע תמונה מהמערכת</span>
                                    </div>
                                </div>
                            )}
                            {features[activeTab].slides.length > 1 && (
                                <div className="visualizer-nav">
                                    <button className="viz-arrow" onClick={prevSlide}><FiChevronRight /></button>
                                    <div className="viz-dots">
                                        {features[activeTab].slides.map((_, i) => (
                                            <span key={i} className={`viz-dot ${activeSlide === i ? 'active' : ''}`} onClick={() => setActiveSlide(i)} />
                                        ))}
                                    </div>
                                    <button className="viz-arrow" onClick={nextSlide}><FiChevronLeft /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Multi-Device Section */}
            <section className="anywhere-section">
                <div className="anywhere-container">
                    <div className="anywhere-text">
                        <h2>מכל מקום בדרך שמתאימה לך</h2>
                        <p>המערכת שלנו עובדת בצורה חלקה גם במחשב הנייד, גם בטאבלט וגם בטלפון הנייד, כך שתוכל לתרגל מתי שרק תרצה.</p>
                        <div className="device-icons">
                            <FiMonitor /> <FiTablet /> <FiSmartphone />
                        </div>
                    </div>
                    <div className="anywhere-visual">
                        <div className="devices-mockup-placeholder">
                            <img src="/images/desktop-mockup.png" alt="Desktop Mockup" className="device-placeholder laptop-placeholder" />
                            <img src="/images/mobile-mockup.png" alt="Mobile Mockup" className="device-placeholder phone-placeholder" />
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="faq-section modern-faq">
                <div className="faq-container">
                    <h2 className="faq-title">שאלות נפוצות</h2>
                    <div className="faq-list">
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
            <section className="final-cta-section modern-cta stars-bg">
                <div className="cta-container">
                    <h2>הבגרות בעל פה לא חייבת להיות מפחידה.</h2>
                    <p>תלמידים שמתרגלים מגיעים מוכנים ורגועים. הצטרפו עכשיו, תתחילו לתרגל — ותגיעו לבחינה עם ביטחון אמיתי.</p>
                    <button onClick={() => navigate('/register')} className="btn-pill-primary large-btn">
                        התחילו לתרגל עכשיו
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer modern-footer stars-bg">
                <div className="footer-container">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src={logoImg} alt="Speakit Logo" className="landing-logo-img" />
                        </div>
                        <p>הפלטפורמה המובילה בישראל להכנה לבגרות בעל פה באנגלית.</p>
                    </div>
                    <div className="footer-links-group">
                        <h3>ניווט מהיר</h3>
                        <a href="#features">היתרונות שלנו</a>
                        <a href="#reviews">ביקורות</a>
                        <a href="#faq">שאלות נפוצות</a>
                    </div>
                    <div className="footer-links-group">
                        <h3>חשבון</h3>
                        <Link to="/login">התחברות</Link>
                        <Link to="/register">הרשמה ויצירת חשבון</Link>
                    </div>
                    <div className="footer-links-group">
                        <h3>צור קשר</h3>
                        <a href="mailto:team@speakit-app.com">team@speakit-app.com</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Speakit. כל הזכויות שמורות.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

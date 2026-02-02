// Mock Questions Database
export const mockQuestions = {
    'module-a': [
        {
            id: 'a1',
            text: 'Tell me about your favorite hobby and why you enjoy it.',
            category: 'personal'
        },
        {
            id: 'a2',
            text: 'What do you think about social media and its impact on teenagers?',
            category: 'opinion'
        },
        {
            id: 'a3',
            text: 'Describe a memorable trip or vacation you have taken.',
            category: 'personal'
        },
        {
            id: 'a4',
            text: 'Do you think students should wear school uniforms? Explain your opinion.',
            category: 'opinion'
        },
        {
            id: 'a5',
            text: 'Tell me about a person who has influenced your life and how.',
            category: 'personal'
        },
        {
            id: 'a6',
            text: 'What are the advantages and disadvantages of learning online?',
            category: 'opinion'
        }
    ],
    'module-b': [
        {
            id: 'b1',
            text: 'Describe your project and explain why you chose this topic.'
        },
        {
            id: 'b2',
            text: 'What challenges did you face while working on your project?'
        },
        {
            id: 'b3',
            text: 'What did you learn from doing this project?'
        },
        {
            id: 'b4',
            text: 'If you could change something about your project, what would it be?'
        }
    ],
    'module-c': [
        {
            id: 'c1',
            videoUrl: 'https://www.youtube.com/embed/Unzc731iCUY',
            videoTitle: 'How to Stay Focused While Studying',
            videoTitleHe: 'איך להישאר ממוקד בזמן לימודים',
            questions: [
                {
                    id: 'c1-q1',
                    text: 'What are the main tips mentioned in the video for staying focused?'
                },
                {
                    id: 'c1-q2',
                    text: 'Which advice do you think is most helpful for you personally? Explain why.'
                }
            ]
        },
        {
            id: 'c2',
            videoUrl: 'https://www.youtube.com/embed/wnHW6o8WMas',
            videoTitle: 'Climate Change Explained',
            videoTitleHe: 'הסבר על שינויי אקלים',
            questions: [
                {
                    id: 'c2-q1',
                    text: 'According to the video, what are the main causes of climate change?'
                },
                {
                    id: 'c2-q2',
                    text: 'What can individuals do to help reduce climate change based on the video?'
                }
            ]
        },
        {
            id: 'c3',
            videoUrl: 'https://www.youtube.com/embed/d0NHOpeczUU',
            videoTitle: 'The Benefits of Reading Books',
            videoTitleHe: 'היתרונות של קריאת ספרים',
            questions: [
                {
                    id: 'c3-q1',
                    text: 'What benefits of reading are discussed in the video?'
                },
                {
                    id: 'c3-q2',
                    text: 'Do you agree with the points made in the video? Share your opinion.'
                }
            ]
        }
    ]
}

// Generate feedback for specific criteria based on rubric
const generateCriteriaFeedback = (criteriaName, score) => {
    const rubric = {
        topicDevelopment: {
            high: {
                feedback: 'תשובה מפותחת היטב עם דוגמאות רלוונטיות. הרעיונות מאורגנים באופן לוגי וברור.',
                examples: [
                    'השתמשת בדוגמה אישית מצוינת לתמיכה בטיעון',
                    'הפיתוח של הרעיון היה מעמיק ומפורט',
                    'הארגון של התשובה היה ברור ומובנה'
                ],
                improvements: []
            },
            medium: {
                feedback: 'התשובה רלוונטית ברובה אך חסרה עומק בחלק מהמקומות.',
                examples: [
                    'הרעיון המרכזי הובע בצורה סבירה'
                ],
                improvements: [
                    'נסה/י להוסיף דוגמאות ספציפיות יותר',
                    'הרחב/י את ההסבר עם פרטים נוספים',
                    'חשוב/י על ארגון ברור יותר של הרעיונות'
                ]
            },
            low: {
                feedback: 'התשובה קצרה ולא מפותחת מספיק.',
                examples: [],
                improvements: [
                    'התשובה צריכה להיות ארוכה ומפורטת יותר',
                    'חסרות דוגמאות לתמיכה בטיעונים',
                    'הקשר לנושא השאלה לא ברור מספיק',
                    'נסה/י לארגן את הרעיונות בצורה ברורה יותר'
                ]
            }
        },
        fluency: {
            high: {
                feedback: 'דיבור שוטף וברור עם קצב טבעי ואינטונציה טובה.',
                examples: [
                    'הקצב היה טבעי ונעים להאזנה',
                    'ההגייה הייתה ברורה ומובנת'
                ],
                improvements: []
            },
            medium: {
                feedback: 'הדיבור מובן ברובו אך ישנן הססות מסוימות.',
                examples: [],
                improvements: [
                    'נסה/י להפחית את השימוש ב-"um" ו-"uh"',
                    'תרגל/י את הקטע מספר פעמים לפני הקלטה',
                    'שים/י לב לקצב - לפעמים מהיר מדי'
                ]
            },
            low: {
                feedback: 'הדיבור מהוסס ולא רציף, עם קשיים בהבנה.',
                examples: [],
                improvements: [
                    'יש לתרגל את השטף - הססות רבות מקשות על ההבנה',
                    'נסה/י להאט ולדבר בצורה ברורה יותר',
                    'תרגול יומי קצר ישפר את השטף משמעותית',
                    'הקשב/י לאנגלית מדוברת (פודקאסטים, סרטים) לשיפור האינטונציה'
                ]
            }
        },
        vocabulary: {
            high: {
                feedback: 'שימוש מגוון ומדויק באוצר מילים עשיר.',
                examples: [
                    'שימוש מצוין בביטויים מתקדמים',
                    'מילים מדויקות והולמות להקשר'
                ],
                improvements: []
            },
            medium: {
                feedback: 'אוצר מילים סביר עם חזרות מסוימות.',
                examples: [],
                improvements: [
                    'נסה/י להשתמש במילים מגוונות יותר במקום לחזור על אותן מילים',
                    'למד/י ביטויים חדשים לנושא זה',
                    'השתמש/י במילות קישור מגוונות (however, moreover, in addition)'
                ]
            },
            low: {
                feedback: 'אוצר מילים בסיסי מאוד עם חזרות רבות.',
                examples: [],
                improvements: [
                    'יש להרחיב את אוצר המילים - שימוש חוזר באותן מילים בסיסיות',
                    'למד/י 5 מילים חדשות ביום בנושא זה',
                    'נסה/י להחליף מילים כמו "good" ב-"excellent", "amazing", "beneficial"',
                    'השתמש/י באפליקציות לאוצר מילים כמו Quizlet'
                ]
            }
        },
        grammar: {
            high: {
                feedback: 'שימוש נכון במבני משפט מגוונים עם מעט מאוד שגיאות.',
                examples: [
                    'שימוש נכון בזמנים שונים',
                    'מבני משפט מורכבים ונכונים'
                ],
                improvements: []
            },
            medium: {
                feedback: 'שימוש סביר בדקדוק עם מספר שגיאות.',
                examples: [],
                improvements: [
                    'שים/י לב לשימוש נכון ב-Present Perfect vs Past Simple',
                    'התאמת נושא ונשוא - "he goes" ולא "he go"',
                    'שימוש נכון ב-articles (a/an/the)'
                ]
            },
            low: {
                feedback: 'שגיאות דקדוקיות רבות המקשות על ההבנה.',
                examples: [],
                improvements: [
                    'יש לחזור על כללי הזמנים באנגלית',
                    'שגיאות בהתאמת נושא ונשוא - תרגל/י את הכלל הבסיסי',
                    'מבנה המשפטים לא תקין - Subject + Verb + Object',
                    'למד/י מחדש את השימוש ב-articles (a/an/the)'
                ]
            }
        },
        pronunciation: {
            high: {
                feedback: 'הגייה ברורה ומובנת עם הטעמה נכונה.',
                examples: [
                    'הגייה ברורה של כל המילים',
                    'הטעמה נכונה במילים רב-הברתיות'
                ],
                improvements: []
            },
            medium: {
                feedback: 'הגייה מובנת ברובה עם קשיים במילים מסוימות.',
                examples: [],
                improvements: [
                    'שים/י לב להגייה נכונה של צלילי "th"',
                    'תרגל/י הטעמה נכונה במילים ארוכות',
                    'השתמש/י ב-Google Translate לשמוע הגייה נכונה'
                ]
            },
            low: {
                feedback: 'קשיים משמעותיים בהגייה.',
                examples: [],
                improvements: [
                    'יש לתרגל הגייה - קשה להבין חלק מהמילים',
                    'הקשב/י להגייה נכונה והקלט/י את עצמך',
                    'התמקד/י בצלילים שאינם קיימים בעברית',
                    'השתמש/י באפליקציות כמו ELSA Speak לתרגול הגייה'
                ]
            }
        }
    }

    const level = score >= 76 ? 'high' : score >= 55 ? 'medium' : 'low'
    return rubric[criteriaName]?.[level] || { feedback: '', examples: [], improvements: [] }
}

// Mock Analysis Generator - Enhanced version per PRD
export function generateMockAnalysis(practice) {
    const baseScore = 60 + Math.random() * 30

    // Generate per-question analysis for each recording
    const questionAnalyses = practice.questions.map((question, index) => {
        const topicDevelopment = Math.round(Math.max(40, Math.min(100, baseScore + (Math.random() - 0.5) * 20)))
        const fluency = Math.round(Math.max(40, Math.min(100, baseScore + (Math.random() - 0.5) * 25)))
        const vocabulary = Math.round(Math.max(40, Math.min(100, baseScore + (Math.random() - 0.5) * 20)))
        const grammar = Math.round(Math.max(40, Math.min(100, baseScore + (Math.random() - 0.5) * 25)))

        // Calculate weighted score
        const questionScore = Math.round(
            topicDevelopment * 0.5 +
            fluency * 0.15 +
            vocabulary * 0.2 +
            grammar * 0.15
        )

        // Generate mock transcript
        const transcripts = [
            "I think that this is a really important topic. In my opinion, there are many factors to consider. For example, when I think about my own experience, I remember that it had a significant impact on my life. The main reason is that it helped me understand better how things work in the real world.",
            "Well, let me tell you about this. First of all, I believe that everyone has their own perspective. From my point of view, the most important thing is to stay focused and work hard. Additionally, I think that having support from family and friends makes a big difference.",
            "This is something I feel strongly about. Based on what I have learned, there are several key points to mention. The first point is about understanding the basics. The second point relates to practical application. Overall, I think this approach is very effective."
        ]

        // Find the recording for this question
        const recording = practice.recordings?.find(r => r.questionId === question.id)

        console.log(`🔎 Analysis for Q${question.id}: Path value =`, recording?.storagePath)

        return {
            questionId: question.id,
            questionText: question.text,
            audioUrl: recording?.storagePath || null,
            recordingUrl: recording?.storagePath || null, // For DB saving consistency
            transcript: transcripts[Math.floor(Math.random() * transcripts.length)],
            duration: recording?.duration || Math.round(30 + Math.random() * 90),
            totalScore: Math.round(
                (topicDevelopment * 0.5) +
                (fluency * 0.15) +
                (vocabulary * 0.20) +
                (grammar * 0.15)
            ),
            scores: {
                topicDevelopment,
                fluency,
                vocabulary,
                grammar
            },
            feedback: {
                topicDevelopment: {
                    score: topicDevelopment,
                    weight: 50,
                    ...generateCriteriaFeedback('topicDevelopment', topicDevelopment)
                },
                fluency: {
                    score: fluency,
                    weight: 15,
                    ...generateCriteriaFeedback('fluency', fluency)
                },
                vocabulary: {
                    score: vocabulary,
                    weight: 20,
                    ...generateCriteriaFeedback('vocabulary', vocabulary)
                },
                grammar: {
                    score: grammar,
                    weight: 15,
                    ...generateCriteriaFeedback('grammar', grammar)
                }
            },
            totalScore: questionScore
        }
    })

    // Calculate module scores for simulation
    let moduleScores = null
    if (practice.type === 'simulation') {
        // Assuming first question is A, second is B, rest are C
        const moduleAScore = questionAnalyses[0]?.totalScore || 0
        const moduleBScore = questionAnalyses[1]?.totalScore || 0
        const moduleCScores = questionAnalyses.slice(2).map(q => q.totalScore)
        const moduleCAvg = moduleCScores.length > 0
            ? Math.round(moduleCScores.reduce((a, b) => a + b, 0) / moduleCScores.length)
            : 0

        moduleScores = {
            moduleA: { score: moduleAScore, weight: 25 },
            moduleB: { score: moduleBScore, weight: 25 },
            moduleC: { score: moduleCAvg, weight: 50 }
        }
    }

    // Calculate total score
    const totalScore = moduleScores
        ? Math.round(
            moduleScores.moduleA.score * 0.25 +
            moduleScores.moduleB.score * 0.25 +
            moduleScores.moduleC.score * 0.50
        )
        : questionAnalyses.length > 0
            ? Math.round(questionAnalyses.reduce((sum, q) => sum + q.totalScore, 0) / questionAnalyses.length)
            : 0

    // Aggregate feedback
    const avgScores = {
        topicDevelopment: Math.round(questionAnalyses.reduce((s, q) => s + q.scores.topicDevelopment, 0) / questionAnalyses.length) || 0,
        fluency: Math.round(questionAnalyses.reduce((s, q) => s + q.scores.fluency, 0) / questionAnalyses.length) || 0,
        vocabulary: Math.round(questionAnalyses.reduce((s, q) => s + q.scores.vocabulary, 0) / questionAnalyses.length) || 0,
        grammar: Math.round(questionAnalyses.reduce((s, q) => s + q.scores.grammar, 0) / questionAnalyses.length) || 0
    }

    const totalDuration = questionAnalyses.reduce((s, q) => s + q.duration, 0)

    // Collect all improvements and strengths
    const allImprovements = []
    const allStrengths = []

    questionAnalyses.forEach(q => {
        Object.values(q.feedback).forEach(f => {
            if (f.improvements) allImprovements.push(...f.improvements)
            if (f.examples) allStrengths.push(...f.examples)
        })
    })

    // Deduplicate and limit
    const uniqueImprovements = [...new Set(allImprovements)].slice(0, 5)
    const uniqueStrengths = [...new Set(allStrengths)].slice(0, 3)

    return {
        totalScore,
        questionAnalyses,
        moduleScores,
        scores: avgScores,
        feedback: {
            topicDevelopment: {
                score: avgScores.topicDevelopment,
                weight: 50,
                ...generateCriteriaFeedback('topicDevelopment', avgScores.topicDevelopment)
            },
            fluency: {
                score: avgScores.fluency,
                weight: 15,
                ...generateCriteriaFeedback('fluency', avgScores.fluency)
            },
            vocabulary: {
                score: avgScores.vocabulary,
                weight: 20,
                ...generateCriteriaFeedback('vocabulary', avgScores.vocabulary)
            },
            grammar: {
                score: avgScores.grammar,
                weight: 15,
                ...generateCriteriaFeedback('grammar', avgScores.grammar)
            }
        },
        improvements: uniqueImprovements,
        strengths: uniqueStrengths,
        duration: totalDuration
    }
}

// Mock Users for Admin Panel
export const mockUsers = [
    { id: '1', name: 'יוסי כהן', email: 'yossi@example.com', practiceCount: 15, avgScore: 78, lastActive: '2026-01-13' },
    { id: '2', name: 'מיכל לוי', email: 'michal@example.com', practiceCount: 23, avgScore: 85, lastActive: '2026-01-12' },
    { id: '3', name: 'דני רוזן', email: 'dani@example.com', practiceCount: 8, avgScore: 65, lastActive: '2026-01-11' },
    { id: '4', name: 'שירה גולד', email: 'shira@example.com', practiceCount: 31, avgScore: 92, lastActive: '2026-01-13' },
    { id: '5', name: 'אורן ברק', email: 'oren@example.com', practiceCount: 12, avgScore: 71, lastActive: '2026-01-10' }
]

// Admin Statistics
export const mockAdminStats = {
    totalUsers: 156,
    activeToday: 42,
    totalPractices: 1847,
    avgSessionTime: '8:32',
    practicesThisWeek: [120, 145, 132, 168, 155, 98, 142],
    scoreDistribution: {
        excellent: 23,
        good: 45,
        average: 25,
        needsWork: 7
    }
}

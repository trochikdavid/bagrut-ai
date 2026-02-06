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

// Helper to generate empty feedback structure
const getEmptyFeedback = (weight) => ({
    score: 0,
    weight,
    feedback: '',
    examples: [],
    improvements: []
})

// Mock Analysis Generator - Returns empty/zero data as requested
export function generateMockAnalysis(practice) {
    // Generate per-question analysis for each recording
    const questionAnalyses = practice.questions.map((question, index) => {
        // Find the recording for this question
        const recording = practice.recordings?.find(r => r.questionId === question.id)

        console.log(`🔎 Analysis for Q${question.id}: Path value =`, recording?.storagePath)

        return {
            questionId: question.id,
            questionText: question.text,
            audioUrl: recording?.storagePath || null,
            recordingUrl: recording?.storagePath || null, // For DB saving consistency
            transcript: null, // No fake transcript
            duration: recording?.duration || 0,
            totalScore: 0,
            scores: {
                topicDevelopment: 0,
                fluency: 0,
                vocabulary: 0,
                grammar: 0
            },
            feedback: {
                videoUrl: question.videoUrl,
                topicDevelopment: getEmptyFeedback(50),
                fluency: getEmptyFeedback(15),
                vocabulary: getEmptyFeedback(20),
                grammar: getEmptyFeedback(15)
            },
            totalScore: 0
        }
    })

    // Calculate module scores for simulation
    let moduleScores = null
    if (practice.type === 'simulation') {
        moduleScores = {
            moduleA: { score: 0, weight: 25 },
            moduleB: { score: 0, weight: 25 },
            moduleC: { score: 0, weight: 50 }
        }
    }

    return {
        totalScore: 0,
        questionAnalyses,
        moduleScores,
        scores: {
            topicDevelopment: 0,
            fluency: 0,
            vocabulary: 0,
            grammar: 0
        },
        feedback: {
            topicDevelopment: getEmptyFeedback(50),
            fluency: getEmptyFeedback(15),
            vocabulary: getEmptyFeedback(20),
            grammar: getEmptyFeedback(15)
        },
        improvements: [],
        strengths: [],
        duration: questionAnalyses.reduce((s, q) => s + q.duration, 0)
    }
}

// Mock Users and Admin Stats were removed as they are no longer used.
// Real data is fetched via adminService.js


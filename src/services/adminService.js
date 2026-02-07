import { supabase } from '../lib/supabase'

/**
 * Admin Service - Database operations for admin panel
 */

// Get all users with their stats
export async function getAllUsers() {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (profilesError) throw profilesError

    // Get practice stats for each user
    const usersWithStats = await Promise.all(
        profiles.map(async (profile) => {
            const { data: practices, error: practicesError } = await supabase
                .from('practices')
                .select('total_score, completed_at')
                .eq('user_id', profile.id)
                .eq('status', 'completed')

            if (practicesError) {
                return {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    role: profile.role,
                    practiceCount: 0,
                    avgScore: 0,
                    lastActive: profile.created_at
                }
            }

            const practiceCount = practices?.length || 0
            const avgScore = practiceCount > 0
                ? Math.round(practices.reduce((sum, p) => sum + (p.total_score || 0), 0) / practiceCount)
                : 0
            const lastActive = practices?.length > 0
                ? practices.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]?.completed_at
                : profile.created_at

            return {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                isApproved: profile.is_approved,
                practiceCount,
                avgScore,
                lastActive: lastActive?.split('T')[0] || profile.created_at?.split('T')[0]
            }
        })
    )

    // Return all users including admins for now so you can see the data
    return usersWithStats
}

// Toggle user approval status
export async function toggleUserApproval(userId, currentStatus) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ is_approved: !currentStatus })
        .eq('id', userId)
        .select()
        .single()

    if (error) throw error
    return data
}

// Delete user (and all their data)
export async function deleteUser(userId) {
    // Delete user's practices (cascade should handle questions but let's be safe)
    const { error: practicesError } = await supabase
        .from('practices')
        .delete()
        .eq('user_id', userId)

    if (practicesError) throw practicesError

    // Delete profile
    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (profileError) throw profileError

    // Note: Deleting from auth.users requires service role key usually, 
    // effectively this just removes them from the app's data perspective.
    // Real deletion from auth system isn't possible with anon key.

    return true
}

// Get aggregated admin statistics
export async function getAdminStats() {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

    if (usersError) throw usersError

    // Get active users today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: activeToday, error: activeError } = await supabase
        .from('practices')
        .select('user_id', { count: 'exact', head: true })
        .gte('started_at', today.toISOString())

    if (activeError) console.error('Active today error:', activeError)

    // Get total practices count
    const { count: totalPractices, error: practicesError } = await supabase
        .from('practices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

    if (practicesError) throw practicesError

    // Get practices from last 7 days for chart
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: weekPractices, error: weekError } = await supabase
        .from('practices')
        .select('started_at')
        .gte('started_at', weekAgo.toISOString())
        .eq('status', 'completed')

    if (weekError) console.error('Week practices error:', weekError)

    // Group by day
    const practicesThisWeek = [0, 0, 0, 0, 0, 0, 0]
    weekPractices?.forEach(p => {
        const practiceDate = new Date(p.started_at)
        const dayIndex = 6 - Math.floor((today - practiceDate) / (1000 * 60 * 60 * 24))
        if (dayIndex >= 0 && dayIndex < 7) {
            practicesThisWeek[dayIndex]++
        }
    })

    // Get score distribution
    const { data: allScores, error: scoresError } = await supabase
        .from('practices')
        .select('total_score')
        .eq('status', 'completed')
        .not('total_score', 'is', null)

    if (scoresError) console.error('Scores error:', scoresError)

    const scoreDistribution = {
        excellent: 0, // 90+
        good: 0,      // 70-89
        average: 0,   // 55-69
        needsWork: 0  // below 55
    }

    allScores?.forEach(p => {
        const score = p.total_score
        if (score >= 90) scoreDistribution.excellent++
        else if (score >= 70) scoreDistribution.good++
        else if (score >= 55) scoreDistribution.average++
        else scoreDistribution.needsWork++
    })

    // Calculate average session time (from duration field)
    const { data: durations, error: durationError } = await supabase
        .from('practices')
        .select('duration')
        .eq('status', 'completed')
        .not('duration', 'is', null)

    if (durationError) console.error('Duration error:', durationError)

    const totalDuration = durations?.reduce((sum, p) => sum + (p.duration || 0), 0) || 0
    const avgDuration = durations?.length > 0 ? Math.round(totalDuration / durations.length) : 0
    const avgSessionTime = `${Math.floor(avgDuration / 60)}:${String(avgDuration % 60).padStart(2, '0')}`

    return {
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        totalPractices: totalPractices || 0,
        avgSessionTime,
        practicesThisWeek,
        scoreDistribution
    }
}

// Question management
// Question management
export async function getQuestions(moduleType = null) {
    let query = supabase
        .from('questions')
        .select('*')
        .order('order_index', { ascending: true })

    if (moduleType) {
        query = query.eq('module_type', moduleType)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform data to match frontend expectations
    const questions = {
        'module-a': [],
        'module-b': [],
        'module-c': []
    }

    data.forEach(q => {
        if (q.module_type === 'module-c') {
            // Add IDs to each sub_question since DB stores them without IDs
            const subQuestions = (q.sub_questions || []).map((sq, index) => ({
                ...sq,
                id: `${q.id}-q${index + 1}`, // Generate unique ID: parentId-q1, parentId-q2, etc.
            }))

            questions['module-c'].push({
                id: q.id,
                videoUrl: q.video_url,
                videoTitle: q.video_title,
                videoTitleHe: q.video_title_he,
                videoTranscript: q.video_transcript || '',
                questions: subQuestions
            })
        } else {
            const list = questions[q.module_type] || []
            list.push({
                id: q.id,
                text: q.text
            })
            if (questions[q.module_type]) {
                // already pushed
            } else {
                questions[q.module_type] = list
            }
        }
    })

    if (moduleType) return questions[moduleType]
    return questions
}

export async function createQuestion(questionData) {
    // Map frontend data to DB columns
    let dbData = {
        module_type: questionData.module
    }

    if (questionData.module === 'module-c') {
        dbData = {
            ...dbData,
            video_url: questionData.videoUrl,
            video_title: questionData.videoTitle,
            video_title_he: questionData.videoTitleHe,
            video_transcript: questionData.videoTranscript || null,
            sub_questions: questionData.questions
        }
    } else {
        dbData = {
            ...dbData,
            text: questionData.text
        }
    }

    const { data, error } = await supabase
        .from('questions')
        .insert(dbData)
        .select()
        .single()

    if (error) throw error

    // Return formatted
    if (data.module_type === 'module-c') {
        return {
            id: data.id,
            videoUrl: data.video_url,
            videoTitle: data.video_title,
            videoTitleHe: data.video_title_he,
            videoTranscript: data.video_transcript || '',
            questions: data.sub_questions
        }
    } else {
        return {
            id: data.id,
            text: data.text
        }
    }
}

export async function updateQuestion(questionId, updates) {
    // Map frontend field names to database column names
    let dbUpdates = {}

    if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl
    if (updates.videoTitle !== undefined) dbUpdates.video_title = updates.videoTitle
    if (updates.videoTitleHe !== undefined) dbUpdates.video_title_he = updates.videoTitleHe
    if (updates.videoTranscript !== undefined) dbUpdates.video_transcript = updates.videoTranscript
    if (updates.questions !== undefined) dbUpdates.sub_questions = updates.questions
    if (updates.text !== undefined) dbUpdates.text = updates.text

    const { data, error } = await supabase
        .from('questions')
        .update(dbUpdates)
        .eq('id', questionId)
        .select()
        .single()

    if (error) throw error

    // Return formatted based on module type
    if (data.module_type === 'module-c') {
        return {
            id: data.id,
            videoUrl: data.video_url,
            videoTitle: data.video_title,
            videoTitleHe: data.video_title_he,
            videoTranscript: data.video_transcript || '',
            questions: data.sub_questions || []
        }
    } else {
        return {
            id: data.id,
            text: data.text
        }
    }
}

export async function deleteQuestion(questionId) {
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

    if (error) throw error
    return true
}

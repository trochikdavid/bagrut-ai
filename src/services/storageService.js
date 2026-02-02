import { supabaseUrl, supabaseAnonKey, supabase } from '../lib/supabase'

/**
 * Storage Service - Audio recording storage operations
 * Uses native fetch to avoid AbortError issues with Supabase client
 */

// Get headers with user's JWT token for authenticated requests
async function getAuthHeaders(contentType = null) {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || supabaseAnonKey

        const headers = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`
        }

        if (contentType) {
            headers['Content-Type'] = contentType
        }

        return headers
    } catch (e) {
        return {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            ...(contentType ? { 'Content-Type': contentType } : {})
        }
    }
}

// Upload a recording to Supabase Storage
export async function uploadRecording(userId, practiceId, questionId, audioBlob) {
    const fileName = `${userId}/${practiceId}/${questionId}-${Date.now()}.webm`
    const headers = await getAuthHeaders('audio/webm')

    const url = `${supabaseUrl}/storage/v1/object/recordings/${fileName}`

    // For file uploads we send the blob directly
    console.log(`📤 Uploading to ${url}...`)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: audioBlob
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ Upload failed:', response.status, errorText)
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
        }

        console.log('✅ Upload successful:', fileName)

        // Verify file exists immediately
        const listUrl = `${supabaseUrl}/storage/v1/object/list/recordings`
        const listResponse = await fetch(listUrl, {
            method: 'POST',
            headers: await getAuthHeaders('application/json'),
            body: JSON.stringify({
                prefix: `${userId}/${practiceId}`,
                limit: 100
            })
        })

        if (listResponse.ok) {
            const files = await listResponse.json()
            const exists = files.find(f => f.name === fileName.split('/').pop())
            console.log('🧐 File verification:', exists ? 'FOUND' : 'NOT FOUND IN LIST')
        }

        return fileName

    } catch (err) {
        console.error('❌ Upload exception:', err)
        throw err
    }
}

// Get a signed URL for a recording (valid for 1 hour)
export async function getRecordingUrl(path) {
    if (!path) return null

    const headers = await getAuthHeaders('application/json')
    const url = `${supabaseUrl}/storage/v1/object/sign/recordings/${path}`

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expiresIn: 3600 })
    })

    if (!response.ok) {
        console.error('Error getting signed URL:', await response.text())
        return null
    }

    const data = await response.json()
    // The signedURL returned is usually relative, e.g. /object/sign/bucket/path?token=...
    // We need to prepend the project URL
    return `${supabaseUrl}/storage/v1${data.signedURL}`
}

// Delete a recording
export async function deleteRecording(path) {
    if (!path) return true

    const headers = await getAuthHeaders('application/json')
    const url = `${supabaseUrl}/storage/v1/object/recordings/${path}`

    const response = await fetch(url, {
        method: 'DELETE',
        headers
    })

    if (!response.ok) {
        throw new Error(await response.text())
    }

    return true
}

// Delete all recordings for a practice
// Note: This is harder via REST without listing first, keeping simple for now
export async function deletePracticeRecordings(userId, practiceId) {
    // Usually handled by cascading deletes or manual cleanup
    // For now we'll just log
    console.warn('deletePracticeRecordings not fully implemented in native fetch version')
    return true
}

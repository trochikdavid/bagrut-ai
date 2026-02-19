import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured, fetchFromSupabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [demoMode] = useState(!isSupabaseConfigured)
    const fetchingProfile = useRef(false)

    useEffect(() => {
        // If not configured, use demo mode
        if (!isSupabaseConfigured) {
            const storedUser = localStorage.getItem('bagrut_user')
            if (storedUser) {
                setUser(JSON.parse(storedUser))
            }
            setLoading(false)
            return
        }

        // Supabase mode - check for existing session
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    await fetchUserProfile(session.user.id)
                }
            } catch (error) {
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_IN' && session?.user && !user) {
                    // Set basic user from session (don't fetch profile here to avoid AbortError)
                    setUser({
                        id: session.user.id,
                        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                        email: session.user.email,
                        isAdmin: false,
                        isPremium: null, // Default until profile loaded
                        createdAt: session.user.created_at
                    })
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                }
            }
        )

        return () => {
            subscription?.unsubscribe()
        }
    }, [])

    const fetchUserProfile = async (userId, retries = 3) => {
        // Prevent concurrent fetches
        if (fetchingProfile.current) {
            return
        }

        fetchingProfile.current = true

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {

                // Get current session token for the request
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.access_token

                // Use native fetch helper consistently
                const profile = await fetchFromSupabase('profiles', {
                    select: 'role,name,email,created_at,is_approved,is_premium',
                    eq: { id: userId },
                    single: true
                }, token)

                if (!profile) {
                    throw new Error('Profile fetch failed or returned null')
                }

                const fullUser = {
                    id: userId, // Profile id matches query
                    name: profile.name,
                    email: profile.email,
                    isAdmin: profile.role === 'admin',
                    isApproved: profile.is_approved,
                    isPremium: profile.is_premium === true || profile.is_premium === 'true', // Handle both boolean and string "true" only
                    createdAt: profile.created_at
                }

                // If user is explicitly not approved, don't log them in
                if (profile.is_approved === false) {
                    setUser(null)
                    return
                }

                setUser(fullUser)
                fetchingProfile.current = false
                return

            } catch (error) {
                // If AbortError, retry
                if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
                    await new Promise(r => setTimeout(r, 200))
                    continue
                }
            }
        }

        // All retries failed - fall back to auth user
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
                setUser({
                    id: authUser.id,
                    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                    email: authUser.email,
                    isAdmin: false,
                    isPremium: false,
                    createdAt: authUser.created_at
                })
            }
        } catch (e) {
        }
        fetchingProfile.current = false
    }

    // Demo mode login (fallback)
    const demoLogin = async (email, password) => {
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (email === 'admin@bagrut.ai' && password === 'admin123') {
            const adminUser = {
                id: 'admin-1',
                name: 'מנהל מערכת',
                email: 'admin@bagrut.ai',
                isAdmin: true,
                isPremium: true,
                createdAt: new Date().toISOString()
            }
            setUser(adminUser)
            localStorage.setItem('bagrut_user', JSON.stringify(adminUser))
            return { success: true }
        }

        if (password.length >= 6) {
            const newUser = {
                id: `user-${Date.now()}`,
                name: email.split('@')[0],
                email,
                isAdmin: false,
                isPremium: false, // Demo user is not premium by default
                createdAt: new Date().toISOString()
            }
            setUser(newUser)
            localStorage.setItem('bagrut_user', JSON.stringify(newUser))
            return { success: true }
        }

        return { success: false, error: 'אימייל או סיסמה שגויים' }
    }

    const login = async (email, password) => {
        // Use demo mode if Supabase not configured
        if (demoMode) {
            return demoLogin(email, password)
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                // Translate common errors to Hebrew
                let errorMessage = error.message
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'אימייל או סיסמה שגויים'
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'יש לאמת את כתובת האימייל'
                }
                return { success: false, error: errorMessage }
            }

            // Set user directly from session data to avoid AbortError
            if (data.user) {
                // Set basic user immediately from session
                const sessionUser = {
                    id: data.user.id,
                    name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                    email: data.user.email,
                    isAdmin: false, // Will be updated later
                    isPremium: null,
                    createdAt: data.user.created_at
                }
                setUser(sessionUser)

                // Check profile for admin status in background using native fetch
                setTimeout(async () => {
                    const token = data.session.access_token
                    const profile = await fetchFromSupabase('profiles', {
                        select: 'role,name,is_approved,is_premium',
                        eq: { id: data.user.id },
                        single: true
                    }, token)

                    if (profile) {
                        setUser(prev => ({
                            ...prev,
                            name: profile.name || prev.name,
                            isAdmin: profile.role === 'admin',
                            isApproved: profile.is_approved,
                            isPremium: profile.is_premium === true || profile.is_premium === 'true' // Handle both boolean and string "true" only
                        }))

                        if (profile.is_approved === false) {
                            await logout()
                            window.location.reload()
                        }
                    }
                }, 200)
            }

            return { success: true }
        } catch (error) {
            return { success: false, error: 'שגיאה בהתחברות. נסה שוב.' }
        }
    }

    // Demo mode register (fallback)
    const demoRegister = async (name, email, password) => {
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (password.length < 6) {
            return { success: false, error: 'הסיסמה חייבת להכיל לפחות 6 תווים' }
        }

        const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
            isAdmin: false,
            createdAt: new Date().toISOString()
        }

        setUser(newUser)
        localStorage.setItem('bagrut_user', JSON.stringify(newUser))
        return { success: true }
    }

    const register = async (name, email, password) => {
        // Use demo mode if Supabase not configured
        if (demoMode) {
            return demoRegister(name, email, password)
        }

        try {
            if (password.length < 6) {
                return { success: false, error: 'הסיסמה חייבת להכיל לפחות 6 תווים' }
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name
                    }
                }
            })

            if (error) {
                let errorMessage = error.message
                if (error.message.includes('User already registered')) {
                    errorMessage = 'כתובת האימייל כבר רשומה במערכת'
                } else if (error.message.includes('Password should be at least')) {
                    errorMessage = 'הסיסמה חייבת להכיל לפחות 6 תווים'
                }
                return { success: false, error: errorMessage }
            }

            // Check if user exists (Supabase returns user with empty identities array if exists and email confirmation is on)
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                return { success: false, error: 'כתובת האימייל כבר רשומה במערכת' }
            }

            // Don't auto-login - user needs to verify email first
            // Just return success to show verification message
            return { success: true }
        } catch (error) {
            return { success: false, error: 'שגיאה בהרשמה. נסה שוב.' }
        }
    }

    const logout = async () => {
        // Clear user immediately
        setUser(null)

        if (demoMode) {
            localStorage.removeItem('bagrut_user')
            return
        }

        // Try to sign out from Supabase (but don't block on it)
        try {
            await supabase.auth.signOut()
        } catch (error) {
            // Ignore AbortError - user is already logged out locally
            if (!error.message?.includes('AbortError')) {
            }
        }
    }

    const updateProfile = async (updates) => {
        if (demoMode) {
            await new Promise(resolve => setTimeout(resolve, 500))
            const updatedUser = { ...user, ...updates }
            setUser(updatedUser)
            localStorage.setItem('bagrut_user', JSON.stringify(updatedUser))
            return { success: true }
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: updates.name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error

            setUser(prev => ({ ...prev, ...updates }))
            return { success: true }
        } catch (error) {
            return { success: false, error: 'שגיאה בעדכון הפרופיל' }
        }
    }

    const deleteAccount = async () => {
        if (demoMode) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            setUser(null)
            localStorage.removeItem('bagrut_user')
            return { success: true }
        }

        try {
            // Delete user's practices first (cascade will handle practice_questions)
            await supabase
                .from('practices')
                .delete()
                .eq('user_id', user.id)

            // Delete profile
            await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id)

            // Sign out (Note: actual auth.users deletion requires admin API)
            await supabase.auth.signOut()
            setUser(null)

            return { success: true }
        } catch (error) {
            return { success: false, error: 'שגיאה במחיקת החשבון' }
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            demoMode,
            login,
            register,
            logout,
            updateProfile,
            deleteAccount,
            refreshProfile: () => user ? fetchUserProfile(user.id) : Promise.resolve()
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

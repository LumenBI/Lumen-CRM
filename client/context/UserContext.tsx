'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface UserProfile {
    id: string
    email: string
    role: 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'Agente'
    full_name: string | null
}

interface UserContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    refreshProfile: () => Promise<void>
    logout: () => Promise<void>
    reauthorizeGoogle: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()


    const fetchProfile = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                console.error('Session retrieval error:', sessionError);
                setLoading(false);
                return;
            }

            if (!session?.user) {
                setLoading(false)
                return
            }

            setUser(session.user)

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
            } else {
                setProfile(data)
            }
        } catch (error) {
            console.error('Error in fetchProfile:', error)
        } finally {
            setLoading(false)
        }
    }

    const reauthorizeGoogle = async () => {
        console.log('Initiating Google re-authorization fallback...');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                    scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly'
                },
            },
        });

        if (error) {
            console.error('Error during Google re-authorization:', error);
            throw error;
        }
    }

    const logout = async () => {
        try {
            await supabase.auth.signOut()
            setUser(null)
            setProfile(null)
            localStorage.clear()
            sessionStorage.clear()
            router.refresh()
            router.push('/')
        } catch (error) {
            console.error('Error during logout:', error)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    return (
        <UserContext.Provider value={{ user, profile, loading, refreshProfile: fetchProfile, logout, reauthorizeGoogle }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}

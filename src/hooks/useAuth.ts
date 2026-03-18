import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Profile } from '../lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (uid: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
      if (error || !data) {
        setProfile(null)
      } else {
        setProfile(data as Profile)
      }
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (event === 'INITIAL_SESSION') {
        setLoading(false)
        if (u && !u.is_anonymous) fetchProfile(u.id)
      } else if (event === 'SIGNED_IN') {
        if (u && !u.is_anonymous) fetchProfile(u.id)
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (username: string, email: string, password: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return error.message
      if (!data.user) return '登録に失敗しました'
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        role: 'user',
      })
      if (profileError) return profileError.message
      return null
    } catch (e: unknown) {
      if (e instanceof Error) return e.message
      return '登録に失敗しました'
    }
  }

  const signIn = async (email: string, password: string): Promise<string | null> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return 'ユーザー名またはパスワードが間違っています'
      return null
    } catch {
      return 'ユーザー名またはパスワードが間違っています'
    }
  }

  const signInAsGuest = async (): Promise<string | null> => {
    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) return error.message
      return null
    } catch (e: unknown) {
      if (e instanceof Error) return e.message
      return 'ゲストログインに失敗しました'
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const isAdmin = profile?.role === 'admin'
  const isGuest = user?.is_anonymous === true

  return {
    user,
    profile,
    loading,
    isAdmin,
    isGuest,
    signUp,
    signIn,
    signInAsGuest,
    signOut,
  }
}

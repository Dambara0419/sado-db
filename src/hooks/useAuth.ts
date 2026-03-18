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

  const ensureOAuthProfile = async (u: import('@supabase/supabase-js').User): Promise<void> => {
    const { data } = await supabase.from('profiles').select('id').eq('id', u.id).single()
    if (!data) {
      const displayName =
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.email?.split('@')[0] ||
        'user'
      await supabase.from('profiles').insert({ id: u.id, username: displayName, role: 'user' })
    }
    await fetchProfile(u.id)
  }

  useEffect(() => {
    // 初期セッションをgetSession()で確実に取得
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        const u = session?.user ?? null
        setUser(u)
        if (u && !u.is_anonymous) {
          await fetchProfile(u.id)
        } else {
          setProfile(null)
        }
      } finally {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return
      try {
        const u = session?.user ?? null
        setUser(u)
        if (u && !u.is_anonymous) {
          if (event === 'SIGNED_IN' && u.app_metadata?.provider === 'google') {
            await ensureOAuthProfile(u)
          } else {
            await fetchProfile(u.id)
          }
        } else {
          setProfile(null)
        }
      } catch {
        // ignore
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

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) return error.message
      return null
    } catch (e: unknown) {
      if (e instanceof Error) return e.message
      return 'Googleログインに失敗しました'
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
    signInWithGoogle,
    signInAsGuest,
    signOut,
  }
}

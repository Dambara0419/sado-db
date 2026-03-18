import React, { useState } from 'react'
import './AuthModal.css'

interface AuthModalProps {
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<string | null>
  onSignUp: (username: string, email: string, password: string) => Promise<string | null>
  onSignInWithGoogle: () => Promise<string | null>
}

type AuthMode = 'login' | 'register'

export default function AuthModal({ onClose, onSignIn, onSignUp, onSignInWithGoogle }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'register' && !username.trim()) {
      setError('ユーザー名を入力してください')
      return
    }
    if (!email.trim()) {
      setError('メールアドレスを入力してください')
      return
    }
    if (!password) {
      setError('パスワードを入力してください')
      return
    }
    if (mode === 'register') {
      if (password.length < 8) {
        setError('パスワードは8文字以上で入力してください')
        return
      }
      if (password !== confirmPassword) {
        setError('パスワードが一致しません')
        return
      }
    }

    setLoading(true)
    if (mode === 'login') {
      const err = await onSignIn(email.trim(), password)
      setLoading(false)
      if (err) {
        setError(err)
      } else {
        onClose()
      }
    } else {
      const err = await onSignUp(username.trim(), email.trim(), password)
      setLoading(false)
      if (err) {
        setError(err)
      } else {
        onClose()
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null) }}
          >
            ログイン
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(null) }}
          >
            新規登録
          </button>
        </div>

        <div className="auth-oauth">
          <button
            type="button"
            className="btn btn-secondary auth-google-btn"
            onClick={async () => {
              setLoading(true)
              const err = await onSignInWithGoogle()
              setLoading(false)
              if (err) setError(err)
            }}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Googleでログイン
          </button>
        </div>

        <div className="auth-divider">または</div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="username">ユーザー名 <span className="field-note">（他のユーザーに表示されます）</span></label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="表示名を入力"
                autoComplete="username"
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '8文字以上' : 'パスワードを入力'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirm-password">パスワード（確認）</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワードを再入力"
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録'}
          </button>
        </form>

        <button className="auth-close-btn" onClick={onClose} aria-label="閉じる">
          ✕
        </button>
      </div>
    </div>
  )
}

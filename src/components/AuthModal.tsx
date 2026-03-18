import React, { useState } from 'react'
import './AuthModal.css'

interface AuthModalProps {
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<string | null>
  onSignUp: (username: string, email: string, password: string) => Promise<string | null>
  onSignInAsGuest: () => Promise<string | null>
}

type AuthMode = 'login' | 'register'

export default function AuthModal({ onClose, onSignIn, onSignUp, onSignInAsGuest }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

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
        setInfo('確認メールを送信しました。メールのリンクをクリックしてからログインしてください。')
        setMode('login')
        setPassword('')
        setConfirmPassword('')
      }
    }
  }

  const handleGuest = async () => {
    setLoading(true)
    const err = await onSignInAsGuest()
    setLoading(false)
    if (err) {
      setError(err)
    } else {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); setInfo(null) }}
          >
            ログイン
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(null); setInfo(null) }}
          >
            新規登録
          </button>
        </div>

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
          {info && <p className="info-msg">{info}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録'}
          </button>
        </form>

        <div className="auth-divider">
          <span>または</span>
        </div>

        <button
          className="btn btn-ghost auth-guest-btn"
          onClick={handleGuest}
          disabled={loading}
        >
          ゲスト閲覧
        </button>

        <button className="auth-close-btn" onClick={onClose} aria-label="閉じる">
          ✕
        </button>
      </div>
    </div>
  )
}

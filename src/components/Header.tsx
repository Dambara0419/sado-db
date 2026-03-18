import React from 'react'
import './Header.css'
import { Page } from '../lib/types'
import { User } from '@supabase/supabase-js'

interface HeaderProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  user: User | null
  username: string | null
  isAdmin: boolean
  isGuest: boolean
  onShowAuth: () => void
  onSignOut: () => void
}

export default function Header({
  currentPage,
  onNavigate,
  user,
  username,
  isAdmin,
  isGuest,
  onShowAuth,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo" onClick={() => onNavigate('feed')}>
          <span className="header-logo-icon">茶</span>
          <span className="header-logo-text">茶道具管理</span>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-btn ${currentPage === 'feed' ? 'active' : ''}`}
            onClick={() => onNavigate('feed')}
          >
            公開一覧
          </button>
          {user && !isGuest && (
            <button
              className={`nav-btn ${currentPage === 'my-items' ? 'active' : ''}`}
              onClick={() => onNavigate('my-items')}
            >
              マイコレクション
            </button>
          )}
          {isAdmin && (
            <button
              className={`nav-btn ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => onNavigate('admin')}
            >
              管理パネル
            </button>
          )}
        </nav>

        <div className="header-auth">
          {user ? (
            <div className="header-user">
              {isGuest ? (
                <span className="header-username guest">ゲスト</span>
              ) : (
                <span className="header-username">
                  {isAdmin && <span className="admin-badge">管理者</span>}
                  {username}
                </span>
              )}
              <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
                ログアウト
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onShowAuth}>
              ログイン / 登録
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

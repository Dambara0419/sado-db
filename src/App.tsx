import React, { useState } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { Page, Item } from './lib/types'
import Header from './components/Header'
import AuthModal from './components/AuthModal'
import FeedPage from './pages/FeedPage'
import MyItemsPage from './pages/MyItemsPage'
import ItemDetailPage from './pages/ItemDetailPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  const { user, profile, loading, isAdmin, signIn, signUp, signOut } = useAuth()
  const [page, setPage] = useState<Page>('feed')
  const [showAuth, setShowAuth] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [previousPage, setPreviousPage] = useState<Page>('feed')

  const navigate = (target: Page) => {
    if ((target === 'my-items' || target === 'admin') && !user) {
      setShowAuth(true)
      return
    }
    if (target === 'admin' && !isAdmin) return
    setPage(target)
  }

  const handleViewItem = (item: Item) => {
    setSelectedItem(item)
    setPreviousPage(page)
    setPage('item-detail')
  }

  const handleBackFromDetail = () => {
    setSelectedItem(null)
    setPage(previousPage)
  }

  const handleItemDeleted = () => {
    setSelectedItem(null)
    setPage(previousPage)
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-spinner" style={{ flex: 1, justifyContent: 'center' }}>
          読み込み中
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        currentPage={page}
        onNavigate={navigate}
        user={user}
        username={profile?.username ?? null}
        isAdmin={isAdmin}
        onShowAuth={() => setShowAuth(true)}
        onSignOut={signOut}
      />

      <main className="app-main">
        {page === 'feed' && (
          <FeedPage
            userId={user?.id}
            onViewItem={handleViewItem}
            onShowAuth={() => setShowAuth(true)}
          />
        )}

        {page === 'my-items' && user && (
          <MyItemsPage
            userId={user.id}
            username={profile?.username ?? ''}
            onViewItem={handleViewItem}
          />
        )}

        {page === 'item-detail' && selectedItem && (
          <ItemDetailPage
            itemId={selectedItem.id}
            userId={user?.id}
            isAdmin={isAdmin}
            onBack={handleBackFromDetail}
            onDeleted={handleItemDeleted}
          />
        )}

        {page === 'admin' && isAdmin && user && (
          <AdminPage
            userId={user.id}
            onViewItem={handleViewItem}
          />
        )}
      </main>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSignIn={signIn}
          onSignUp={(username, email, password) => signUp(username, email, password)}
        />
      )}
    </div>
  )
}

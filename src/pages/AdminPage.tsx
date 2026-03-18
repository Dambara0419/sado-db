import React, { useEffect, useState, useCallback } from 'react'
import './AdminPage.css'
import { supabase } from '../lib/supabase'
import { Item, Profile } from '../lib/types'
import { useItems, ItemFormData } from '../hooks/useItems'
import ItemForm from '../components/ItemForm'
import ConfirmDialog from '../components/ConfirmDialog'

interface AdminPageProps {
  userId: string
  onViewItem: (item: Item) => void
}

type AdminTab = 'items' | 'users'

export default function AdminPage({ userId, onViewItem }: AdminPageProps) {
  const { fetchAllItems, updateItem, deleteItem, togglePublic } = useItems(userId)
  const [tab, setTab] = useState<AdminTab>('items')
  const [items, setItems] = useState<Item[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deletingItem, setDeletingItem] = useState<Item | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadItems = useCallback(async () => {
    setLoadingItems(true)
    const data = await fetchAllItems()
    setItems(data)
    setLoadingItems(false)
  }, [fetchAllItems])

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setUsers((data as Profile[]) ?? [])
    } catch {
      setUsers([])
    }
    setLoadingUsers(false)
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    if (tab === 'users') loadUsers()
  }, [tab, loadUsers])

  const handleUpdate = async (data: ItemFormData, newImages: File[], deletedIds: number[]) => {
    if (!editingItem) return
    setFormLoading(true)
    const ok = await updateItem(editingItem.id, data, newImages, deletedIds)
    setFormLoading(false)
    if (ok) {
      setEditingItem(null)
      await loadItems()
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleteLoading(true)
    const ok = await deleteItem(deletingItem.id)
    setDeleteLoading(false)
    if (ok) {
      setDeletingItem(null)
      await loadItems()
    }
  }

  const handleTogglePublic = async (item: Item) => {
    await togglePublic(item.id, !item.is_public)
    await loadItems()
  }

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      (item.author ?? '').toLowerCase().includes(q) ||
      (item.profiles?.username ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-inner">
          <h1>管理パネル</h1>
          <p>全てのアイテムとユーザーを管理します</p>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'items' ? 'active' : ''}`}
            onClick={() => setTab('items')}
          >
            全アイテム ({items.length})
          </button>
          <button
            className={`admin-tab ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            ユーザー一覧
          </button>
        </div>

        {tab === 'items' && (
          <div className="admin-items">
            <div className="admin-toolbar">
              <input
                type="search"
                placeholder="道具名、作者、ユーザー名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search"
              />
              <span className="admin-count">{filteredItems.length}件</span>
            </div>

            {loadingItems ? (
              <div className="loading-spinner">読み込み中</div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>道具名</th>
                      <th>カテゴリ</th>
                      <th>作者</th>
                      <th>所有者</th>
                      <th>公開</th>
                      <th>登録日</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td className="cell-id">{item.id}</td>
                        <td>
                          <button
                            className="item-name-btn"
                            onClick={() => onViewItem(item)}
                          >
                            {item.name}
                          </button>
                        </td>
                        <td>{item.category && <span className="badge badge-category">{item.category}</span>}</td>
                        <td className="cell-secondary">{item.author || '—'}</td>
                        <td className="cell-secondary">{item.profiles?.username ?? '—'}</td>
                        <td>
                          <button
                            className={`toggle-btn ${item.is_public ? 'public' : 'private'}`}
                            onClick={() => handleTogglePublic(item)}
                            title={item.is_public ? '非公開にする' : '公開にする'}
                          >
                            {item.is_public ? '公開' : '非公開'}
                          </button>
                        </td>
                        <td className="cell-secondary">
                          {new Date(item.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => setEditingItem(item)}
                            >
                              編集
                            </button>
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => setDeletingItem(item)}
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredItems.length === 0 && (
                  <div className="empty-state">
                    <h3>アイテムがありません</h3>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="admin-users">
            {loadingUsers ? (
              <div className="loading-spinner">読み込み中</div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ユーザー名</th>
                      <th>ロール</th>
                      <th>登録日</th>
                      <th>ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="user-name-cell">
                          <strong>{user.username}</strong>
                        </td>
                        <td>
                          <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-private'}`}>
                            {user.role === 'admin' ? '管理者' : 'ユーザー'}
                          </span>
                        </td>
                        <td className="cell-secondary">
                          {new Date(user.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="cell-id cell-secondary">{user.id.slice(0, 8)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="empty-state">
                    <h3>ユーザーがいません</h3>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {editingItem && (
        <ItemForm
          item={editingItem}
          onSubmit={handleUpdate}
          onCancel={() => setEditingItem(null)}
          loading={formLoading}
        />
      )}

      {deletingItem && (
        <ConfirmDialog
          title="道具を削除"
          message={`「${deletingItem.name}」を削除しますか？この操作は元に戻せません。`}
          confirmLabel="削除"
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
          loading={deleteLoading}
          danger
        />
      )}
    </div>
  )
}

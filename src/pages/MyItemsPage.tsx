import React, { useEffect, useState, useCallback } from 'react'
import './MyItemsPage.css'
import { Item } from '../lib/types'
import { useItems, ItemFormData } from '../hooks/useItems'
import ItemCard from '../components/ItemCard'
import ItemForm from '../components/ItemForm'
import ConfirmDialog from '../components/ConfirmDialog'

interface MyItemsPageProps {
  userId: string
  username: string
  onViewItem: (item: Item) => void
}

export default function MyItemsPage({ userId, username: _username, onViewItem }: MyItemsPageProps) {
  const { fetchMyItems, createItem, updateItem, deleteItem, exportCSV, loading } = useItems(userId)
  const [items, setItems] = useState<Item[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deletingItem, setDeletingItem] = useState<Item | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filterPublic, setFilterPublic] = useState<'all' | 'public' | 'private'>('all')

  const load = useCallback(async () => {
    const data = await fetchMyItems()
    setItems(data)
  }, [fetchMyItems])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (data: ItemFormData, newImages: File[], _deletedIds: number[]) => {
    setFormLoading(true)
    const result = await createItem(data, newImages)
    setFormLoading(false)
    if (result) {
      setShowForm(false)
      await load()
    }
  }

  const handleUpdate = async (data: ItemFormData, newImages: File[], deletedIds: number[]) => {
    if (!editingItem) return
    setFormLoading(true)
    const ok = await updateItem(editingItem.id, data, newImages, deletedIds)
    setFormLoading(false)
    if (ok) {
      setEditingItem(null)
      await load()
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleteLoading(true)
    const ok = await deleteItem(deletingItem.id)
    setDeleteLoading(false)
    if (ok) {
      setDeletingItem(null)
      await load()
    }
  }

  const filteredItems = items.filter((item) => {
    if (filterPublic === 'public') return item.is_public
    if (filterPublic === 'private') return !item.is_public
    return true
  })

  return (
    <div className="my-items-page">
      <div className="my-items-header">
        <div className="my-items-header-inner">
          <h1>マイコレクション</h1>
          <p>あなたの茶道具を管理する</p>
        </div>
      </div>

      <div className="my-items-content">
        <div className="my-items-toolbar">
          <div className="my-items-filters">
            <button
              className={`filter-btn ${filterPublic === 'all' ? 'active' : ''}`}
              onClick={() => setFilterPublic('all')}
            >
              すべて ({items.length})
            </button>
            <button
              className={`filter-btn ${filterPublic === 'public' ? 'active' : ''}`}
              onClick={() => setFilterPublic('public')}
            >
              公開 ({items.filter((i) => i.is_public).length})
            </button>
            <button
              className={`filter-btn ${filterPublic === 'private' ? 'active' : ''}`}
              onClick={() => setFilterPublic('private')}
            >
              非公開 ({items.filter((i) => !i.is_public).length})
            </button>
          </div>

          <div className="my-items-actions">
            <button className="btn btn-ghost" onClick={exportCSV} disabled={items.length === 0}>
              CSVエクスポート
            </button>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + 道具を追加
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">読み込み中</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>道具がありません</h3>
            <p>
              {filterPublic !== 'all'
                ? 'この条件に合う道具がありません'
                : '「道具を追加」ボタンから最初の道具を登録してみましょう'}
            </p>
          </div>
        ) : (
          <div className="my-items-grid">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                showOwner={false}
                onView={onViewItem}
                onEdit={(i) => setEditingItem(i)}
                onDelete={(i) => setDeletingItem(i)}
                isOwner
              />
            ))}
          </div>
        )}
      </div>

      {(showForm || editingItem) && (
        <ItemForm
          item={editingItem}
          onSubmit={editingItem ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false)
            setEditingItem(null)
          }}
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

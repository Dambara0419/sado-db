import React, { useEffect, useState, useCallback } from 'react'
import './ItemDetailPage.css'
import { Item } from '../lib/types'
import { useItems, ItemFormData } from '../hooks/useItems'
import ItemForm from '../components/ItemForm'
import ConfirmDialog from '../components/ConfirmDialog'

interface ItemDetailPageProps {
  itemId: number
  userId: string | null | undefined
  isAdmin: boolean
  onBack: () => void
  onDeleted: () => void
}

export default function ItemDetailPage({
  itemId,
  userId,
  isAdmin,
  onBack,
  onDeleted,
}: ItemDetailPageProps) {
  const { fetchItem, updateItem, deleteItem } = useItems(userId)
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchItem(itemId)
    setItem(data)
    setLoading(false)
  }, [fetchItem, itemId])

  useEffect(() => {
    load()
  }, [load])

  const sortedImages = item
    ? [...(item.item_images ?? [])].sort((a, b) => a.order - b.order)
    : []

  const isOwner = userId && item && item.user_id === userId
  const canEdit = isOwner || isAdmin

  const handleUpdate = async (data: ItemFormData, newImages: File[], deletedIds: number[]) => {
    if (!item) return
    setFormLoading(true)
    const ok = await updateItem(item.id, data, newImages, deletedIds)
    setFormLoading(false)
    if (ok) {
      setShowEdit(false)
      await load()
    }
  }

  const handleDelete = async () => {
    if (!item) return
    setDeleteLoading(true)
    const ok = await deleteItem(item.id)
    setDeleteLoading(false)
    if (ok) {
      onDeleted()
    }
  }

  if (loading) {
    return (
      <div className="item-detail-page">
        <div className="loading-spinner">読み込み中</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="item-detail-page">
        <div className="item-detail-content">
          <div className="empty-state">
            <h3>道具が見つかりません</h3>
            <p>削除されたか、アクセス権限がない可能性があります</p>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="item-detail-page">
      <div className="item-detail-content">
        <button className="back-btn" onClick={onBack}>
          ← 戻る
        </button>

        <div className="item-detail-layout">
          {/* Image section */}
          <div className="item-detail-images">
            {sortedImages.length > 0 ? (
              <>
                <div className="item-detail-main-image">
                  <img
                    src={sortedImages[currentImageIndex].image_url}
                    alt={item.name}
                  />
                  {!item.is_public && (
                    <span className="detail-private-badge">非公開</span>
                  )}
                </div>
                {sortedImages.length > 1 && (
                  <div className="item-detail-thumbs">
                    {sortedImages.map((img, i) => (
                      <button
                        key={img.storage_path}
                        className={`thumb-btn ${i === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(i)}
                      >
                        <img src={img.image_url} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="item-detail-no-image">
                <span>画像なし</span>
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="item-detail-info">
            <div className="item-detail-header">
              {item.category && (
                <span className="badge badge-category">{item.category}</span>
              )}
              <span className={`badge ${item.is_public ? 'badge-public' : 'badge-private'}`}>
                {item.is_public ? '公開' : '非公開'}
              </span>
            </div>

            <h1 className="item-detail-name">{item.name}</h1>

            <dl className="item-detail-meta">
              {item.author && (
                <>
                  <dt>作者</dt>
                  <dd>{item.author}</dd>
                </>
              )}
              {item.kiln && (
                <>
                  <dt>窯元</dt>
                  <dd>{item.kiln}</dd>
                </>
              )}
              <dt>登録者</dt>
              <dd className="item-owner">{item.profiles?.username ?? '不明'}</dd>
              <dt>登録日</dt>
              <dd>{new Date(item.created_at).toLocaleDateString('ja-JP')}</dd>
            </dl>

            {item.description && (
              <div className="item-detail-description">
                <h3>説明</h3>
                <p>{item.description}</p>
              </div>
            )}

            {canEdit && (
              <div className="item-detail-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowEdit(true)}
                >
                  編集
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => setShowDelete(true)}
                >
                  削除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <ItemForm
          item={item}
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
          loading={formLoading}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          title="道具を削除"
          message={`「${item.name}」を削除しますか？この操作は元に戻せません。`}
          confirmLabel="削除"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleteLoading}
          danger
        />
      )}
    </div>
  )
}

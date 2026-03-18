import React from 'react'
import './ItemCard.css'
import { Item } from '../lib/types'

interface ItemCardProps {
  item: Item
  showOwner?: boolean
  onView: (item: Item) => void
  onEdit?: (item: Item) => void
  onDelete?: (item: Item) => void
  isOwner?: boolean
  isAdmin?: boolean
}

export default function ItemCard({
  item,
  showOwner = false,
  onView,
  onEdit,
  onDelete,
  isOwner = false,
  isAdmin = false,
}: ItemCardProps) {
  const sortedImages = [...(item.item_images ?? [])].sort((a, b) => a.order - b.order)
  const firstImage = sortedImages[0]
  const canEdit = isOwner || isAdmin

  return (
    <div className="item-card" onClick={() => onView(item)}>
      <div className="item-card-image">
        {firstImage ? (
          <img src={firstImage.image_url} alt={item.name} loading="lazy" />
        ) : (
          <div className="item-card-no-image">
            <span>画像なし</span>
          </div>
        )}
        {!item.is_public && (
          <span className="item-card-private-badge">非公開</span>
        )}
      </div>

      <div className="item-card-body">
        {item.category && (
          <span className="badge badge-category item-card-category">{item.category}</span>
        )}
        <h3 className="item-card-name">{item.name}</h3>
        {item.author && (
          <p className="item-card-author">作者：{item.author}</p>
        )}
        {item.kiln && (
          <p className="item-card-kiln">窯元：{item.kiln}</p>
        )}
        {item.description && (
          <p className="item-card-description">{item.description}</p>
        )}

        {showOwner && (
          <div className="item-card-owner">
            <span className="owner-separator" />
            <span className="owner-label">by {item.profiles?.username ?? '不明'}</span>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="item-card-actions" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onEdit(item)}
            >
              編集
            </button>
          )}
          {onDelete && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(item)}
            >
              削除
            </button>
          )}
        </div>
      )}
    </div>
  )
}

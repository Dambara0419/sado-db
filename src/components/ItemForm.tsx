import React, { useState, useEffect } from 'react'
import './ItemForm.css'
import { Item, ItemImage, CATEGORIES } from '../lib/types'
import { ItemFormData } from '../hooks/useItems'
import ImageUpload from './ImageUpload'

interface ItemFormProps {
  item?: Item | null
  onSubmit: (data: ItemFormData, newImages: File[], deletedImageIds: number[]) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function ItemForm({ item, onSubmit, onCancel, loading }: ItemFormProps) {
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    author: '',
    kiln: '',
    category: '',
    description: '',
    is_public: true,
  })
  const [newImages, setNewImages] = useState<File[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  const existingImages: ItemImage[] = item?.item_images
    ? [...item.item_images].sort((a, b) => a.order - b.order)
    : []

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        author: item.author ?? '',
        kiln: item.kiln ?? '',
        category: item.category ?? '',
        description: item.description ?? '',
        is_public: item.is_public,
      })
    }
  }, [item])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, is_public: e.target.checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!formData.name.trim()) {
      setError('道具名は必須です')
      return
    }
    await onSubmit(
      { ...formData, name: formData.name.trim() },
      newImages,
      deletedImageIds
    )
  }

  const handleAddFiles = (files: File[]) => {
    const activeExistingCount = existingImages.filter(
      (img) => !deletedImageIds.includes(img.id)
    ).length
    const totalCurrent = activeExistingCount + newImages.length
    const remaining = 5 - totalCurrent
    setNewImages((prev) => [...prev, ...files.slice(0, remaining)])
  }

  const handleDeleteExisting = (id: number) => {
    setDeletedImageIds((prev) => [...prev, id])
  }

  const handleDeleteNew = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const isEditing = !!item

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal item-form-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? '道具を編集' : '道具を追加'}</h2>

        <form onSubmit={handleSubmit} className="item-form">
          <div className="form-group">
            <label htmlFor="name">道具名 <span className="required">*</span></label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="例：志野茶碗"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">カテゴリ</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">選択してください</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="author">作者</label>
              <input
                id="author"
                name="author"
                type="text"
                value={formData.author}
                onChange={handleChange}
                placeholder="例：本阿弥光悦"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="kiln">窯元</label>
            <input
              id="kiln"
              name="kiln"
              type="text"
              value={formData.kiln}
              onChange={handleChange}
              placeholder="例：楽焼"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">説明</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="道具についての詳細、来歴、特徴など"
              rows={4}
              disabled={loading}
            />
          </div>

          <ImageUpload
            existingImages={existingImages}
            newFiles={newImages}
            deletedImageIds={deletedImageIds}
            onAddFiles={handleAddFiles}
            onDeleteExisting={handleDeleteExisting}
            onDeleteNew={handleDeleteNew}
          />

          <div className="checkbox-group">
            <input
              id="is_public"
              type="checkbox"
              checked={formData.is_public}
              onChange={handleCheckbox}
              disabled={loading}
            />
            <label htmlFor="is_public">公開する（公開一覧に表示されます）</label>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="item-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

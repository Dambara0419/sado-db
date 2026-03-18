import React, { useRef } from 'react'
import './ImageUpload.css'
import { ItemImage } from '../lib/types'

interface ImageUploadProps {
  existingImages: ItemImage[]
  newFiles: File[]
  deletedImageIds: number[]
  onAddFiles: (files: File[]) => void
  onDeleteExisting: (id: number) => void
  onDeleteNew: (index: number) => void
}

const MAX_IMAGES = 5

export default function ImageUpload({
  existingImages,
  newFiles,
  deletedImageIds,
  onAddFiles,
  onDeleteExisting,
  onDeleteNew,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const activeExisting = existingImages.filter((img) => !deletedImageIds.includes(img.id))
  const totalCount = activeExisting.length + newFiles.length
  const remaining = MAX_IMAGES - totalCount

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const allowed = files.slice(0, remaining)
    onAddFiles(allowed)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    const allowed = files.slice(0, remaining)
    onAddFiles(allowed)
  }

  return (
    <div className="image-upload">
      <div className="image-upload-label">
        画像（最大{MAX_IMAGES}枚）
        <span className="image-count-hint">{totalCount} / {MAX_IMAGES}</span>
      </div>

      <div className="image-preview-grid">
        {activeExisting.map((img) => (
          <div key={img.id} className="image-preview-item">
            <img src={img.image_url} alt="" />
            <button
              type="button"
              className="image-delete-btn"
              onClick={() => onDeleteExisting(img.id)}
              aria-label="画像を削除"
            >
              ✕
            </button>
          </div>
        ))}

        {newFiles.map((file, i) => (
          <div key={`new-${i}`} className="image-preview-item new">
            <img src={URL.createObjectURL(file)} alt="" />
            <button
              type="button"
              className="image-delete-btn"
              onClick={() => onDeleteNew(i)}
              aria-label="画像を削除"
            >
              ✕
            </button>
            <span className="image-new-badge">新規</span>
          </div>
        ))}

        {remaining > 0 && (
          <div
            className="image-upload-zone"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <span className="upload-icon">+</span>
            <span className="upload-hint">追加</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <p className="image-upload-note">
        JPG / PNG / WebP 対応。ドラッグ＆ドロップも可能。
      </p>
    </div>
  )
}

import React, { useEffect, useState, useCallback } from 'react'
import './FeedPage.css'
import { Item } from '../lib/types'
import { useItems } from '../hooks/useItems'
import ItemCard from '../components/ItemCard'

interface FeedPageProps {
  userId: string | null | undefined
  onViewItem: (item: Item) => void
  onShowAuth: () => void
}

export default function FeedPage({ userId, onViewItem, onShowAuth }: FeedPageProps) {
  const { fetchPublicItems, loading } = useItems(userId)
  const [items, setItems] = useState<Item[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const load = useCallback(async () => {
    const data = await fetchPublicItems()
    setItems(data)
  }, [fetchPublicItems])

  useEffect(() => {
    load()
  }, [load])

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase()
    const matchQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.author ?? '').toLowerCase().includes(q) ||
      (item.kiln ?? '').toLowerCase().includes(q) ||
      (item.description ?? '').toLowerCase().includes(q)
    const matchCategory = !selectedCategory || item.category === selectedCategory
    return matchQuery && matchCategory
  })

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)))

  return (
    <div className="feed-page">
      <div className="feed-hero">
        <div className="feed-hero-inner">
          <h1>茶道具コレクション</h1>
          <p>みんなの茶道具を探す・共有する</p>
          {!userId && (
            <button className="btn btn-primary hero-auth-btn" onClick={onShowAuth}>
              コレクションを登録する
            </button>
          )}
        </div>
      </div>

      <div className="feed-content">
        <div className="feed-filters">
          <input
            type="search"
            className="feed-search"
            placeholder="道具名、作者、窯元で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="feed-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">すべてのカテゴリ</option>
            {categories.map((cat) => (
              <option key={cat} value={cat ?? ''}>{cat}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-spinner">読み込み中</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>道具が見つかりません</h3>
            <p>
              {searchQuery || selectedCategory
                ? '検索条件に合う道具がありません'
                : 'まだ公開されている道具がありません。最初に登録してみましょう！'}
            </p>
          </div>
        ) : (
          <>
            <p className="feed-count">{filteredItems.length}件の道具</p>
            <div className="feed-grid">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  showOwner
                  onView={onViewItem}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export interface Profile {
  id: string
  username: string
  role: 'user' | 'admin'
  created_at: string
}

export interface ItemImage {
  id: number
  item_id: number
  image_url: string
  storage_path: string
  order: number
  created_at: string
}

export interface Item {
  id: number
  user_id: string
  name: string
  author: string | null
  kiln: string | null
  category: string | null
  description: string | null
  is_public: boolean
  created_at: string
  profiles?: { username: string } | null
  item_images?: ItemImage[]
}

export type Page = 'feed' | 'my-items' | 'item-detail' | 'admin'

export const CATEGORIES = [
  '茶碗',
  '茶入',
  '薄器',
  '茶杓',
  '茶筅',
  '茶巾',
  '釜',
  '風炉',
  '水指',
  '蓋置',
  '建水',
  '棚',
  '花入',
  '掛物',
  'その他',
] as const

export type Category = typeof CATEGORIES[number]

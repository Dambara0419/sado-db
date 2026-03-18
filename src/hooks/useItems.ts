import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Item } from '../lib/types'

export interface ItemFormData {
  name: string
  author: string
  kiln: string
  category: string
  description: string
  is_public: boolean
}

export function useItems(userId: string | null | undefined) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPublicItems = useCallback(async (): Promise<Item[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('items')
        .select('*, profiles(username), item_images(*)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      if (err) throw err
      return (data as Item[]) ?? []
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '取得に失敗しました'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMyItems = useCallback(async (): Promise<Item[]> => {
    if (!userId) return []
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('items')
        .select('*, item_images(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (err) throw err
      return (data as Item[]) ?? []
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '取得に失敗しました'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [userId])

  const fetchAllItems = useCallback(async (): Promise<Item[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('items')
        .select('*, profiles(username), item_images(*)')
        .order('created_at', { ascending: false })
      if (err) throw err
      return (data as Item[]) ?? []
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '取得に失敗しました'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchItem = useCallback(async (id: number): Promise<Item | null> => {
    try {
      const { data, error: err } = await supabase
        .from('items')
        .select('*, profiles(username), item_images(*)')
        .eq('id', id)
        .single()
      if (err || !data) return null
      return data as Item
    } catch {
      return null
    }
  }, [])

  const createItem = async (
    formData: ItemFormData,
    imageFiles: File[],
  ): Promise<{ id: number } | null> => {
    if (!userId) return null
    setLoading(true)
    setError(null)
    try {
      const { data: itemData, error: itemErr } = await supabase
        .from('items')
        .insert({
          user_id: userId,
          name: formData.name,
          author: formData.author || null,
          kiln: formData.kiln || null,
          category: formData.category || null,
          description: formData.description || null,
          is_public: formData.is_public,
        })
        .select('id')
        .single()
      if (itemErr || !itemData) throw itemErr ?? new Error('作成に失敗しました')

      const itemId = itemData.id as number

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        const path = `items/${userId}/${itemId}/${Date.now()}_${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('item-images')
          .upload(path, file)
        if (uploadErr) continue
        const { data: urlData } = supabase.storage.from('item-images').getPublicUrl(path)
        await supabase.from('item_images').insert({
          item_id: itemId,
          image_url: urlData.publicUrl,
          storage_path: path,
          order: i,
        })
      }

      return { id: itemId }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '作成に失敗しました'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (
    id: number,
    formData: ItemFormData,
    newImageFiles: File[],
    deletedImageIds: number[]
  ): Promise<boolean> => {
    if (!userId) return false
    setLoading(true)
    setError(null)
    try {
      // Delete removed images
      if (deletedImageIds.length > 0) {
        const { data: toDelete } = await supabase
          .from('item_images')
          .select('storage_path')
          .in('id', deletedImageIds)
        if (toDelete) {
          for (const row of toDelete) {
            await supabase.storage.from('item-images').remove([row.storage_path])
          }
        }
        await supabase.from('item_images').delete().in('id', deletedImageIds)
      }

      // Get current max order
      const { data: existingImages } = await supabase
        .from('item_images')
        .select('order')
        .eq('item_id', id)
        .order('order', { ascending: false })
        .limit(1)
      const startOrder = existingImages && existingImages.length > 0
        ? (existingImages[0].order as number) + 1
        : 0

      // Upload new images
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i]
        const path = `items/${userId}/${id}/${Date.now()}_${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('item-images')
          .upload(path, file)
        if (uploadErr) continue
        const { data: urlData } = supabase.storage.from('item-images').getPublicUrl(path)
        await supabase.from('item_images').insert({
          item_id: id,
          image_url: urlData.publicUrl,
          storage_path: path,
          order: startOrder + i,
        })
      }

      const { error: updateErr } = await supabase
        .from('items')
        .update({
          name: formData.name,
          author: formData.author || null,
          kiln: formData.kiln || null,
          category: formData.category || null,
          description: formData.description || null,
          is_public: formData.is_public,
        })
        .eq('id', id)
      if (updateErr) throw updateErr

      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '更新に失敗しました'
      setError(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id: number): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { data: images } = await supabase
        .from('item_images')
        .select('storage_path')
        .eq('item_id', id)
      if (images) {
        for (const img of images) {
          await supabase.storage.from('item-images').remove([img.storage_path])
        }
      }
      const { error: deleteErr } = await supabase.from('items').delete().eq('id', id)
      if (deleteErr) throw deleteErr
      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '削除に失敗しました'
      setError(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  const togglePublic = async (id: number, is_public: boolean): Promise<boolean> => {
    try {
      const { error: err } = await supabase
        .from('items')
        .update({ is_public })
        .eq('id', id)
      if (err) throw err
      return true
    } catch {
      return false
    }
  }

  const exportCSV = async () => {
    if (!userId) return
    try {
      const { data, error: err } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (err || !data) return

      const items = data as Item[]
      const headers = ['id', 'name', 'author', 'kiln', 'category', 'description', 'is_public', 'created_at']
      const rows = items.map((item) =>
        [
          String(item.id),
          item.name,
          item.author ?? '',
          item.kiln ?? '',
          item.category ?? '',
          item.description ?? '',
          String(item.is_public),
          item.created_at,
        ].map((val) => {
          const str = val ?? ''
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }).join(',')
      )
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-items-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Silent fail for CSV export
    }
  }

  return {
    loading,
    error,
    fetchPublicItems,
    fetchMyItems,
    fetchAllItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    togglePublic,
    exportCSV,
  }
}

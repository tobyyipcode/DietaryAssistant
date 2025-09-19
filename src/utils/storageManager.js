/**
 * 存儲空間管理工具
 * 自動清理舊圖片，節省 Supabase 空間
 */
import { supabase } from '@/lib/supabase'

/**
 * 清理策略配置
 */
const CLEANUP_STRATEGIES = {
  // 保留最近 30 天的圖片
  RECENT_DAYS: {
    days: 30,
    description: '保留最近 30 天的圖片'
  },
  
  // 每個用戶最多保留 100 張圖片
  MAX_IMAGES_PER_USER: {
    maxImages: 100,
    description: '每個用戶最多保留 100 張圖片'
  },
  
  // 總存儲不超過 500MB（Supabase 免費限制）
  STORAGE_LIMIT: {
    maxSizeMB: 400, // 保留一些緩衝空間
    description: '總存儲不超過 400MB'
  }
}

/**
 * 獲取圖片存儲路徑
 */
function getImageStoragePath(meal) {
  // 優先使用 image_path，如果沒有則從 image_url 提取
  if (meal.image_path) {
    return meal.image_path
  }
  
  return extractStoragePathFromUrl(meal.image_url)
}
function extractStoragePathFromUrl(imageUrl) {
  if (!imageUrl) return null
  
  // 如果是 base64 或其他格式，返回 null
  if (!imageUrl.startsWith('http')) return null
  
  try {
    // Supabase storage URL 格式: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    
    // 找到 bucket 之後的路徑
    const bucketIndex = pathParts.findIndex(part => part === 'food-images')
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/')
    }
  } catch (error) {
    console.warn('無法從 URL 提取路徑:', imageUrl, error)
  }
  
  return null
}
async function getUserMeals(userId) {
  const { data, error } = await supabase
    .from('meals')
    .select('id, image_url, image_path, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    throw new Error(`獲取餐點記錄失敗: ${error.message}`)
  }
  
  return data || []
}

/**
 * 刪除存儲中的圖片
 */
async function deleteStorageImage(imagePath) {
  const { error } = await supabase.storage
    .from('food-images')
    .remove([imagePath])
  
  if (error) {
    console.warn(`刪除圖片失敗: ${imagePath}`, error)
    return false
  }
  
  return true
}

/**
 * 刪除數據庫中的餐點記錄
 */
async function deleteMealRecord(mealId) {
  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', mealId)
  
  if (error) {
    console.warn(`刪除餐點記錄失敗: ${mealId}`, error)
    return false
  }
  
  return true
}

/**
 * 根據時間清理舊圖片
 */
export async function cleanupOldImages(userId, days = CLEANUP_STRATEGIES.RECENT_DAYS.days) {
  try {
    const meals = await getUserMeals(userId)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const oldMeals = meals.filter(meal => {
      const imagePath = getImageStoragePath(meal)
      return new Date(meal.created_at) < cutoffDate && imagePath
    })
    
    console.log(`發現 ${oldMeals.length} 張超過 ${days} 天的圖片需要清理`)
    
    const results = {
      deleted: 0,
      failed: 0,
      spaceSaved: 0
    }
    
    for (const meal of oldMeals) {
      const imagePath = getImageStoragePath(meal)
      if (!imagePath) {
        console.warn(`無法提取圖片路徑: ${meal.image_url}`)
        results.failed++
        continue
      }
      
      // 刪除存儲中的圖片
      const storageDeleted = await deleteStorageImage(imagePath)
      
      if (storageDeleted) {
        // 刪除數據庫記錄
        const recordDeleted = await deleteMealRecord(meal.id)
        
        if (recordDeleted) {
          results.deleted++
          console.log(`已清理: ${imagePath}`)
        } else {
          results.failed++
        }
      } else {
        results.failed++
      }
      
      // 避免過於頻繁的請求
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  } catch (error) {
    console.error('清理舊圖片失敗:', error)
    throw error
  }
}

/**
 * 根據數量限制清理圖片
 */
export async function cleanupExcessImages(userId, maxImages = CLEANUP_STRATEGIES.MAX_IMAGES_PER_USER.maxImages) {
  try {
    const meals = await getUserMeals(userId)
    
    if (meals.length <= maxImages) {
      console.log(`圖片數量 (${meals.length}) 未超過限制 (${maxImages})，無需清理`)
      return { deleted: 0, failed: 0 }
    }
    
    // 保留最新的 maxImages 張，刪除其餘的
    const mealsToDelete = meals.slice(maxImages).filter(meal => {
      const imagePath = getImageStoragePath(meal)
      return imagePath !== null
    })
    
    console.log(`需要清理 ${mealsToDelete.length} 張超出限制的圖片`)
    
    const results = {
      deleted: 0,
      failed: 0
    }
    
    for (const meal of mealsToDelete) {
      const imagePath = getImageStoragePath(meal)
      if (!imagePath) {
        console.warn(`無法提取圖片路徑: ${meal.image_url}`)
        results.failed++
        continue
      }
      
      const storageDeleted = await deleteStorageImage(imagePath)
      
      if (storageDeleted) {
        const recordDeleted = await deleteMealRecord(meal.id)
        
        if (recordDeleted) {
          results.deleted++
          console.log(`已清理: ${imagePath}`)
        } else {
          results.failed++
        }
      } else {
        results.failed++
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  } catch (error) {
    console.error('清理超量圖片失敗:', error)
    throw error
  }
}

/**
 * 獲取存儲使用情況
 */
export async function getStorageUsage() {
  try {
    // 注意：Supabase 沒有直接的 API 獲取總使用量
    // 這裡我們估算用戶的使用量
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用戶未登入')
    
    const meals = await getUserMeals(user.id)
    
    return {
      totalImages: meals.length,
      estimatedSizeMB: meals.length * 0.5, // 估計每張圖片 0.5MB
      maxAllowedMB: CLEANUP_STRATEGIES.STORAGE_LIMIT.maxSizeMB
    }
  } catch (error) {
    console.error('獲取存儲使用情況失敗:', error)
    return {
      totalImages: 0,
      estimatedSizeMB: 0,
      maxAllowedMB: CLEANUP_STRATEGIES.STORAGE_LIMIT.maxSizeMB
    }
  }
}

/**
 * 智能清理 - 根據多個策略自動清理
 */
export async function smartCleanup(userId) {
  console.log('開始智能清理...')
  
  const results = {
    oldImagesDeleted: 0,
    excessImagesDeleted: 0,
    totalDeleted: 0,
    errors: []
  }
  
  try {
    // 1. 清理超過 30 天的圖片
    const oldCleanup = await cleanupOldImages(userId, 30)
    results.oldImagesDeleted = oldCleanup.deleted
    results.totalDeleted += oldCleanup.deleted
    
    // 2. 清理超量圖片（保留最新 100 張）
    const excessCleanup = await cleanupExcessImages(userId, 100)
    results.excessImagesDeleted = excessCleanup.deleted
    results.totalDeleted += excessCleanup.deleted
    
    console.log(`智能清理完成：共刪除 ${results.totalDeleted} 張圖片`)
    
  } catch (error) {
    results.errors.push(error.message)
    console.error('智能清理失敗:', error)
  }
  
  return results
}

/**
 * 設置自動清理（在用戶登入時執行）
 */
export async function setupAutoCleanup() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  // 檢查上次清理時間
  const lastCleanup = localStorage.getItem(`lastCleanup_${user.id}`)
  const now = new Date().getTime()
  const oneDayMs = 24 * 60 * 60 * 1000
  
  if (!lastCleanup || (now - parseInt(lastCleanup)) > oneDayMs) {
    // 超過一天沒清理，執行自動清理
    console.log('執行每日自動清理...')
    await smartCleanup(user.id)
    localStorage.setItem(`lastCleanup_${user.id}`, now.toString())
  }
}

export { CLEANUP_STRATEGIES }

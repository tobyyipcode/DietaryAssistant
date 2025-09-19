/**
 * 圖片 URL 工具函數
 * 用於驗證和清理圖片 URL
 */

/**
 * 檢查 URL 是否有效（非 blob URL）
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false
  }
  
  // 排除 blob URL
  if (url.startsWith('blob:')) {
    return false
  }
  
  // 排除 data URL（base64）在這個上下文中
  if (url.startsWith('data:')) {
    return false
  }
  
  // 確保是 HTTP/HTTPS URL
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * 獲取有效的顯示 URL
 * 如果 URL 無效，返回空字符串
 */
export function getValidDisplayUrl(imageUrl) {
  return isValidImageUrl(imageUrl) ? imageUrl : ''
}

/**
 * 清理 blob URL（用於組件 unmount 時）
 */
export function cleanupBlobUrl(url) {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url)
    } catch (error) {
      console.warn('清理 blob URL 失敗:', error)
    }
  }
}

/**
 * 創建安全的圖片預覽 URL
 */
export function createSafePreviewUrl(file) {
  if (!file || !(file instanceof File)) {
    return ''
  }
  
  try {
    return URL.createObjectURL(file)
  } catch (error) {
    console.error('創建預覽 URL 失敗:', error)
    return ''
  }
}
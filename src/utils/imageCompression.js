/**
 * 圖片壓縮工具
 * 節省 Supabase 存儲空間
 */

/**
 * 檢測瀏覽器是否支持 WebP 格式
 */
function supportsWebP() {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  ctx.fillRect(0, 0, 1, 1)
  
  try {
    // 嘗試轉換為 WebP
    const dataURL = canvas.toDataURL('image/webp')
    return dataURL.indexOf('data:image/webp') === 0
  } catch (e) {
    return false
  }
}

/**
 * 壓縮圖片文件
 * @param {File} file - 原始圖片文件
 * @param {Object} options - 壓縮選項
 * @returns {Promise<File>} 壓縮後的圖片文件
 */
export async function compressImage(file, options = {}) {
  const defaultOptions = {
    maxWidth: 800,        // 最大寬度
    maxHeight: 600,       // 最大高度
    quality: 0.8,         // 壓縮質量 (0.1-1.0)
    format: supportsWebP() ? 'webp' : 'jpeg'  // 自動選擇最佳格式
  }
  
  const config = { ...defaultOptions, ...options }
  
  return new Promise((resolve, reject) => {
    // 創建 canvas 元素
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 計算新的尺寸（保持比例）
      const { width, height } = calculateNewDimensions(
        img.width, 
        img.height, 
        config.maxWidth, 
        config.maxHeight
      )
      
      // 設置 canvas 尺寸
      canvas.width = width
      canvas.height = height
      
      // 繪製壓縮後的圖片
      ctx.drawImage(img, 0, 0, width, height)
      
      // 轉換為 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // 創建新的 File 對象
            const compressedFile = new File(
              [blob], 
              getCompressedFileName(file.name, config.format),
              { 
                type: `image/${config.format}`,
                lastModified: Date.now()
              }
            )
            resolve(compressedFile)
          } else {
            reject(new Error('圖片壓縮失敗'))
          }
        },
        `image/${config.format}`,
        config.quality
      )
    }
    
    img.onerror = () => {
      reject(new Error('圖片載入失敗'))
    }
    
    // 載入圖片
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 計算新的圖片尺寸（保持比例）
 */
function calculateNewDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  let { width, height } = { width: originalWidth, height: originalHeight }
  
  // 如果超過最大寬度
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  
  // 如果超過最大高度
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }
  
  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * 生成壓縮後的文件名
 */
function getCompressedFileName(originalName, format) {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  return `${nameWithoutExt}_compressed.${format}`
}

/**
 * 獲取文件大小信息
 */
export function getFileSizeInfo(file) {
  const sizeInMB = (file.size / 1024 / 1024).toFixed(2)
  return {
    bytes: file.size,
    mb: sizeInMB,
    formatted: `${sizeInMB} MB`
  }
}

/**
 * 檢查是否需要壓縮
 */
export function shouldCompress(file, maxSizeMB = 1) {
  const sizeInMB = file.size / 1024 / 1024
  return sizeInMB > maxSizeMB
}

/**
 * 智能壓縮 - 根據文件大小自動調整壓縮參數
 */
export async function smartCompress(file) {
  const sizeInMB = file.size / 1024 / 1024
  const useWebP = supportsWebP()
  
  let options = {}
  
  if (sizeInMB > 10) {
    // 超大文件：激進壓縮
    options = {
      maxWidth: 600,
      maxHeight: 450,
      quality: 0.6,
      format: useWebP ? 'webp' : 'jpeg'  // WebP 格式節省更多空間
    }
  } else if (sizeInMB > 5) {
    // 大文件：中等壓縮
    options = {
      maxWidth: 700,
      maxHeight: 525,
      quality: 0.7,
      format: useWebP ? 'webp' : 'jpeg'
    }
  } else if (sizeInMB > 2) {
    // 中等文件：輕度壓縮
    options = {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
      format: useWebP ? 'webp' : 'jpeg'
    }
  } else {
    // 小文件：輕微優化，但仍轉換為 WebP
    options = {
      maxWidth: 1000,
      maxHeight: 800,
      quality: 0.85,
      format: useWebP ? 'webp' : 'jpeg'
    }
    return await compressImage(file, options)
  }
  
  return await compressImage(file, options)
}
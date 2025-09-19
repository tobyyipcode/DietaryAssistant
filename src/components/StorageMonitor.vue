<template>
  <div class="space-y-4">
    <!-- 存儲空間概覽 -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-4">📊 存儲空間使用情況</h3>
      
      <div class="space-y-4">
        <!-- 使用量進度條 -->
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span>已使用空間</span>
            <span>{{ formatSize(storageUsage.estimatedSizeMB) }} / {{ formatSize(storageUsage.maxAllowedMB) }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div 
              class="h-3 rounded-full transition-all duration-500"
              :class="getProgressBarColor()"
              :style="{ width: getUsagePercentage() + '%' }"
            ></div>
          </div>
          <p class="text-xs text-gray-600 mt-1">
            {{ getUsagePercentage().toFixed(1) }}% 已使用
          </p>
        </div>
        
        <!-- 統計信息 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-blue-50 p-3 rounded">
            <p class="text-sm text-blue-600">總圖片數</p>
            <p class="text-xl font-bold text-blue-800">{{ storageUsage.totalImages }}</p>
          </div>
          <div class="bg-green-50 p-3 rounded">
            <p class="text-sm text-green-600">預估可用天數</p>
            <p class="text-xl font-bold text-green-800">{{ getEstimatedDaysLeft() }}</p>
          </div>
        </div>
        
        <!-- 警告信息 -->
        <div v-if="shouldShowWarning()" class="alert-warning">
          <h4 class="font-medium">⚠️ 存儲空間警告</h4>
          <p class="text-sm mt-1">{{ getWarningMessage() }}</p>
          <div class="mt-2 space-x-2">
            <button @click="performCleanup" class="btn-primary" :disabled="cleaning">
              {{ cleaning ? '清理中...' : '立即清理' }}
            </button>
            <button @click="showCleanupDetails = true" class="btn-secondary">
              查看詳情
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 清理操作 -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-4">🧹 空間管理</h3>
      
      <div class="space-y-3">
        <button 
          @click="performCleanup" 
          class="btn-primary w-full"
          :disabled="cleaning"
        >
          {{ cleaning ? '清理中...' : '智能清理（推薦）' }}
        </button>
        
        <div class="grid grid-cols-2 gap-3">
          <button 
            @click="cleanupOldImages" 
            class="btn-secondary"
            :disabled="cleaning"
          >
            清理 30 天前圖片
          </button>
          <button 
            @click="cleanupExcessImages" 
            class="btn-secondary"
            :disabled="cleaning"
          >
            清理超量圖片
          </button>
        </div>
        
        <button @click="refreshUsage" class="btn-secondary w-full">
          🔄 刷新使用情況
        </button>
      </div>
    </div>
    
    <!-- 清理結果 -->
    <div v-if="cleanupResult" class="card">
      <h3 class="text-lg font-semibold mb-4">✅ 清理結果</h3>
      <div class="space-y-2 text-sm">
        <p>• 清理舊圖片：{{ cleanupResult.oldImagesDeleted }} 張</p>
        <p>• 清理超量圖片：{{ cleanupResult.excessImagesDeleted }} 張</p>
        <p class="font-medium text-green-600">總共節省：{{ cleanupResult.totalDeleted }} 張圖片</p>
        <div v-if="cleanupResult.errors.length > 0" class="mt-2">
          <p class="text-red-600 font-medium">錯誤信息：</p>
          <ul class="list-disc list-inside text-red-500">
            <li v-for="error in cleanupResult.errors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- 使用建議 -->
    <div v-if="getUsagePercentage() > 70" class="card border-orange-200 bg-orange-50">
      <h3 class="text-lg font-semibold mb-4 text-orange-800">💡 節省空間建議</h3>
      <ul class="list-disc list-inside text-sm text-orange-700 space-y-1">
        <li>上傳前適當裁剪圖片</li>
        <li>避免上傳過於高清的圖片</li>
        <li>定期清理不需要的舊記錄</li>
        <li>考慮升級到 Supabase Pro 方案</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { 
  getStorageUsage, 
  smartCleanup, 
  cleanupOldImages as cleanupOld,
  cleanupExcessImages as cleanupExcess
} from '@/utils/storageManager'

const authStore = useAuthStore()

const storageUsage = ref({
  totalImages: 0,
  estimatedSizeMB: 0,
  maxAllowedMB: 400
})

const cleaning = ref(false)
const cleanupResult = ref(null)
const showCleanupDetails = ref(false)

// 格式化大小顯示
const formatSize = (sizeMB) => {
  if (sizeMB >= 1024) {
    return `${(sizeMB / 1024).toFixed(1)} GB`
  }
  return `${sizeMB.toFixed(1)} MB`
}

// 獲取使用百分比
const getUsagePercentage = () => {
  if (storageUsage.value.maxAllowedMB === 0) return 0
  return (storageUsage.value.estimatedSizeMB / storageUsage.value.maxAllowedMB) * 100
}

// 獲取進度條顏色
const getProgressBarColor = () => {
  const percentage = getUsagePercentage()
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-orange-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

// 獲取預估可用天數
const getEstimatedDaysLeft = () => {
  const remainingMB = storageUsage.value.maxAllowedMB - storageUsage.value.estimatedSizeMB
  const avgDailyUsage = 2 // 假設每天平均上傳 2MB
  const daysLeft = Math.floor(remainingMB / avgDailyUsage)
  return daysLeft > 0 ? `${daysLeft} 天` : '已滿'
}

// 是否顯示警告
const shouldShowWarning = () => {
  return getUsagePercentage() >= 70
}

// 獲取警告信息
const getWarningMessage = () => {
  const percentage = getUsagePercentage()
  if (percentage >= 90) {
    return '存儲空間即將耗盡！建議立即清理舊圖片。'
  }
  if (percentage >= 80) {
    return '存儲空間使用量較高，建議進行清理以確保正常使用。'
  }
  return '存儲空間使用量偏高，建議定期清理以維持最佳性能。'
}

// 刷新使用情況
const refreshUsage = async () => {
  try {
    storageUsage.value = await getStorageUsage()
  } catch (error) {
    console.error('刷新使用情況失敗:', error)
  }
}

// 執行智能清理
const performCleanup = async () => {
  if (!authStore.user) return
  
  cleaning.value = true
  cleanupResult.value = null
  
  try {
    const result = await smartCleanup(authStore.user.id)
    cleanupResult.value = result
    
    // 刷新使用情況
    await refreshUsage()
    
  } catch (error) {
    console.error('清理失敗:', error)
    cleanupResult.value = {
      oldImagesDeleted: 0,
      excessImagesDeleted: 0,
      totalDeleted: 0,
      errors: [error.message]
    }
  } finally {
    cleaning.value = false
  }
}

// 清理舊圖片
const cleanupOldImages = async () => {
  if (!authStore.user) return
  
  cleaning.value = true
  
  try {
    const result = await cleanupOld(authStore.user.id, 30)
    cleanupResult.value = {
      oldImagesDeleted: result.deleted,
      excessImagesDeleted: 0,
      totalDeleted: result.deleted,
      errors: result.failed > 0 ? [`${result.failed} 個文件清理失敗`] : []
    }
    
    await refreshUsage()
    
  } catch (error) {
    console.error('清理舊圖片失敗:', error)
  } finally {
    cleaning.value = false
  }
}

// 清理超量圖片
const cleanupExcessImages = async () => {
  if (!authStore.user) return
  
  cleaning.value = true
  
  try {
    const result = await cleanupExcess(authStore.user.id, 100)
    cleanupResult.value = {
      oldImagesDeleted: 0,
      excessImagesDeleted: result.deleted,
      totalDeleted: result.deleted,
      errors: result.failed > 0 ? [`${result.failed} 個文件清理失敗`] : []
    }
    
    await refreshUsage()
    
  } catch (error) {
    console.error('清理超量圖片失敗:', error)
  } finally {
    cleaning.value = false
  }
}

onMounted(() => {
  refreshUsage()
})
</script>

<template>
  <div v-if="showError" class="fixed top-4 right-4 max-w-md z-50">
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="text-red-500 text-xl">⚠️</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            設置提醒
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ actualMessage }}</p>
            <div v-if="checkingSetup" class="text-xs text-red-600 mt-1">
              檢查設置狀態中...
            </div>
          </div>
          <div class="mt-3">
            <div class="flex space-x-2">
              <button
                @click="openSetupGuide"
                class="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded hover:bg-red-200 transition-colors"
              >
                查看修復指南
              </button>
              <button
                @click="dismiss"
                class="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { checkSupabaseSetup, getSetupInstructions } from '@/lib/checkSetup'

const props = defineProps({
  message: {
    type: String,
    default: '需要設置 Supabase 數據庫表和存儲桶才能正常使用應用功能'
  }
})

const showError = ref(false)
const setupStatus = ref({
  database: false,
  storage: false,
  auth: false
})
const checkingSetup = ref(false)

const actualMessage = computed(() => {
  const instructions = getSetupInstructions(setupStatus.value)
  return instructions ? instructions.message : props.message
})

const dismiss = () => {
  showError.value = false
  localStorage.setItem('setup-error-dismissed', new Date().getTime().toString())
}

const openSetupGuide = () => {
  window.open('/SETUP_FIX.md', '_blank')
}

const checkSetup = async () => {
  checkingSetup.value = true
  try {
    setupStatus.value = await checkSupabaseSetup()
    const instructions = getSetupInstructions(setupStatus.value)
    
    if (!instructions) {
      // 設置完成，隱藏錯誤提示
      showError.value = false
      localStorage.setItem('setup-error-dismissed', new Date().getTime().toString())
    } else {
      // 仍有問題，檢查是否已經關閉過提醒（24小時內不再顯示）
      const dismissed = localStorage.getItem('setup-error-dismissed')
      const now = new Date().getTime()
      const oneDayMs = 24 * 60 * 60 * 1000
      
      if (!dismissed || (now - parseInt(dismissed)) > oneDayMs) {
        showError.value = true
      }
    }
  } catch (error) {
    console.error('檢查設置狀態失敗:', error)
    showError.value = true
  } finally {
    checkingSetup.value = false
  }
}

onMounted(() => {
  checkSetup()
})
</script>
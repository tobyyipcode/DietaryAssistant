<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">個人資料</h1>
      <p class="text-gray-600 mt-2">管理您的個人資訊和健康目標</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 基本資料 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">基本資料</h2>
          
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="form-label">姓名</label>
              <input
                v-model="profileForm.full_name"
                type="text"
                class="form-input"
                placeholder="請輸入您的姓名"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label">年齡</label>
                <input
                  v-model.number="profileForm.age"
                  type="number"
                  class="form-input"
                  placeholder="歲"
                  min="1"
                  max="120"
                />
              </div>
              <div>
                <label class="form-label">活動量</label>
                <select v-model="profileForm.activity_level" class="form-input">
                  <option value="sedentary">久坐 (很少運動)</option>
                  <option value="light">輕度活動 (每週1-3次)</option>
                  <option value="moderate">中度活動 (每週3-5次)</option>
                  <option value="active">活躍 (每週6-7次)</option>
                  <option value="very_active">高度活躍 (一天2次)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label">身高 (cm)</label>
                <input
                  v-model.number="profileForm.height_cm"
                  type="number"
                  class="form-input"
                  placeholder="公分"
                  min="50"
                  max="250"
                />
              </div>
              <div>
                <label class="form-label">體重 (kg)</label>
                <input
                  v-model.number="profileForm.weight_kg"
                  type="number"
                  class="form-input"
                  placeholder="公斤"
                  min="20"
                  max="300"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label class="form-label">每日熱量目標 (kcal)</label>
              <input
                v-model.number="profileForm.target_calories"
                type="number"
                class="form-input"
                placeholder="建議熱量將自動計算"
                min="800"
                max="5000"
              />
              <p v-if="calculatedCalories" class="text-sm text-gray-600 mt-1">
                建議每日熱量：{{ calculatedCalories }} kcal
              </p>
            </div>

            <div v-if="error" class="text-red-600 text-sm">
              {{ error }}
            </div>

            <div v-if="success" class="text-green-600 text-sm">
              {{ success }}
            </div>

            <button
              type="submit"
              :disabled="authStore.loading"
              class="btn-primary"
            >
              <span v-if="authStore.loading">更新中...</span>
              <span v-else>💾 保存資料</span>
            </button>
          </form>
        </div>
      </div>

      <!-- 帳戶資訊 -->
      <div class="space-y-6">
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">帳戶資訊</h2>
          
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-700">電子郵件</label>
              <p class="text-gray-900">{{ authStore.user?.email }}</p>
            </div>
            
            <div>
              <label class="text-sm font-medium text-gray-700">註冊日期</label>
              <p class="text-gray-900">{{ formatDate(authStore.user?.created_at) }}</p>
            </div>
            
            <div>
              <label class="text-sm font-medium text-gray-700">最後登入</label>
              <p class="text-gray-900">{{ formatDate(authStore.user?.last_sign_in_at) }}</p>
            </div>
          </div>
        </div>

        <!-- BMI 計算器 -->
        <div v-if="profileForm.height_cm && profileForm.weight_kg" class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">健康指標</h2>
          
          <div class="text-center">
            <div class="text-3xl font-bold mb-2" :class="bmiColor">
              {{ bmi }}
            </div>
            <div class="text-sm text-gray-600 mb-2">BMI 指數</div>
            <div class="text-sm font-medium" :class="bmiColor">
              {{ bmiCategory }}
            </div>
          </div>
          
          <div class="mt-4 text-xs text-gray-500">
            <p>BMI 分類標準：</p>
            <p>• 過輕：< 18.5</p>
            <p>• 正常：18.5 - 24.9</p>
            <p>• 過重：25.0 - 29.9</p>
            <p>• 肥胖：≥ 30.0</p>
          </div>
        </div>

        <!-- 快速統計 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">使用統計</h2>
          
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">總記錄餐點</span>
              <span class="font-medium">{{ mealsStore.meals.length }} 次</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">本週記錄</span>
              <span class="font-medium">{{ weeklyMeals }} 次</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">平均每日熱量</span>
              <span class="font-medium">{{ averageCalories }} kcal</span>
            </div>
          </div>
        </div>
        
        <!-- 存儲配額管理 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">📁 存儲配額</h2>
          
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">已使用空間</span>
              <span class="font-medium">{{ formatStorageSize(storageUsage.estimatedSizeMB) }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">可用空間</span>
              <span class="font-medium">{{ formatStorageSize(storageUsage.maxAllowedMB) }}</span>
            </div>
            
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-500"
                :class="getStorageProgressColor()"
                :style="{ width: getStoragePercentage() + '%' }"
              ></div>
            </div>
            
            <div class="text-xs text-gray-500">
              {{ getStoragePercentage().toFixed(1) }}% 已使用
            </div>
            
            <div class="mt-3">
              <h4 class="text-sm font-medium text-gray-700 mb-2">節省空間設定</h4>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input 
                    v-model="storageSettings.autoCompress" 
                    type="checkbox" 
                    class="mr-2"
                  />
                  <span class="text-sm">自動壓縮圖片</span>
                </label>
                <label class="flex items-center">
                  <input 
                    v-model="storageSettings.autoCleanup" 
                    type="checkbox" 
                    class="mr-2"
                  />
                  <span class="text-sm">自動清理舊圖片</span>
                </label>
                <label class="flex items-center">
                  <input 
                    v-model="storageSettings.useWebP" 
                    type="checkbox" 
                    class="mr-2"
                  />
                  <span class="text-sm">優先使用 WebP 格式</span>
                </label>
              </div>
              
              <div class="mt-3">
                <label class="text-sm font-medium text-gray-700">最大保存圖片數量</label>
                <select v-model="storageSettings.maxImages" class="w-full mt-1 text-sm border rounded px-2 py-1">
                  <option value="50">50 張</option>
                  <option value="100">100 張</option>
                  <option value="200">200 張</option>
                  <option value="500">500 張</option>
                </select>
              </div>
              
              <button 
                @click="saveStorageSettings" 
                class="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded transition-colors"
                :disabled="savingSettings"
              >
                {{ savingSettings ? '保存中...' : '保存設定' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMealsStore } from '@/stores/meals'
import { getStorageUsage } from '@/utils/storageManager'

const authStore = useAuthStore()
const mealsStore = useMealsStore()

const profileForm = ref({
  full_name: '',
  age: null,
  height_cm: null,
  weight_kg: null,
  activity_level: 'moderate',
  target_calories: null
})

const error = ref('')
const success = ref('')

// 存儲相關狀態
const storageUsage = ref({
  totalImages: 0,
  estimatedSizeMB: 0,
  maxAllowedMB: 400
})

const storageSettings = ref({
  autoCompress: true,
  autoCleanup: true,
  useWebP: true,
  maxImages: 100
})

const savingSettings = ref(false)

// 計算 BMI
const bmi = computed(() => {
  const { height_cm, weight_kg } = profileForm.value
  if (!height_cm || !weight_kg) return 0
  
  const heightInMeters = height_cm / 100
  return (weight_kg / (heightInMeters * heightInMeters)).toFixed(1)
})

const bmiCategory = computed(() => {
  const bmiValue = parseFloat(bmi.value)
  if (bmiValue < 18.5) return '過輕'
  if (bmiValue < 25) return '正常'
  if (bmiValue < 30) return '過重'
  return '肥胖'
})

const bmiColor = computed(() => {
  const bmiValue = parseFloat(bmi.value)
  if (bmiValue < 18.5) return 'text-blue-600'
  if (bmiValue < 25) return 'text-green-600'
  if (bmiValue < 30) return 'text-yellow-600'
  return 'text-red-600'
})

// 計算建議熱量
const calculatedCalories = computed(() => {
  const { age, height_cm, weight_kg, activity_level } = profileForm.value
  if (!age || !height_cm || !weight_kg) return 0

  // 使用 Harris-Benedict 公式計算基礎代謝率 (假設為女性)
  let bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age)
  
  // 根據活動量調整
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }
  
  return Math.round(bmr * activityMultipliers[activity_level])
})

// 統計資料
const weeklyMeals = computed(() => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return mealsStore.meals.filter(meal => 
    new Date(meal.created_at) >= oneWeekAgo
  ).length
})

const averageCalories = computed(() => {
  if (mealsStore.meals.length === 0) return 0
  
  const days = new Set(mealsStore.meals.map(meal => 
    new Date(meal.created_at).toDateString()
  )).size
  
  const totalCalories = mealsStore.meals.reduce((sum, meal) => 
    sum + (meal.calories || 0), 0
  )
  
  return Math.round(totalCalories / Math.max(days, 1))
})

// 監聽計算熱量變化，自動填入
watch(calculatedCalories, (newValue) => {
  if (newValue && !profileForm.value.target_calories) {
    profileForm.value.target_calories = newValue
  }
})

// 存儲相關函數
const formatStorageSize = (sizeMB) => {
  if (sizeMB >= 1024) {
    return `${(sizeMB / 1024).toFixed(1)} GB`
  }
  return `${sizeMB.toFixed(1)} MB`
}

const getStoragePercentage = () => {
  if (storageUsage.value.maxAllowedMB === 0) return 0
  return (storageUsage.value.estimatedSizeMB / storageUsage.value.maxAllowedMB) * 100
}

const getStorageProgressColor = () => {
  const percentage = getStoragePercentage()
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-orange-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

const saveStorageSettings = async () => {
  savingSettings.value = true
  try {
    // 儲存設定到 localStorage
    localStorage.setItem('storageSettings', JSON.stringify(storageSettings.value))
    
    // 更新用戶 profile 中的設定
    if (authStore.user) {
      await authStore.updateProfile({
        storage_settings: storageSettings.value
      })
    }
    
    success.value = '存儲設定已保存'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (error) {
    console.error('保存設定失敗:', error)
  } finally {
    savingSettings.value = false
  }
}

const loadStorageUsage = async () => {
  try {
    storageUsage.value = await getStorageUsage()
  } catch (error) {
    console.error('獲取存儲使用情況失敗:', error)
  }
}

const loadStorageSettings = () => {
  // 從 localStorage 讀取設定
  const saved = localStorage.getItem('storageSettings')
  if (saved) {
    try {
      storageSettings.value = { ...storageSettings.value, ...JSON.parse(saved) }
    } catch (error) {
      console.error('讀取存儲設定失敗:', error)
    }
  }
  
  // 從 profile 讀取設定
  if (authStore.profile?.storage_settings) {
    storageSettings.value = { ...storageSettings.value, ...authStore.profile.storage_settings }
  }
}

onMounted(async () => {
  // 載入用戶資料
  if (authStore.user) {
    await authStore.getProfile()
    
    if (authStore.profile) {
      profileForm.value = {
        full_name: authStore.profile.full_name || '',
        age: authStore.profile.age || null,
        height_cm: authStore.profile.height_cm || null,
        weight_kg: authStore.profile.weight_kg || null,
        activity_level: authStore.profile.activity_level || 'moderate',
        target_calories: authStore.profile.target_calories || null
      }
    }
    
    // 載入餐點數據
    await mealsStore.getMeals(authStore.user.id)
    
    // 載入存儲相關數據
    await loadStorageUsage()
    loadStorageSettings()
  }
})

const updateProfile = async () => {
  error.value = ''
  success.value = ''

  try {
    const { data, error: updateError } = await authStore.updateProfile(profileForm.value)
    
    if (updateError) {
      error.value = '更新失敗：' + updateError.message
    } else {
      success.value = '資料更新成功！'
      setTimeout(() => {
        success.value = ''
      }, 3000)
    }
  } catch (err) {
    error.value = '更新失敗，請稍後再試'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleDateString('zh-TW')
}
</script>
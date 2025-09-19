<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">儀表板</h1>
      <p class="text-gray-600 mt-2">歡迎回來！這是您今日的飲食概覽</p>
    </div>

    <!-- 今日統計卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-primary-100 rounded-full">
            <span class="text-primary-600 text-xl">🔥</span>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">今日熱量</p>
            <p class="text-2xl font-bold text-gray-900">{{ todayNutrition.calories }}</p>
            <p class="text-xs text-gray-500">kcal</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-full">
            <span class="text-blue-600 text-xl">🥩</span>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">蛋白質</p>
            <p class="text-2xl font-bold text-gray-900">{{ todayNutrition.protein_g.toFixed(1) }}</p>
            <p class="text-xs text-gray-500">g</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-yellow-100 rounded-full">
            <span class="text-yellow-600 text-xl">🍞</span>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">碳水化合物</p>
            <p class="text-2xl font-bold text-gray-900">{{ todayNutrition.carbs_g.toFixed(1) }}</p>
            <p class="text-xs text-gray-500">g</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-full">
            <span class="text-green-600 text-xl">🥑</span>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600">脂肪</p>
            <p class="text-2xl font-bold text-gray-900">{{ todayNutrition.fat_g.toFixed(1) }}</p>
            <p class="text-xs text-gray-500">g</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">快速記錄餐點</h3>
        <p class="text-gray-600 mb-4">拍照上傳您的餐點，AI 將自動分析營養成分</p>
        <router-link to="/upload" class="btn-primary">
          📸 上傳餐點照片
        </router-link>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">查看餐點記錄</h3>
        <p class="text-gray-600 mb-4">查看您的歷史餐點記錄和營養分析</p>
        <router-link to="/meals" class="btn-secondary">
          📋 查看記錄
        </router-link>
      </div>
      
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">存儲管理</h3>
        <p class="text-gray-600 mb-4">監控和管理您的存儲空間使用</p>
        <button @click="showStorageMonitor = !showStorageMonitor" class="btn-secondary">
          {{ showStorageMonitor ? '隱藏' : '📊 查看' }} 存儲狀況
        </button>
      </div>
    </div>
    
    <!-- 存儲空間監控 -->
    <div v-if="showStorageMonitor" class="mb-8">
      <StorageMonitor />
    </div>

    <!-- 今日餐點 -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">今日餐點</h3>
      
      <div v-if="todayMeals.length === 0" class="text-center py-8">
        <div class="text-4xl mb-2">🍽️</div>
        <p class="text-gray-500">今天還沒有記錄任何餐點</p>
        <router-link to="/upload" class="btn-primary mt-4 inline-block">
          開始記錄
        </router-link>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="meal in todayMeals"
          :key="meal.id"
          class="flex items-center p-4 bg-gray-50 rounded-lg"
        >
          <SafeImage
            :src="meal.image_url"
            :alt="meal.food_name"
            img-class="w-16 h-16 object-cover rounded-lg mr-4"
            placeholder-class="w-16 h-16 bg-gray-200 rounded-lg mr-4 flex items-center justify-center"
          />
          <div class="flex-1">
            <h4 class="font-medium text-gray-900">{{ meal.food_name }}</h4>
            <p class="text-sm text-gray-600">
              {{ getMealTypeText(meal.meal_type) }} • {{ meal.calories }} kcal
            </p>
            <p class="text-xs text-gray-500">
              {{ formatTime(meal.created_at) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMealsStore } from '@/stores/meals'
import StorageMonitor from '@/components/StorageMonitor.vue'
import SafeImage from '@/components/SafeImage.vue'

const authStore = useAuthStore()
const mealsStore = useMealsStore()

const showStorageMonitor = ref(false)

const todayMeals = computed(() => {
  const today = new Date().toDateString()
  return mealsStore.meals.filter(meal => {
    const mealDate = new Date(meal.created_at).toDateString()
    return mealDate === today
  })
})

const todayNutrition = computed(() => {
  return mealsStore.getDailyNutrition(new Date())
})

onMounted(async () => {
  if (authStore.user) {
    await mealsStore.getMeals(authStore.user.id)
  }
})

const getMealTypeText = (mealType) => {
  const mealTypes = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '點心'
  }
  return mealTypes[mealType] || '其他'
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
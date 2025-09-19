<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">餐點記錄</h1>
      <p class="text-gray-600 mt-2">查看您的歷史餐點記錄和營養分析</p>
    </div>

    <!-- 篩選器 -->
    <div class="card mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div>
          <label class="form-label">日期篩選</label>
          <input
            v-model="selectedDate"
            type="date"
            class="form-input"
            @change="filterMealsByDate"
          />
        </div>
        <div class="flex items-end">
          <button @click="clearDateFilter" class="btn-secondary">
            顯示全部
          </button>
        </div>
      </div>
    </div>

    <!-- 統計概覽 -->
    <div v-if="selectedDate" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card text-center">
        <div class="text-2xl font-bold text-primary-600">{{ dayNutrition.calories }}</div>
        <div class="text-sm text-gray-600">熱量 (kcal)</div>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-blue-600">{{ dayNutrition.protein_g.toFixed(1) }}</div>
        <div class="text-sm text-gray-600">蛋白質 (g)</div>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-yellow-600">{{ dayNutrition.carbs_g.toFixed(1) }}</div>
        <div class="text-sm text-gray-600">碳水 (g)</div>
      </div>
      <div class="card text-center">
        <div class="text-2xl font-bold text-green-600">{{ dayNutrition.fat_g.toFixed(1) }}</div>
        <div class="text-sm text-gray-600">脂肪 (g)</div>
      </div>
    </div>

    <!-- 餐點列表 -->
    <div class="space-y-4">
      <div v-if="mealsStore.loading" class="text-center py-8">
        <div class="text-2xl mb-2">⏳</div>
        <p class="text-gray-500">加載中...</p>
      </div>

      <div v-else-if="filteredMeals.length === 0" class="text-center py-12">
        <div class="text-4xl mb-4">🍽️</div>
        <p class="text-gray-500 mb-4">
          {{ selectedDate ? '這天沒有記錄任何餐點' : '還沒有記錄任何餐點' }}
        </p>
        <router-link to="/upload" class="btn-primary">
          開始記錄餐點
        </router-link>
      </div>

      <div v-else>
        <div
          v-for="meal in filteredMeals"
          :key="meal.id"
          class="card hover:shadow-md transition-shadow"
        >
          <div class="flex flex-col sm:flex-row gap-4">
            <!-- 餐點圖片 -->
            <div class="flex-shrink-0">
              <SafeImage
                :src="meal.image_url"
                :alt="meal.food_name"
                img-class="w-24 h-24 object-cover rounded-lg"
                placeholder-class="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center"
              />
            </div>

            <!-- 餐點資訊 -->
            <div class="flex-1">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">{{ meal.food_name }}</h3>
                  <p class="text-sm text-gray-600">
                    {{ getMealTypeText(meal.meal_type) }} • 
                    {{ formatDateTime(meal.created_at) }}
                  </p>
                </div>
                <button
                  @click="deleteMeal(meal.id)"
                  class="text-red-500 hover:text-red-700 p-1"
                  title="刪除餐點"
                >
                  🗑️
                </button>
              </div>

              <!-- 營養資訊 -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                <div class="text-center bg-gray-50 rounded p-2">
                  <div class="font-semibold text-gray-900">{{ meal.calories || 0 }}</div>
                  <div class="text-xs text-gray-600">熱量</div>
                </div>
                <div class="text-center bg-gray-50 rounded p-2">
                  <div class="font-semibold text-gray-900">{{ (meal.protein_g || 0).toFixed(1) }}</div>
                  <div class="text-xs text-gray-600">蛋白質</div>
                </div>
                <div class="text-center bg-gray-50 rounded p-2">
                  <div class="font-semibold text-gray-900">{{ (meal.carbs_g || 0).toFixed(1) }}</div>
                  <div class="text-xs text-gray-600">碳水</div>
                </div>
                <div class="text-center bg-gray-50 rounded p-2">
                  <div class="font-semibold text-gray-900">{{ (meal.fat_g || 0).toFixed(1) }}</div>
                  <div class="text-xs text-gray-600">脂肪</div>
                </div>
              </div>

              <!-- 備註 -->
              <div v-if="meal.notes" class="text-sm text-gray-600 bg-gray-50 rounded p-2">
                <strong>備註：</strong>{{ meal.notes }}
              </div>

              <!-- AI 健康建議 -->
              <div v-if="meal.ai_analysis && meal.ai_analysis.health_advice" class="mt-3">
                <details class="text-sm">
                  <summary class="cursor-pointer text-primary-600 hover:text-primary-700">
                    查看 AI 健康建議
                  </summary>
                  <div class="mt-2 p-3 bg-primary-50 rounded text-primary-800">
                    {{ meal.ai_analysis.health_advice }}
                  </div>
                </details>
              </div>
            </div>
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
import SafeImage from '@/components/SafeImage.vue'

const authStore = useAuthStore()
const mealsStore = useMealsStore()

const selectedDate = ref('')

const filteredMeals = computed(() => {
  if (!selectedDate.value) {
    return mealsStore.meals
  }
  
  const targetDate = new Date(selectedDate.value).toDateString()
  return mealsStore.meals.filter(meal => {
    const mealDate = new Date(meal.created_at).toDateString()
    return mealDate === targetDate
  })
})

const dayNutrition = computed(() => {
  if (!selectedDate.value) return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  return mealsStore.getDailyNutrition(selectedDate.value)
})

onMounted(async () => {
  if (authStore.user) {
    await mealsStore.getMeals(authStore.user.id)
  }
})

const filterMealsByDate = async () => {
  if (authStore.user && selectedDate.value) {
    await mealsStore.getMeals(authStore.user.id, selectedDate.value)
  }
}

const clearDateFilter = async () => {
  selectedDate.value = ''
  if (authStore.user) {
    await mealsStore.getMeals(authStore.user.id)
  }
}

const deleteMeal = async (mealId) => {
  if (confirm('確定要刪除這個餐點記錄嗎？')) {
    try {
      await mealsStore.deleteMeal(mealId)
    } catch (error) {
      alert('刪除失敗，請稍後再試')
    }
  }
}

const getMealTypeText = (mealType) => {
  const mealTypes = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '點心'
  }
  return mealTypes[mealType] || '其他'
}

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
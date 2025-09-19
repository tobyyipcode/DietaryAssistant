<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">上傳餐點</h1>
      <p class="text-gray-600 mt-2">拍照上傳您的餐點，AI 將自動分析營養成分</p>
    </div>

    <div class="card">
      <!-- 上傳區域 -->
      <div
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
        :class="{ 'border-primary-400 bg-primary-50': isDragging }"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileSelect"
          class="hidden"
        />

        <div v-if="!selectedFile">
          <div class="text-4xl mb-4">📸</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">上傳餐點照片</h3>
          <p class="text-gray-600 mb-4">拖拽圖片到此處或點擊選擇文件</p>
          <button @click="$refs.fileInput.click()" class="btn-primary">
            選擇圖片
          </button>
        </div>

        <div v-else class="space-y-4">
          <img
            :src="previewUrl"
            alt="餐點預覽"
            class="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
          />
          <div class="flex gap-4 justify-center">
            <button @click="clearFile" class="btn-secondary">
              重新選擇
            </button>
            <button
              @click="analyzeFood"
              :disabled="mealsStore.analyzing"
              class="btn-primary"
            >
              <span v-if="mealsStore.analyzing">分析中...</span>
              <span v-else>🤖 AI 分析</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 分析結果 -->
      <div v-if="analysisResult" class="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">分析結果</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-gray-900 mb-2">基本資訊</h4>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">食物名稱：</span>{{ analysisResult.food_name }}</p>
              <p><span class="font-medium">估計重量：</span>{{ analysisResult.estimated_weight_g }}g</p>
              <p><span class="font-medium">熱量：</span>{{ analysisResult.calories }} kcal</p>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-gray-900 mb-2">營養成分</h4>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">蛋白質：</span>{{ analysisResult.nutrition.protein_g }}g</p>
              <p><span class="font-medium">碳水化合物：</span>{{ analysisResult.nutrition.carbs_g }}g</p>
              <p><span class="font-medium">脂肪：</span>{{ analysisResult.nutrition.fat_g }}g</p>
              <p><span class="font-medium">纖維：</span>{{ analysisResult.nutrition.fiber_g }}g</p>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <h4 class="font-medium text-gray-900 mb-2">健康建議</h4>
          <p class="text-sm text-gray-700">{{ analysisResult.health_advice }}</p>
        </div>

        <!-- 餐點類型選擇 -->
        <div class="mt-6">
          <label class="form-label">餐點類型</label>
          <select v-model="mealType" class="form-input">
            <option value="breakfast">早餐</option>
            <option value="lunch">午餐</option>
            <option value="dinner">晚餐</option>
            <option value="snack">點心</option>
          </select>
        </div>

        <!-- 備註 -->
        <div class="mt-4">
          <label class="form-label">備註 (選填)</label>
          <textarea
            v-model="notes"
            class="form-input"
            rows="3"
            placeholder="添加任何額外的備註..."
          ></textarea>
        </div>

        <div class="mt-6 flex gap-4">
          <button @click="saveMeal" :disabled="mealsStore.loading" class="btn-primary">
            <span v-if="mealsStore.loading">保存中...</span>
            <span v-else>💾 保存餐點</span>
          </button>
          <button @click="resetForm" class="btn-secondary">
            重新開始
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMealsStore } from '@/stores/meals'
import { createSafePreviewUrl, cleanupBlobUrl } from '@/utils/imageUtils'

const router = useRouter()
const authStore = useAuthStore()
const mealsStore = useMealsStore()

const selectedFile = ref(null)
const previewUrl = ref('')
const analysisResult = ref(null)
const imagePath = ref('') // 存儲圖片路徑
const mealType = ref('lunch')
const notes = ref('')
const isDragging = ref(false)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    // 清理舊的 blob URL
    if (previewUrl.value) {
      cleanupBlobUrl(previewUrl.value)
    }
    
    selectedFile.value = file
    previewUrl.value = createSafePreviewUrl(file)
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    // 清理舊的 blob URL
    if (previewUrl.value) {
      cleanupBlobUrl(previewUrl.value)
    }
    
    selectedFile.value = file
    previewUrl.value = createSafePreviewUrl(file)
  }
}

const clearFile = () => {
  // 清理 blob URL
  if (previewUrl.value) {
    cleanupBlobUrl(previewUrl.value)
  }
  
  selectedFile.value = null
  previewUrl.value = ''
  analysisResult.value = null
  imagePath.value = '' // 清空圖片路徑
}

const analyzeFood = async () => {
  if (!selectedFile.value) return

  try {
    const result = await mealsStore.analyzeFoodImage(selectedFile.value)
    analysisResult.value = result.analysis
    imagePath.value = result.imagePath // 保存圖片路徑
    
    // 如果上傳成功，更新預覽 URL
    if (result.imageUrl) {
      // 清理舊的 blob URL
      if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        cleanupBlobUrl(previewUrl.value)
      }
      previewUrl.value = result.imageUrl
    }
    
    // 根據AI建議設置餐點類型
    if (result.analysis.meal_type_suggestion) {
      mealType.value = result.analysis.meal_type_suggestion
    }
  } catch (error) {
    let errorMessage = '分析失敗，請稍後再試'
    
    if (error.message && error.message.includes('圖片上傳失敗')) {
      errorMessage = '圖片上傳失敗，請確認 Supabase Storage 設置是否正確'
    }
    
    alert(errorMessage)
    console.error('分析錯誤:', error)
  }
}

const saveMeal = async () => {
  if (!analysisResult.value || !authStore.user) return

  try {
    const mealData = {
      user_id: authStore.user.id,
      meal_type: mealType.value,
      food_name: analysisResult.value.food_name,
      image_url: previewUrl.value,
      image_path: imagePath.value, // 保存存儲路徑以便未來刪除
      calories: analysisResult.value.calories,
      protein_g: analysisResult.value.nutrition.protein_g,
      carbs_g: analysisResult.value.nutrition.carbs_g,
      fat_g: analysisResult.value.nutrition.fat_g,
      fiber_g: analysisResult.value.nutrition.fiber_g,
      sugar_g: analysisResult.value.nutrition.sugar_g,
      sodium_mg: analysisResult.value.nutrition.sodium_mg,
      estimated_weight_g: analysisResult.value.estimated_weight_g,
      ai_analysis: analysisResult.value,
      notes: notes.value
    }

    await mealsStore.saveMeal(mealData)
    alert('餐點保存成功！')
    router.push('/dashboard')
  } catch (error) {
    alert('保存失敗，請稍後再試')
    console.error('保存錯誤:', error)
  }
}

const resetForm = () => {
  clearFile()
  mealType.value = 'lunch'
  notes.value = ''
}

onMounted(() => {
  // 監聽拖拽事件
  document.addEventListener('dragenter', (e) => {
    e.preventDefault()
    isDragging.value = true
  })
  
  document.addEventListener('dragleave', (e) => {
    e.preventDefault()
    if (!e.relatedTarget) {
      isDragging.value = false
    }
  })
})

onUnmounted(() => {
  // 清理預覽 URL
  if (previewUrl.value) {
    cleanupBlobUrl(previewUrl.value)
  }
})
</script>
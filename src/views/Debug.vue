<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">系統診斷</h1>
      <p class="text-gray-600 mt-2">檢查 Supabase 和 AI 服務設置狀態</p>
    </div>

    <div class="space-y-6">
      <!-- Supabase 連接測試 -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">🔗 Supabase 連接測試</h2>
        
        <div class="space-y-3">
          <div class="flex items-center space-x-3">
            <span class="w-4 h-4 rounded-full" :class="authStatus ? 'bg-green-500' : 'bg-red-500'"></span>
            <span>認證服務: {{ authStatus ? '正常' : '異常' }}</span>
          </div>
          
          <div class="flex items-center space-x-3">
            <span class="w-4 h-4 rounded-full" :class="dbStatus ? 'bg-green-500' : 'bg-red-500'"></span>
            <span>數據庫: {{ dbStatus ? '正常' : '異常' }}</span>
          </div>
          
          <div class="flex items-center space-x-3">
            <span class="w-4 h-4 rounded-full" :class="storageStatus ? 'bg-green-500' : 'bg-red-500'"></span>
            <span>存儲服務: {{ storageStatus ? '正常' : '異常' }}</span>
            <span v-if="!storageStatus" class="text-sm text-red-600">
              (food-images 存儲桶不存在)
            </span>
          </div>
        </div>
        
        <div class="flex gap-3 mt-4">
          <button @click="testSupabase" class="btn-primary" :disabled="testing">
            {{ testing ? '測試中...' : '重新測試' }}
          </button>
          
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank"
            class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center"
          >
            🔗 開啟 Supabase Dashboard
          </a>
        </div>
        
      </div>

      <!-- 圖片上傳測試 -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">📷 圖片上傳測試</h2>
        
        <div class="space-y-4">
          <div>
            <label class="form-label">選擇測試圖片</label>
            <input 
              ref="fileInput" 
              type="file" 
              accept="image/*" 
              @change="handleTestFileSelect"
              class="form-input"
            />
          </div>
          
          <div v-if="testFile" class="space-y-3">
            <img :src="testFileUrl" alt="測試圖片" class="max-h-32 rounded" />
            
            <div class="flex gap-3">
              <button @click="testUpload" class="btn-primary" :disabled="testingUpload">
                {{ testingUpload ? '上傳中...' : '💾 測試上傳' }}
              </button>
              
              <button @click="clearTestFile" class="btn-secondary">
                清除
              </button>
            </div>
          </div>
          
          <div v-if="uploadResult" class="p-4 rounded" :class="uploadResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
            <h4 class="font-medium mb-2">上傳結果:</h4>
            <p class="text-sm">{{ uploadResult.message }}</p>
            <div v-if="uploadResult.success && uploadResult.url" class="mt-2">
              <a :href="uploadResult.url" target="_blank" class="text-blue-600 hover:text-blue-800 underline text-sm">
                🔗 查看上傳的圖片
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">🤖 AI 服務測試</h2>
        
        <div class="space-y-3">
          <div class="flex items-center space-x-3">
            <span class="w-4 h-4 rounded-full" :class="aiStatus ? 'bg-green-500' : 'bg-red-500'"></span>
            <span>智譜 AI: {{ aiStatus ? '正常' : '異常' }}</span>
          </div>
        </div>
        
        <button @click="testAI" class="btn-primary mt-4" :disabled="testingAI">
          {{ testingAI ? '測試中...' : '測試 AI 服務' }}
        </button>
        
        <div v-if="aiTestResult" class="mt-4 p-4 bg-gray-50 rounded">
          <h4 class="font-medium mb-2">測試結果:</h4>
          <pre class="text-sm">{{ aiTestResult }}</pre>
        </div>
      </div>

      <!-- 環境變數檢查 -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">⚙️ 環境變數檢查</h2>
        
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>VITE_SUPABASE_URL:</span>
            <span class="font-mono">{{ supabaseUrl ? '已設置' : '未設置' }}</span>
          </div>
          <div class="flex justify-between">
            <span>VITE_SUPABASE_ANON_KEY:</span>
            <span class="font-mono">{{ supabaseKey ? '已設置' : '未設置' }}</span>
          </div>
          <div class="flex justify-between">
            <span>VITE_ZHIPU_API_KEY:</span>
            <span class="font-mono">{{ zhipuKey ? '已設置' : '未設置' }}</span>
          </div>
        </div>
      </div>

      <!-- 錯誤日誌 -->
      <div v-if="errors.length > 0" class="card">
        <h2 class="text-xl font-semibold mb-4">❌ 錯誤日誌</h2>
        
        <div class="space-y-2">
          <div v-for="(error, index) in errors" :key="index" class="p-3 bg-red-50 rounded text-red-800 text-sm">
            {{ error }}
          </div>
        </div>
        
        <button @click="clearErrors" class="btn-secondary mt-4">
          清除日誌
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const authStatus = ref(false)
const dbStatus = ref(false)
const storageStatus = ref(false)
const aiStatus = ref(false)
const testing = ref(false)
const testingAI = ref(false)
const aiTestResult = ref('')
const errors = ref([])
const testFile = ref(null)
const testFileUrl = ref('')
const testingUpload = ref(false)
const uploadResult = ref(null)

// 環境變數檢查
const supabaseUrl = ref(import.meta.env.VITE_SUPABASE_URL)
const supabaseKey = ref(import.meta.env.VITE_SUPABASE_ANON_KEY)
const zhipuKey = ref(import.meta.env.VITE_ZHIPU_API_KEY)

const testSupabase = async () => {
  testing.value = true
  errors.value = []
  
  try {
    // 測試認證
    const { data: { user } } = await supabase.auth.getUser()
    authStatus.value = true
  } catch (error) {
    authStatus.value = false
    errors.value.push(`認證測試失敗: ${error.message}`)
  }

  try {
    // 測試數據庫 - 嘗試查詢 profiles 表
    await supabase.from('profiles').select('id').limit(1)
    dbStatus.value = true
  } catch (error) {
    dbStatus.value = false
    errors.value.push(`數據庫測試失敗: ${error.message}`)
  }

  try {
    // 測試存儲 - 使用不同的方法檢查
    try {
      // 方法 1: 嘗試列出 buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      if (!listError && buckets) {
        const foodImagesBucket = buckets.find(bucket => bucket.id === 'food-images')
        storageStatus.value = !!foodImagesBucket
        if (foodImagesBucket) {
          console.log('Storage bucket found:', foodImagesBucket)
        }
      } else {
        throw listError
      }
    } catch (listError) {
      console.warn('列出 buckets 失敗，嘗試其他方法:', listError)
      
      // 方法 2: 嘗試上傳一個小檔案來測試
      const testFile = new Blob(['test'], { type: 'text/plain' })
      const testUpload = await supabase.storage
        .from('food-images')
        .upload('test.txt', testFile)
      
      if (testUpload.error) {
        if (testUpload.error.message.includes('Bucket not found')) {
          storageStatus.value = false
          errors.value.push(`存儲測試失敗: Bucket 不存在`)
        } else {
          // Bucket 存在但有權限問題，這也算正常
          storageStatus.value = true
          console.log('Storage bucket exists but has permission restrictions (normal)')
        }
      } else {
        storageStatus.value = true
        // 清理測試檔案
        await supabase.storage.from('food-images').remove(['test.txt'])
      }
    }
  } catch (error) {
    storageStatus.value = false
    errors.value.push(`存儲測試失敗: ${error.message}`)
  }

  testing.value = false
}

const testAI = async () => {
  testingAI.value = true
  aiTestResult.value = ''
  
  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zhipuKey.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          {
            role: 'user',
            content: '請回覆：測試成功'
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      aiStatus.value = true
      aiTestResult.value = data.choices[0].message.content
    } else {
      aiStatus.value = false
      aiTestResult.value = `API 錯誤: ${JSON.stringify(data, null, 2)}`
      errors.value.push(`AI 測試失敗: ${data.error?.message || 'Unknown error'}`)
    }
  } catch (error) {
    aiStatus.value = false
    aiTestResult.value = `網路錯誤: ${error.message}`
    errors.value.push(`AI 測試失敗: ${error.message}`)
  }
  
  testingAI.value = false
}

const clearErrors = () => {
  errors.value = []
}

const handleTestFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    testFile.value = file
    testFileUrl.value = URL.createObjectURL(file)
    uploadResult.value = null
  }
}

const clearTestFile = () => {
  testFile.value = null
  if (testFileUrl.value) {
    URL.revokeObjectURL(testFileUrl.value)
    testFileUrl.value = ''
  }
  uploadResult.value = null
}

const testUpload = async () => {
  if (!testFile.value) return
  
  testingUpload.value = true
  uploadResult.value = null
  
  try {
    const fileName = `test-${Date.now()}.${testFile.value.name.split('.').pop()}`
    const filePath = `test/${fileName}`
    
    const { data, error } = await supabase.storage
      .from('food-images')
      .upload(filePath, testFile.value)
    
    if (error) {
      throw error
    }
    
    // 獲取公開 URL
    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath)
    
    uploadResult.value = {
      success: true,
      message: '圖片上傳成功！Storage 配置正常。',
      url: publicUrl
    }
    
    // 重新測試 storage 狀態
    storageStatus.value = true
    
  } catch (error) {
    console.error('測試上傳失敗:', error)
    uploadResult.value = {
      success: false,
      message: `上傳失敗: ${error.message}`
    }
  } finally {
    testingUpload.value = false
  }
}

onMounted(() => {
  testSupabase()
})
</script>
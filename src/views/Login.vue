<template>
  <div class="min-h-screen flex">
    <!-- 左側圖片 -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-400 to-primary-600 items-center justify-center p-12">
      <div class="text-center text-white">
        <div class="text-6xl mb-6">🥗</div>
        <h1 class="text-4xl font-bold mb-4">個人飲食助理</h1>
        <p class="text-xl opacity-90">記錄每日餐點，AI 智能分析營養，讓健康生活更簡單</p>
      </div>
    </div>

    <!-- 右側登入表單 -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">歡迎回來</h2>
          <p class="text-gray-600 mt-2">登入您的飲食助理帳戶</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="form-label">電子郵件</label>
            <input
              v-model="email"
              type="email"
              class="form-input"
              placeholder="請輸入您的電子郵件"
              required
            />
          </div>

          <div>
            <label class="form-label">密碼</label>
            <input
              v-model="password"
              type="password"
              class="form-input"
              placeholder="請輸入您的密碼"
              required
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full btn-primary"
          >
            <span v-if="loading">登入中...</span>
            <span v-else>登入</span>
          </button>
        </form>

        <div class="text-center mt-6">
          <p class="text-gray-600">
            還沒有帳戶？
            <router-link to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
              立即註冊
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = '請填寫所有欄位'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data, error: authError } = await authStore.signIn(email.value, password.value)
    
    if (authError) {
      error.value = getErrorMessage(authError.message)
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    error.value = '登入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

const getErrorMessage = (message) => {
  if (message.includes('Invalid login credentials')) {
    return '電子郵件或密碼錯誤'
  }
  if (message.includes('Email not confirmed')) {
    return '請先確認您的電子郵件'
  }
  return '登入失敗，請稍後再試'
}
</script>
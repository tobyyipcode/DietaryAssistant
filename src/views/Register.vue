<template>
  <div class="min-h-screen flex">
    <!-- 左側圖片 -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-400 to-primary-600 items-center justify-center p-12">
      <div class="text-center text-white">
        <div class="text-6xl mb-6">🥗</div>
        <h1 class="text-4xl font-bold mb-4">加入飲食助理</h1>
        <p class="text-xl opacity-90">開始您的健康飲食之旅，AI 將為您提供專業的營養分析</p>
      </div>
    </div>

    <!-- 右側註冊表單 -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">建立帳戶</h2>
          <p class="text-gray-600 mt-2">註冊您的個人飲食助理帳戶</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <label class="form-label">姓名</label>
            <input
              v-model="fullName"
              type="text"
              class="form-input"
              placeholder="請輸入您的姓名"
              required
            />
          </div>

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
              placeholder="請輸入密碼 (至少6個字元)"
              required
              minlength="6"
            />
          </div>

          <div>
            <label class="form-label">確認密碼</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="form-input"
              placeholder="請再次輸入密碼"
              required
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div v-if="success" class="text-green-600 text-sm">
            {{ success }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full btn-primary"
          >
            <span v-if="loading">註冊中...</span>
            <span v-else>註冊</span>
          </button>
        </form>

        <div class="text-center mt-6">
          <p class="text-gray-600">
            已有帳戶？
            <router-link to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
              立即登入
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

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const handleRegister = async () => {
  if (!fullName.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = '請填寫所有欄位'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = '密碼確認不符'
    return
  }

  if (password.value.length < 6) {
    error.value = '密碼至少需要6個字元'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const { data, error: authError } = await authStore.signUp(
      email.value,
      password.value,
      { full_name: fullName.value }
    )
    
    if (authError) {
      error.value = getErrorMessage(authError.message)
    } else {
      success.value = '註冊成功！請檢查您的電子郵件並點擊確認連結。'
      // 清空表單
      fullName.value = ''
      email.value = ''
      password.value = ''
      confirmPassword.value = ''
      
      // 3秒後跳轉到登入頁面
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  } catch (err) {
    error.value = '註冊失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

const getErrorMessage = (message) => {
  if (message.includes('User already registered')) {
    return '此電子郵件已經註冊過了'
  }
  if (message.includes('Password should be at least 6 characters')) {
    return '密碼至少需要6個字元'
  }
  if (message.includes('Invalid email')) {
    return '請輸入有效的電子郵件格式'
  }
  return '註冊失敗，請稍後再試'
}
</script>
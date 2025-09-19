<template>
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-8">
          <router-link to="/dashboard" class="text-xl font-bold text-primary-600">
            🥗 飲食助理
          </router-link>
          
          <div class="hidden md:flex space-x-6">
            <router-link to="/dashboard" class="nav-link">
              儀表板
            </router-link>
            <router-link to="/upload" class="nav-link">
              上傳餐點
            </router-link>
            <router-link to="/meals" class="nav-link">
              餐點記錄
            </router-link>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <router-link to="/profile" class="nav-link">
            個人資料
          </router-link>
          <router-link to="/debug" class="nav-link text-orange-600">
            🔧 診斷
          </router-link>
          <button @click="handleSignOut" class="btn-secondary">
            登出
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.router-link-active {
  @apply text-primary-600;
}
</style>
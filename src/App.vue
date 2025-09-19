<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <Navbar v-if="user" />
    <main class="container mx-auto px-4 py-8">
      <router-view />
    </main>
    
    <!-- Setup Error Alert -->
    <SetupErrorAlert v-if="user" />
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Navbar from '@/components/Navbar.vue'
import SetupErrorAlert from '@/components/SetupErrorAlert.vue'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

onMounted(async () => {
  // 檢查當前用戶狀態
  await authStore.getCurrentUser()
  
  // 監聽認證狀態變化
  supabase.auth.onAuthStateChange((event, session) => {
    authStore.user = session?.user || null
  })
})
</script>
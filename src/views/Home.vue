<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
    <div class="text-center max-w-2xl mx-auto px-4">
      <div class="text-8xl mb-8">🥗</div>
      <h1 class="text-5xl font-bold text-gray-900 mb-6">個人飲食助理</h1>
      <p class="text-xl text-gray-600 mb-8 leading-relaxed">
        使用 AI 智能分析您的每日餐點，追蹤營養攝取，<br>
        獲得個人化的健康飲食建議，讓健康生活變得更簡單
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <router-link to="/register" class="btn-primary text-lg px-8 py-3">
          開始使用
        </router-link>
        <router-link to="/login" class="btn-secondary text-lg px-8 py-3">
          登入帳戶
        </router-link>
      </div>

      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="text-3xl mb-3">📸</div>
          <h3 class="font-semibold text-gray-900 mb-2">拍照上傳</h3>
          <p class="text-gray-600 text-sm">簡單拍照上傳您的餐點</p>
        </div>
        
        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="text-3xl mb-3">🤖</div>
          <h3 class="font-semibold text-gray-900 mb-2">AI 分析</h3>
          <p class="text-gray-600 text-sm">智能識別食物並分析營養</p>
        </div>
        
        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="text-3xl mb-3">📊</div>
          <h3 class="font-semibold text-gray-900 mb-2">健康報告</h3>
          <p class="text-gray-600 text-sm">個人化的飲食建議與報告</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 首頁不需要額外的邏輯
</script>
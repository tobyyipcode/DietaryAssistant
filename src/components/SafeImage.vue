<template>
  <img
    v-if="validUrl"
    :src="validUrl"
    :alt="alt"
    :class="imgClass"
    @error="handleImageError"
  />
  <div
    v-else
    :class="placeholderClass"
  >
    <span class="text-gray-400 text-2xl">{{ placeholder }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { isValidImageUrl } from '@/utils/imageUtils'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: '圖片'
  },
  imgClass: {
    type: String,
    default: ''
  },
  placeholderClass: {
    type: String,
    default: 'bg-gray-200 flex items-center justify-center'
  },
  placeholder: {
    type: String,
    default: '🍽️'
  }
})

const imageError = ref(false)

const validUrl = computed(() => {
  if (imageError.value) {
    return ''
  }
  return isValidImageUrl(props.src) ? props.src : ''
})

const handleImageError = () => {
  console.warn('圖片載入失敗:', props.src)
  imageError.value = true
}
</script>
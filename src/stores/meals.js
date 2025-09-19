import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { smartCompress, getFileSizeInfo, shouldCompress } from '@/utils/imageCompression'

export const useMealsStore = defineStore('meals', () => {
  const meals = ref([])
  const loading = ref(false)
  const analyzing = ref(false)
  const analysisProgress = ref({
    step: '',
    percentage: 0,
    message: ''
  })

  const updateProgress = (step, percentage, message) => {
    analysisProgress.value = {
      step,
      percentage,
      message
    }
  }

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const uploadImage = async (file) => {
    try {
      // 檢查原始文件大小
      const originalSize = getFileSizeInfo(file)
      console.log(`原始文件大小: ${originalSize.formatted}`)
      
      // 智能壓縮
      let processedFile = file
      if (shouldCompress(file, 1)) { // 超過 1MB 就壓縮
        console.log('文件較大，正在壓縮...')
        processedFile = await smartCompress(file)
        const compressedSize = getFileSizeInfo(processedFile)
        console.log(`壓縮後大小: ${compressedSize.formatted}`)
        const reduction = ((originalSize.bytes - processedFile.size) / originalSize.bytes * 100).toFixed(1)
        console.log(`節省空間: ${reduction}%`)
      }
      
      const fileExt = processedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `meals/${fileName}`

      const { data, error } = await supabase.storage
        .from('food-images')
        .upload(filePath, processedFile)

      if (error) {
        console.error('Supabase storage error:', error)
        throw new Error(`圖片上傳失敗: ${error.message}`)
      }
      return filePath
    } catch (error) {
      console.error('Upload image error:', error)
      throw error
    }
  }

  const analyzeFoodImage = async (imageFile) => {
    analyzing.value = true
    updateProgress('start', 0, '開始處理圖片...')
    
    try {
      let imageUrl = ''
      let imagePath = ''
      
      // 步驟 1: 壓縮圖片
      updateProgress('compress', 20, '正在壓縮圖片...')
      await new Promise(resolve => setTimeout(resolve, 500)) // 模擬處理時間
      
      // 嘗試上傳到 Supabase Storage
      try {
        updateProgress('upload', 40, '正在上傳圖片...')
        imagePath = await uploadImage(imageFile)
        
        // 獲取圖片的公開 URL
        const { data: { publicUrl } } = supabase.storage
          .from('food-images')
          .getPublicUrl(imagePath)
        
        imageUrl = publicUrl
        console.log('圖片上傳成功，使用 Supabase URL:', imageUrl)
        updateProgress('uploaded', 60, '圖片上傳成功！')
      } catch (uploadError) {
        console.warn('圖片上傳失敗，嘗試使用替代方案:', uploadError)
        updateProgress('fallback', 50, '使用替代方案處理圖片...')
        
        // 如果上傳失敗，嘗試將圖片轉換為 base64
        try {
          imageUrl = await convertImageToBase64(imageFile)
          console.log('使用 base64 格式進行 AI 分析')
        } catch (base64Error) {
          console.error('base64 轉換也失敗:', base64Error)
          throw new Error('圖片處理失敗，請確認 Supabase Storage 設置正確')
        }
      }

      // 步驟 2: AI 分析
      updateProgress('analyzing', 70, '正在進行 AI 分析...')
      const analysis = await analyzeWithZhipuAI(imageUrl)
      
      // 步驟 3: 完成
      updateProgress('complete', 100, '分析完成！')
      
      return {
        imagePath,
        imageUrl: imagePath ? imageUrl : '', // 只使用 Supabase URL，不使用 blob URL
        analysis
      }
    } catch (error) {
      updateProgress('error', 0, '分析失敗，請重新嘗試')
      console.error('食物分析失敗:', error)
      throw error
    } finally {
      analyzing.value = false
      // 延遲重置進度，讓用戶看到完成狀態
      setTimeout(() => {
        updateProgress('', 0, '')
      }, 2000)
    }
  }

  const analyzeWithZhipuAI = async (imageUrl) => {
    const apiKey = import.meta.env.VITE_ZHIPU_API_KEY
    
    try {
      updateProgress('ai-request', 80, '正在請求 AI 服務...')
      
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'glm-4v',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `請分析這張食物照片，提供以下資訊並以JSON格式返回：
{
  "food_name": "食物名稱",
  "estimated_weight_g": 估計重量(克),
  "calories": 總熱量,
  "nutrition": {
    "protein_g": 蛋白質(克),
    "carbs_g": 碳水化合物(克),
    "fat_g": 脂肪(克),
    "fiber_g": 纖維(克),
    "sugar_g": 糖分(克),
    "sodium_mg": 鈉(毫克)
  },
  "health_advice": "健康建議",
  "meal_type_suggestion": "建議餐點類型(breakfast/lunch/dinner/snack)"
}`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      })

      updateProgress('ai-processing', 90, '正在處理 AI 回應...')

      const data = await response.json()
      
      if (!response.ok) {
        console.error('智譜 AI API 錯誤:', data)
        if (data.error && data.error.message) {
          throw new Error(data.error.message)
        }
        throw new Error(`API 請求失敗: ${response.status}`)
      }

      const content = data.choices[0].message.content
      
      // 嘗試解析 JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        } else {
          throw new Error('無法找到 JSON 格式的回應')
        }
      } catch (parseError) {
        console.warn('JSON 解析失敗，使用預設值:', parseError)
        // 如果無法解析 JSON，返回預設值
        return {
          food_name: '未知食物',
          estimated_weight_g: 100,
          calories: 200,
          nutrition: {
            protein_g: 10,
            carbs_g: 20,
            fat_g: 8,
            fiber_g: 2,
            sugar_g: 5,
            sodium_mg: 300
          },
          health_advice: `AI 分析回應: ${content}`,
          meal_type_suggestion: 'snack'
        }
      }
    } catch (error) {
      console.error('智譜 AI 分析錯誤:', error)
      
      // 返回默認值
      return {
        food_name: '分析失敗',
        estimated_weight_g: 0,
        calories: 0,
        nutrition: {
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
          fiber_g: 0,
          sugar_g: 0,
          sodium_mg: 0
        },
        health_advice: '無法分析此圖片，請嘗試上傳更清晰的食物照片。',
        meal_type_suggestion: 'snack'
      }
    }
  }

  const saveMeal = async (mealData) => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('meals')
        .insert([mealData])
        .select()

      if (error) throw error
      meals.value.unshift(data[0])
      return data[0]
    } catch (error) {
      console.error('保存餐點失敗:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getMeals = async (userId, date = null) => {
    loading.value = true
    try {
      let query = supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (date) {
        const startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)
        
        query = query.gte('created_at', startDate.toISOString())
                     .lte('created_at', endDate.toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      
      meals.value = data
      return data
    } catch (error) {
      console.error('獲取餐點失敗:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteMeal = async (mealId) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)

      if (error) throw error
      
      meals.value = meals.value.filter(meal => meal.id !== mealId)
      return true
    } catch (error) {
      console.error('刪除餐點失敗:', error)
      throw error
    }
  }

  const getDailyNutrition = (date) => {
    const dayMeals = meals.value.filter(meal => {
      const mealDate = new Date(meal.created_at).toDateString()
      const targetDate = new Date(date).toDateString()
      return mealDate === targetDate
    })

    return dayMeals.reduce((total, meal) => ({
      calories: total.calories + (meal.calories || 0),
      protein_g: total.protein_g + (meal.protein_g || 0),
      carbs_g: total.carbs_g + (meal.carbs_g || 0),
      fat_g: total.fat_g + (meal.fat_g || 0),
      fiber_g: total.fiber_g + (meal.fiber_g || 0)
    }), {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0
    })
  }

  return {
    meals,
    loading,
    analyzing,
    analysisProgress,
    analyzeFoodImage,
    saveMeal,
    getMeals,
    deleteMeal,
    getDailyNutrition
  }
})
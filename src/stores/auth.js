import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { setupAutoCleanup } from '@/utils/storageManager'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const profile = ref(null)

  const signUp = async (email, password, metadata = {}) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email, password) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      user.value = data.user
      await getProfile()
      
      // 登入成功後執行自動清理
      try {
        await setupAutoCleanup()
      } catch (cleanupError) {
        console.warn('自動清理失敗:', cleanupError)
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    user.value = null
    profile.value = null
    return { error }
  }

  const getCurrentUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    user.value = currentUser
    if (currentUser) {
      await getProfile()
    }
    return currentUser
  }

  const createProfile = async () => {
    if (!user.value) return null
    
    try {
      const profileData = {
        id: user.value.id,
        full_name: user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()
      
      if (error) {
        console.error('創建 profile 失敗:', error)
        return null
      }
      
      profile.value = data
      return data
    } catch (error) {
      console.error('創建 profile 錯誤:', error)
      return null
    }
  }

  const getProfile = async () => {
    if (!user.value) return null
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .maybeSingle() // 使用 maybeSingle() 而不是 single()
      
      if (error) {
        console.error('Supabase profiles query error:', error)
        // 如果是表不存在或無權限錯誤，嘗試創建 profile
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log('嘗試創建用戶 profile...')
          return await createProfile()
        }
        throw error
      }
      
      if (!data) {
        // 如果沒有 profile 資料，創建一個
        console.log('沒有找到 profile，創建新的...')
        return await createProfile()
      }
      
      profile.value = data
      return data
    } catch (error) {
      console.error('獲取用戶資料失敗:', error)
      return null
    }
  }

  const updateProfile = async (updates) => {
    if (!user.value) return { error: '用戶未登入' }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.value.id,
          updated_at: new Date().toISOString(),
          ...updates
        })
        .select()
        .single()
      
      if (error) throw error
      profile.value = data
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getProfile,
    createProfile,
    updateProfile
  }
})
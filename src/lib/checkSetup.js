import { supabase } from './supabase'

export const checkSupabaseSetup = async () => {
  const status = {
    database: false,
    storage: false,
    auth: false
  }

  try {
    // 檢查認證是否正常
    const { data: { user } } = await supabase.auth.getUser()
    status.auth = true

    // 檢查 profiles 表是否存在
    try {
      await supabase.from('profiles').select('id').limit(1)
      status.database = true
    } catch (error) {
      console.log('Database check failed:', error)
    }

    // 檢查存儲桶是否存在
    try {
      const { data, error } = await supabase.storage.getBucket('food-images')
      if (!error && data) {
        status.storage = true
      }
    } catch (error) {
      console.log('Storage check failed:', error)
    }

  } catch (error) {
    console.log('Setup check failed:', error)
  }

  return status
}

export const getSetupInstructions = (status) => {
  const missing = []
  
  if (!status.database) {
    missing.push('數據庫表')
  }
  
  if (!status.storage) {
    missing.push('存儲桶')
  }

  if (missing.length === 0) {
    return null
  }

  return {
    missing,
    message: `需要設置 ${missing.join(' 和 ')} 才能正常使用所有功能`,
    action: '查看設置指南'
  }
}
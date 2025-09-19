-- 快速驗證 Supabase 設置腳本
-- 在 Supabase SQL Editor 中執行此腳本來驗證所有設置是否正確

-- 1. 檢查數據庫表是否存在
SELECT 
  'profiles' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN '✅ 已創建' 
    ELSE '❌ 缺失' 
  END as status
UNION ALL
SELECT 
  'meals' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meals') 
    THEN '✅ 已創建' 
    ELSE '❌ 缺失' 
  END as status
UNION ALL
SELECT 
  'nutrition_goals' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nutrition_goals') 
    THEN '✅ 已創建' 
    ELSE '❌ 缺失' 
  END as status;

-- 2. 檢查存儲桶是否存在
SELECT 
  'food-images' as bucket_name,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'food-images') 
    THEN '✅ 已創建' 
    ELSE '❌ 缺失' 
  END as status;

-- 3. 檢查存儲政策是否正確設置
SELECT 
  'Storage Policies' as item,
  COUNT(*) || ' 個政策已設置' as status
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE 'food_images%';

-- 4. 檢查 RLS 是否啟用
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS 已啟用' ELSE '❌ RLS 未啟用' END as rls_status
FROM pg_tables 
WHERE tablename IN ('profiles', 'meals', 'nutrition_goals');
-- 檢查和清理 blob URL 的 SQL 腳本
-- 這個腳本會找出並清理包含 blob URL 的記錄

-- 1. 檢查當前有多少記錄包含 blob URL
SELECT 
  'Current blob URL records' as message,
  count(*) as blob_url_count
FROM public.meals 
WHERE image_url LIKE 'blob:%';

-- 2. 顯示這些記錄的詳細信息
SELECT 
  id,
  food_name,
  image_url,
  image_path,
  created_at
FROM public.meals 
WHERE image_url LIKE 'blob:%'
ORDER BY created_at DESC;

-- 3. 清理 blob URL 記錄（將 image_url 設為 NULL）
UPDATE public.meals 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%';

-- 4. 確認清理結果
SELECT 
  'Cleanup completed' as message,
  count(*) as remaining_blob_urls
FROM public.meals 
WHERE image_url LIKE 'blob:%';

-- 5. 顯示正常的記錄統計
SELECT 
  'Normal records summary' as message,
  count(*) as total_meals,
  count(image_url) as meals_with_url,
  count(image_path) as meals_with_path
FROM public.meals;
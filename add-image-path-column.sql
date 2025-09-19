-- 添加 image_path 欄位到 meals 表
-- 執行此腳本來為現有的 meals 表添加 image_path 欄位

-- 1. 添加 image_path 欄位
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS image_path text;

-- 2. 創建一個函數來從 image_url 提取 image_path
CREATE OR REPLACE FUNCTION extract_image_path_from_url(image_url text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- 如果 image_url 為空或不是以 http 開頭，返回 null
  IF image_url IS NULL OR NOT image_url LIKE 'http%' THEN
    RETURN NULL;
  END IF;
  
  -- 從 Supabase Storage URL 中提取路徑
  -- 格式: https://[project].supabase.co/storage/v1/object/public/food-images/[path]
  IF image_url LIKE '%/storage/v1/object/public/food-images/%' THEN
    RETURN substring(image_url from '/food-images/(.*)$');
  END IF;
  
  RETURN NULL;
END;
$$;

-- 3. 為現有記錄填充 image_path
UPDATE public.meals 
SET image_path = extract_image_path_from_url(image_url)
WHERE image_path IS NULL AND image_url IS NOT NULL;

-- 4. 添加索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_meals_image_path ON public.meals(image_path) WHERE image_path IS NOT NULL;

-- 5. 顯示結果
SELECT 
  'Image path migration completed' as message,
  count(*) as total_meals,
  count(image_path) as meals_with_path
FROM public.meals;
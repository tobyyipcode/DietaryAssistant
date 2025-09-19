-- 快速修復 Storage 權限問題
-- 複製並在 Supabase SQL Editor 中執行

-- 確保 bucket 存在並設為 public
UPDATE storage.buckets SET public = true WHERE id = 'food-images';

-- 刪除可能衝突的舊政策
DROP POLICY IF EXISTS "allow_upload" ON storage.objects;
DROP POLICY IF EXISTS "allow_read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public can read" ON storage.objects;
DROP POLICY IF EXISTS "food_images_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "food_images_select_policy" ON storage.objects;

-- 創建簡單的上傳權限
CREATE POLICY "allow_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'food-images');

-- 創建簡單的讀取權限
CREATE POLICY "allow_read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'food-images');

-- 驗證設置
SELECT 'Storage policies updated successfully!' as result;
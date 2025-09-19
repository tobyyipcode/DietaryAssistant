-- Storage 權限政策設置腳本
-- 請在 Supabase SQL Editor 中執行

-- 1. 確保 food-images bucket 存在並設置為 public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. 刪除可能存在的舊政策
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public can read" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload food images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view food images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own food images" ON storage.objects;

-- 3. 創建新的政策：允許認證用戶上傳
CREATE POLICY "food_images_upload_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'food-images');

-- 4. 創建新的政策：允許所有人查看
CREATE POLICY "food_images_select_policy" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'food-images');

-- 5. 創建新的政策：允許認證用戶刪除自己的文件
CREATE POLICY "food_images_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. 驗證政策是否創建成功
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE 'food_images%';
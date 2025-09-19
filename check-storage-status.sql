-- 檢查 Storage 配置狀態
-- 在 Supabase SQL Editor 中執行此腳本來診斷問題

-- 1. 檢查 bucket 是否存在並且設置正確
SELECT 
    id, 
    name, 
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'food-images';

-- 2. 檢查現有的 Storage 權限政策
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%upload%' OR policyname LIKE '%read%' OR policyname LIKE '%food%';

-- 3. 檢查是否啟用了 RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 4. 簡單測試（如果政策存在，這應該會顯示結果）
SELECT 'Storage configuration check completed!' as status;
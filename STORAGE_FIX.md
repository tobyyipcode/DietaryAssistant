# 🚨 立即修復：Supabase Storage 設置

## 問題診斷
錯誤信息：`GET /storage/v1/bucket/food-images 400 (Bad Request)`
**原因**：`food-images` 存儲桶尚未創建

## 🔧 立即修復步驟

### 方法 A：使用診斷頁面自動修復（推薦）
1. 在應用中訪問 **🔧 診斷** 頁面
2. 在 Supabase 連接測試區域中，點擊 **自動創建存儲桶** 按鈕
3. 等待自動創建完成
4. 點擊 **重新測試** 確認狀態

### 方法 B：手動在 Dashboard 創建

### 步驟 1：創建 Storage Bucket
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的項目 (`xgwxiznzpsojakbkaiqf`)
3. 點擊左側菜單的 **Storage**
4. 點擊 **Create a new bucket**
5. 填寫以下設置：
   - **Name**: `food-images`
   - **Public bucket**: ✅ **必須勾選**
   - **File size limit**: 50MB (預設即可)
   - **Allowed MIME types**: `image/*` (預設即可)
6. 點擊 **Create bucket**

### 步驟 2：設置 Storage 權限政策
1. 創建 bucket 後，點擊 **Policies** 標籤
2. 點擊 **New policy**
3. 選擇 **Get started quickly** 模板
4. 選擇 **Enable insert for authenticated users only**
5. 確認政策名稱：`Enable insert for authenticated users only`
6. 點擊 **Review** → **Save policy**

### 步驟 3：驗證設置
1. 回到您的應用程序
2. 訪問 **🔧 診斷** 頁面
3. 點擊 **重新測試** 按鈕
4. 確認 **存儲服務** 顯示為 ✅ **正常**

## 📋 替代方案：SQL 自動創建（如果手動創建失敗）

如果手動創建有問題，可以在 Supabase SQL Editor 中執行：

```sql
-- 創建存儲桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'food-images', 
  'food-images', 
  true, 
  52428800, -- 50MB
  ARRAY['image/*']
) ON CONFLICT (id) DO NOTHING;

-- 創建插入權限政策
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'food-images');

-- 創建查看權限政策  
CREATE POLICY IF NOT EXISTS "Give users access to own folder" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'food-images');

-- 創建公開查看權限政策
CREATE POLICY IF NOT EXISTS "Public read access" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'food-images');
```

## ✅ 成功標誌
- 診斷頁面顯示存儲服務 ✅ 正常
- 可以成功上傳食物照片
- AI 分析功能正常工作

## 🆘 如果仍有問題
1. 檢查 Supabase 項目 URL 和 API Key 是否正確
2. 確認網路連接穩定
3. 嘗試重新整理瀏覽器
4. 查看瀏覽器控制台是否有其他錯誤

立即按照步驟 1 創建存儲桶即可解決問題！
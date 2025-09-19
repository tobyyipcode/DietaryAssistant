# Blob URL 錯誤修復指南

## 🐛 問題說明

您遇到的 blob URL 錯誤（`net::ERR_FILE_NOT_FOUND`）是由於數據庫中存儲了臨時的 blob URL，這些 URL 在瀏覽器重新加載後就失效了。

```
blob:http://localhost:5173/f225613c-4976-4732-925e-e9a8850e50a2 net::ERR_FILE_NOT_FOUND
```

## 🔧 修復步驟

### 1. 清理數據庫中的 blob URL（必須執行）

在 Supabase Dashboard 的 SQL Editor 中執行以下腳本：

```sql
-- 檢查和清理 blob URL
SELECT 'Current blob URL records' as message, count(*) as blob_url_count
FROM public.meals WHERE image_url LIKE 'blob:%';

-- 清理 blob URL（設為 NULL）
UPDATE public.meals 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%';

-- 確認清理結果
SELECT 'Cleanup completed' as message, count(*) as remaining_blob_urls
FROM public.meals WHERE image_url LIKE 'blob:%';
```

**或者直接執行 `cleanup-blob-urls.sql` 文件。**

### 2. 執行數據庫遷移（如果還沒執行）

如果您還沒有執行過數據庫遷移，請執行：

```sql
-- 添加 image_path 欄位
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS image_path text;

-- 為現有記錄填充 image_path
UPDATE public.meals 
SET image_path = substring(image_url from '/food-images/(.*)$')
WHERE image_path IS NULL 
  AND image_url IS NOT NULL 
  AND image_url LIKE '%/food-images/%';
```

### 3. 刷新應用

執行上述 SQL 後，刷新瀏覽器頁面，blob URL 錯誤應該消失。

## 🛠️ 已實施的代碼修復

### 1. 前端圖片顯示保護
- 創建了 `SafeImage` 組件，自動過濾 blob URL
- 更新了 Dashboard 和 Meals 頁面使用安全組件
- 增加了圖片載入錯誤處理

### 2. Blob URL 管理優化
- 創建了 `imageUtils.js` 工具函數
- 實現了安全的 blob URL 創建和清理
- 優化了 Upload 組件的 URL 處理邏輯

### 3. 存儲管理器修復
- 修復了路徑提取邏輯
- 支持從 `image_url` 或 `image_path` 獲取存儲路徑
- 優化了清理功能的可靠性

## 🔄 預防措施

### 1. 新圖片上傳流程
現在的流程確保不會再保存 blob URL：
1. 用戶選擇圖片 → 創建臨時 blob URL（僅用於預覽）
2. 圖片上傳到 Supabase → 獲得永久 URL
3. 保存到數據庫 → 同時保存 `image_url` 和 `image_path`
4. 清理臨時 blob URL

### 2. 圖片顯示邏輯
- 使用 `SafeImage` 組件自動過濾無效 URL
- 自動顯示佔位符當圖片無法載入時
- 增加錯誤處理避免控制台錯誤

### 3. 存儲清理功能
- 智能路徑提取支持多種 URL 格式
- 優先使用 `image_path`，確保清理功能正常
- 增加錯誤處理和日誌記錄

## 📊 修復效果

執行修復後：
- ✅ 不再有 blob URL 404 錯誤
- ✅ 圖片顯示正常（有效 URL）或顯示佔位符（無效 URL）
- ✅ 存儲清理功能正常工作
- ✅ 新上傳的圖片使用永久 URL

## 🚨 重要提醒

1. **必須執行數據庫清理**：不執行 SQL 腳本，blob URL 錯誤會持續出現
2. **一次性操作**：數據庫清理只需執行一次
3. **數據安全**：清理只會將 blob URL 設為 NULL，不會刪除餐點記錄
4. **未來保護**：代碼修復確保不會再次產生此問題

執行完所有步驟後，您的應用將完全擺脫 blob URL 問題，並且更加穩定可靠！
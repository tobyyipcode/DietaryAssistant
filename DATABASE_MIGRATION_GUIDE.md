# 數據庫遷移和錯誤修復指南

## 🔧 修復步驟

### 1. 執行數據庫遷移（必須）

由於您遇到了 `column meals.image_path does not exist` 錯誤，需要執行數據庫遷移：

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的項目
3. 進入 **SQL Editor**
4. 執行 `add-image-path-column.sql` 文件中的 SQL 腳本

**或者直接複製以下 SQL 並執行：**

```sql
-- 添加 image_path 欄位到 meals 表
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS image_path text;

-- 創建函數從 image_url 提取 image_path
CREATE OR REPLACE FUNCTION extract_image_path_from_url(image_url text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF image_url IS NULL OR NOT image_url LIKE 'http%' THEN
    RETURN NULL;
  END IF;
  
  IF image_url LIKE '%/storage/v1/object/public/food-images/%' THEN
    RETURN substring(image_url from '/food-images/(.*)$');
  END IF;
  
  RETURN NULL;
END;
$$;

-- 為現有記錄填充 image_path
UPDATE public.meals 
SET image_path = extract_image_path_from_url(image_url)
WHERE image_path IS NULL AND image_url IS NOT NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_meals_image_path ON public.meals(image_path) WHERE image_path IS NOT NULL;
```

### 2. 驗證修復

執行遷移後，重新刷新應用頁面，錯誤應該會消失。

## 🐛 已修復的問題

### 1. 數據庫欄位不匹配
- **問題：** `column meals.image_path does not exist`
- **原因：** 存儲管理器查詢 `image_path` 欄位，但數據庫表只有 `image_url`
- **解決：** 添加 `image_path` 欄位並同時支援兩種格式

### 2. Blob URL 錯誤
- **問題：** `GET blob:http://localhost:5173/xxx net::ERR_FILE_NOT_FOUND`
- **原因：** 使用 `URL.createObjectURL()` 創建的 blob URL 被過早釋放
- **解決：** 優先使用 Supabase 的公開 URL，避免 blob URL

### 3. 存儲路徑提取問題
- **問題：** 清理功能無法從 URL 中正確提取存儲路徑
- **原因：** 需要從完整 URL 中提取相對路徑用於刪除操作
- **解決：** 實現 `extractStoragePathFromUrl()` 和 `getImageStoragePath()` 函數

## 🎯 優化效果

### 1. 智能圖片壓縮
- ✅ 超過 1MB 的圖片自動壓縮
- ✅ WebP 格式優先（節省 25-35% 空間）
- ✅ 壓縮品質根據文件大小智能調整

### 2. 自動清理機制
- ✅ 30 天前的圖片自動清理
- ✅ 每用戶最多保留 100 張圖片
- ✅ 每日登入時自動執行清理

### 3. 存儲監控
- ✅ 實時顯示存儲使用情況
- ✅ 使用量警告（70%、80%、90%）
- ✅ 一鍵清理功能

## 📊 預期節省效果

- **圖片壓縮：** 60-80% 空間節省
- **格式優化：** WebP 額外節省 30% 空間
- **自動清理：** 避免無限制增長
- **總體效果：** 在 Supabase 1GB 限制內支持更多用戶

## 🔄 後續使用

修復完成後，您可以：

1. **查看存儲狀況**：
   - 在儀表板點擊「查看存儲狀況」
   - 在個人資料頁面查看詳細配額

2. **手動清理**：
   - 使用「智能清理」一鍵優化
   - 或選擇特定的清理策略

3. **調整設定**：
   - 在個人資料頁面調整存儲偏好
   - 設定最大圖片保存數量

## 🚨 注意事項

- 數據庫遷移是**一次性操作**，執行一次即可
- 現有的圖片記錄會自動更新 `image_path` 欄位
- 新上傳的圖片會同時保存 URL 和路徑
- 清理操作不可逆，請謹慎使用
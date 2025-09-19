# 🔧 DietaryAssistant 設置修復指南

## 🚨 當前問題
- **設置提醒**: 需要設置 Supabase 數據庫表和存儲桶才能正常使用應用功能
- **保存失敗**: AI 分析運作正常，但儲存時出現問題

## 📋 修復步驟清單

### ✅ 第一步：執行數據庫設置腳本

1. **打開 Supabase Dashboard**
   - 訪問 [supabase.com](https://supabase.com/dashboard)
   - 登錄並選擇你的項目

2. **執行主設置腳本**
   - 點擊左側菜單 **"SQL Editor"**
   - 點擊 **"New Query"**
   - 複製 `supabase-setup.sql` 文件的全部內容
   - 粘貼到編輯器中
   - 點擊 **"Run"** 執行

3. **執行存儲權限腳本**
   - 在 SQL Editor 中新建另一個查詢
   - 複製 `storage-policies.sql` 文件的全部內容
   - 粘貼並執行

### ✅ 第二步：驗證設置

1. **執行驗證腳本**
   - 在 SQL Editor 中新建查詢
   - 複製 `verify-setup.sql` 文件內容
   - 執行並檢查結果

2. **預期驗證結果**
   ```
   profiles        ✅ 已創建
   meals          ✅ 已創建  
   nutrition_goals ✅ 已創建
   food-images    ✅ 已創建
   Storage Policies  3 個政策已設置
   RLS Status     ✅ RLS 已啟用
   ```

### ✅ 第三步：手動檢查存儲桶

1. **在 Supabase Dashboard 中**
   - 點擊左側 **"Storage"**
   - 確認存在 `food-images` 存儲桶
   - 確認存儲桶標記為 **"Public"**

2. **如果存儲桶不存在，手動創建**
   - 點擊 **"Create bucket"**
   - Name: `food-images`
   - Public bucket: ✅ **必須勾選**
   - File size limit: 50MB
   - Allowed MIME types: `image/*`

### ✅ 第四步：測試應用功能

1. **刷新應用頁面**
   - 重新加載你的應用
   - 查看設置提醒是否消失

2. **測試上傳功能**
   - 訪問 **"📸 上傳餐點"** 頁面
   - 選擇一張食物圖片
   - 點擊 **"🤖 AI 分析"**
   - 完成分析後點擊 **"💾 保存餐點"**

## 🔍 故障診斷

### 問題 A：仍然顯示設置提醒
**解決方案**：
1. 檢查是否所有 SQL 腳本都執行成功
2. 確認 `.env` 檔案中的 Supabase URL 和 Key 正確
3. 在瀏覽器中按 `F12` 打開開發者工具，查看 Console 是否有錯誤

### 問題 B：保存餐點時仍然失敗
**可能原因**：
1. **存儲權限不正確** - 重新執行 `storage-policies.sql`
2. **數據庫權限問題** - 確認 RLS 政策已正確設置
3. **網路連接問題** - 檢查網路連接

**解決步驟**：
1. 訪問應用中的 **"🔧 診斷"** 頁面（如果有）
2. 查看各項狀態指示器
3. 如果存儲顯示異常，重新執行存儲設置腳本

### 問題 C：上傳圖片失敗
**檢查項目**：
1. **存儲桶設置**：
   - 確認 `food-images` 存儲桶存在
   - 確認設置為 Public
   - 確認檔案大小限制合理（建議 50MB）

2. **權限政策**：
   ```sql
   -- 檢查現有政策
   SELECT policyname, cmd, roles 
   FROM pg_policies 
   WHERE tablename = 'objects' 
   AND policyname LIKE 'food_images%';
   ```

## 📞 需要幫助？

如果按照以上步驟仍然無法解決問題：

1. **檢查瀏覽器控制台**
   - 按 `F12` 打開開發者工具
   - 切換到 "Console" 標籤
   - 截圖任何紅色錯誤訊息

2. **檢查 Supabase 項目設置**
   - 確認項目 URL 格式：`https://[項目ID].supabase.co`
   - 確認使用的是 "anon/public" key，不是 "service_role" key

3. **重啟開發伺服器**
   ```bash
   # 停止當前伺服器 (Ctrl+C)
   # 然後重新啟動
   npm run dev
   ```

## ✅ 設置成功標誌

當一切設置正確時，你應該能夠：
- ✅ 應用中不再顯示設置提醒
- ✅ 成功上傳圖片並進行 AI 分析
- ✅ 保存餐點記錄到數據庫
- ✅ 在「餐點記錄」頁面查看歷史記錄
- ✅ 在儀表板查看今日營養統計

**恭喜！你的 DietaryAssistant 應用現在已經完全可用了！** 🎉
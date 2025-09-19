# 🚨 快速修復：存儲桶不存在

## 錯誤
```
GET /storage/v1/bucket/food-images 400 (Bad Request)
```

## 💡 解決方案

### 🎯 最簡單的方法：

1. **開啟 Supabase Dashboard**
   - 訪問：https://supabase.com/dashboard
   - 登入您的帳戶
   - 選擇項目：`xgwxiznzpsojakbkaiqf`

2. **創建存儲桶**
   - 點擊左側 **Storage**
   - 點擊 **Create a new bucket**
   - 名稱：`food-images`
   - **勾選 Public bucket** ✅
   - 點擊 **Create bucket**

3. **完成！**
   - 回到應用的診斷頁面
   - 點擊「重新測試」
   - 確認存儲服務變為綠色 ✅

## 🔄 或者使用應用內自動修復

在診斷頁面點擊 **「自動創建存儲桶」** 按鈕

---

**完成後立即可以使用圖片上傳功能！** 🎉
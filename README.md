# 個人飲食助理 🥗

一個基於 Vue 3 + Supabase 的個人飲食追蹤應用，使用 AI 智能分析食物營養成分。

## 功能特色

- 📸 **拍照上傳**：簡單拍照上傳餐點照片
- 🤖 **AI 智能分析**：使用智譜 AI 自動識別食物並分析營養成分
- 📊 **營養追蹤**：詳細記錄每日熱量、蛋白質、碳水化合物、脂肪攝取
- 📈 **健康報告**：個人化的飲食建議和健康指標
- 👤 **用戶管理**：完整的註冊、登入、個人資料管理
- 📱 **響應式設計**：支援桌面和移動設備

## 技術架構

### 前端
- **Vue 3** + Composition API
- **Tailwind CSS** - 現代化 UI 設計
- **Vite** - 快速開發建構工具
- **Pinia** - 狀態管理
- **Vue Router** - 路由管理

### 後端服務
- **Supabase** - 後端即服務 (BaaS)
  - 用戶認證與授權
  - PostgreSQL 數據庫
  - 文件存儲
  - 實時數據同步

### AI 服務
- **智譜 AI (GLM-4V)** - 中文食物識別（完全免費）
- **Hugging Face** - 備用 AI 服務
- **Google Vision API** - 圖像識別服務

### 部署
- **Netlify** - 前端部署平台（免費）

## 快速開始

### 1. 克隆項目
```bash
git clone <項目地址>
cd DietaryAssistant
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 環境變數設置
複製 `.env` 文件並配置您的 API 密鑰：

```env
# Supabase 配置
VITE_SUPABASE_URL=你的_supabase_url
VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key

# AI 服務 API 密鑰
VITE_ZHIPU_API_KEY=你的_智譜_api_key
VITE_HUGGINGFACE_API_KEY=你的_huggingface_api_key
VITE_GOOGLE_VISION_API_KEY=你的_google_vision_api_key
```

### 4. 設置 Supabase 數據庫
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 創建新項目
3. 在 SQL Editor 中執行 `supabase-setup.sql` 腳本
4. 在 Storage 中創建 `food-images` bucket 並設置為 public

### 5. 啟動開發服務器
```bash
npm run dev
```

應用將在 http://localhost:5173 啟動

### 6. 建構部署
```bash
npm run build
```

## API 密鑰獲取指南

### Supabase 設置
1. 註冊 [Supabase](https://supabase.com/)
2. 創建新項目
3. 在 Settings > API 中找到項目 URL 和 anon key

### 智譜 AI（推薦，完全免費）
1. 註冊 [智譜 AI](https://open.bigmodel.cn/)
2. 創建 API Key
3. 對中文食物識別準確度最高

### Hugging Face（免費額度）
1. 註冊 [Hugging Face](https://huggingface.co/)
2. 在 Settings > Access Tokens 中創建 token
3. 免費額度：30,000 次請求/月

### Google Vision API（免費額度）
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建項目並啟用 Vision API
3. 創建 API Key
4. 免費額度：1,000 次請求/月

## 部署到 Netlify

### 自動部署（推薦）
1. 將代碼推送到 GitHub
2. 登入 [Netlify](https://netlify.com/)
3. 連接 GitHub 倉庫
4. 設置環境變數
5. 部署完成！

### 手動部署
1. 執行 `npm run build`
2. 將 `dist` 文件夾上傳到 Netlify

## 成本分析

### 免費額度
- **Supabase**: 50,000 行數據，500MB 存儲，2GB 傳輸
- **Netlify**: 100GB 流量/月，300 分鐘建構時間
- **智譜 AI**: 完全免費，無限制
- **Hugging Face**: 30,000 次 API 調用/月
- **Google Vision**: 1,000 次請求/月

### 低成本升級選項
- **Supabase Pro**: $25/月 (500 萬行，8GB 存儲)
- **Netlify Pro**: $19/月 (1TB 流量)

## 功能截圖

### 首頁
- 簡潔的介紹頁面
- 註冊/登入入口

### 儀表板
- 今日營養統計
- 快速操作按鈕
- 餐點記錄概覽

### 上傳餐點
- 拖拽上傳圖片
- AI 智能分析
- 營養成分顯示

### 餐點記錄
- 歷史記錄查看
- 日期篩選
- 營養統計

### 個人資料
- 基本資料管理
- BMI 計算
- 健康目標設定

## 開發指南

### 項目結構
```
src/
├── components/     # 可重用組件
├── views/         # 頁面組件
├── stores/        # Pinia 狀態管理
├── router/        # Vue Router 配置
├── lib/          # 工具函數和配置
└── style.css     # 全局樣式
```

### 添加新功能
1. 在適當的目錄創建新組件
2. 更新路由配置（如需要）
3. 添加到導航菜單（如需要）
4. 更新狀態管理（如需要）

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License

## 聯繫

如有問題，請通過 Issue 聯繫。
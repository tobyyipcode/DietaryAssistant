# 🚨 緊急修復指南

您的應用遇到以下問題，需要立即設置 Supabase：

## 問題 1: 數據庫表未創建
**錯誤**: `Cannot coerce the result to a single JSON object`
**原因**: profiles 表不存在

## 問題 2: 存儲桶未創建
**錯誤**: `POST /storage/v1/object/food-images/meals/ 400 (Bad Request)`
**原因**: food-images 存儲桶不存在

## 🔧 立即修復步驟

### 第一步：設置數據庫
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的項目
3. 點擊左側菜單 **SQL Editor**
4. 點擊 **New query**
5. 複製貼上以下 SQL 代碼並執行：

```sql
-- 創建用戶資料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  age integer,
  height_cm integer,
  weight_kg numeric(5,1),
  activity_level text DEFAULT 'moderate',
  target_calories integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- 創建餐點記錄表
CREATE TABLE IF NOT EXISTS public.meals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  food_name text NOT NULL,
  image_url text,
  calories integer DEFAULT 0,
  protein_g numeric(5,2) DEFAULT 0,
  carbs_g numeric(5,2) DEFAULT 0,
  fat_g numeric(5,2) DEFAULT 0,
  fiber_g numeric(5,2) DEFAULT 0,
  sugar_g numeric(5,2) DEFAULT 0,
  sodium_mg numeric(7,2) DEFAULT 0,
  estimated_weight_g integer DEFAULT 0,
  ai_analysis jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 啟用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- 創建政策
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own meals" ON public.meals
  FOR ALL USING (auth.uid() = user_id);

-- 自動創建用戶資料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 第二步：創建存儲桶和設置權限
1. 在 Supabase Dashboard 中點擊 **Storage**
2. 點擊 **Create a new bucket**
3. 輸入名稱：`food-images`
4. **重要**: 勾選 **Public bucket** ✅
5. 點擊 **Create bucket**
6. 在 **Policies** 頁籤中點擊 **New policy**
7. 選擇 **Custom** 並輸入以下政策：

```sql
-- 創建 Storage 權限政策
INSERT INTO storage.buckets (id, name, public) 
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 允許認證用戶上傳圖片
CREATE POLICY "Users can upload food images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'food-images' AND 
    auth.role() = 'authenticated'
  );

-- 允許所有人查看圖片
CREATE POLICY "Anyone can view food images" ON storage.objects
  FOR SELECT USING (bucket_id = 'food-images');

-- 允許用戶刪除自己的圖片
CREATE POLICY "Users can delete own food images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'food-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 第三步：重新測試應用
1. 重新整理瀏覽器頁面
2. 嘗試註冊新用戶或登入現有用戶
3. 測試上傳食物照片功能

## ✅ 驗證設置成功
- 登入後不再出現 "獲取用戶資料失敗" 錯誤
- 可以成功上傳圖片進行 AI 分析
- 餐點記錄可以正常保存

## 🆘 如果還有問題
請檢查：
1. 您是否使用了正確的 Supabase URL 和 API Key
2. 存儲桶是否設置為 public
3. 網路連接是否正常
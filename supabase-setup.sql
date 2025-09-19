-- 個人飲食助理數據庫設置腳本
-- 請在 Supabase Dashboard 的 SQL Editor 中執行此腳本

-- 1. 創建用戶資料表 (擴展 auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  age integer,
  height_cm integer,
  weight_kg numeric(5,1),
  activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  target_calories integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 2. 創建餐點記錄表
CREATE TABLE IF NOT EXISTS public.meals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  food_name text NOT NULL,
  image_url text,
  calories integer,
  protein_g numeric(5,2),
  carbs_g numeric(5,2),
  fat_g numeric(5,2),
  fiber_g numeric(5,2),
  sugar_g numeric(5,2),
  sodium_mg numeric(7,2),
  estimated_weight_g integer,
  ai_analysis jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 創建營養目標表
CREATE TABLE IF NOT EXISTS public.nutrition_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  target_calories integer NOT NULL,
  target_protein_g numeric(5,2),
  target_carbs_g numeric(5,2),
  target_fat_g numeric(5,2),
  target_fiber_g numeric(5,2),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 創建存儲桶 (在 Storage 中)
-- 這個需要在 Supabase Dashboard 的 Storage 部分手動創建
-- 創建名為 'food-images' 的 bucket，設置為 public

-- 5. 創建 Storage 權限政策
-- 允許認證用戶上傳圖片到 food-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 創建 Storage 政策：允許認證用戶上傳
DROP POLICY IF EXISTS "Users can upload food images" ON storage.objects;
CREATE POLICY "Users can upload food images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'food-images' AND 
    auth.role() = 'authenticated'
  );

-- 創建 Storage 政策：允許所有人查看（因為 bucket 是 public）
DROP POLICY IF EXISTS "Anyone can view food images" ON storage.objects;
CREATE POLICY "Anyone can view food images" ON storage.objects
  FOR SELECT USING (bucket_id = 'food-images');

-- 創建 Storage 政策：允許用戶刪除自己的圖片
DROP POLICY IF EXISTS "Users can delete own food images" ON storage.objects;
CREATE POLICY "Users can delete own food images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'food-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. 啟用 RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;

-- 6. 創建 RLS 政策 - profiles 表
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. 創建 RLS 政策 - meals 表
DROP POLICY IF EXISTS "Users can view own meals" ON public.meals;
CREATE POLICY "Users can view own meals" ON public.meals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meals" ON public.meals;
CREATE POLICY "Users can insert own meals" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meals" ON public.meals;
CREATE POLICY "Users can update own meals" ON public.meals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meals" ON public.meals;
CREATE POLICY "Users can delete own meals" ON public.meals
  FOR DELETE USING (auth.uid() = user_id);

-- 8. 創建 RLS 政策 - nutrition_goals 表
DROP POLICY IF EXISTS "Users can view own nutrition goals" ON public.nutrition_goals;
CREATE POLICY "Users can view own nutrition goals" ON public.nutrition_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own nutrition goals" ON public.nutrition_goals;
CREATE POLICY "Users can manage own nutrition goals" ON public.nutrition_goals
  FOR ALL USING (auth.uid() = user_id);

-- 9. 創建觸發器自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 應用觸發器到 profiles 表
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 應用觸發器到 nutrition_goals 表
DROP TRIGGER IF EXISTS on_nutrition_goals_updated ON public.nutrition_goals;
CREATE TRIGGER on_nutrition_goals_updated
  BEFORE UPDATE ON public.nutrition_goals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 10. 創建自動創建用戶資料的觸發器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- 當新用戶註冊時自動創建 profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 完成設置提示
SELECT 'Supabase 數據庫設置完成！請確保在 Storage 中創建 food-images bucket 並設置為 public。' as message;

-- 創建一個函數來自動創建存儲桶
CREATE OR REPLACE FUNCTION create_food_images_bucket()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 嘗試創建存儲桶
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'food-images', 
    'food-images', 
    true, 
    52428800, -- 50MB
    ARRAY['image/*']
  ) ON CONFLICT (id) DO NOTHING;
  
  -- 創建政策（如果不存在）
  INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, roles)
  VALUES (
    'food-images-insert-policy',
    'food-images',
    'Enable insert for authenticated users',
    'bucket_id = ''food-images'' AND auth.role() = ''authenticated''',
    'bucket_id = ''food-images'' AND auth.role() = ''authenticated''',
    'INSERT',
    ARRAY['authenticated']
  ) ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, roles)
  VALUES (
    'food-images-select-policy',
    'food-images', 
    'Public read access',
    'bucket_id = ''food-images''',
    'bucket_id = ''food-images''',
    'SELECT',
    ARRAY['anon', 'authenticated']
  ) ON CONFLICT (id) DO NOTHING;
  
  RETURN 'food-images bucket created successfully';
END;
$$;
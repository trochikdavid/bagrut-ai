-- Bagrut-AI Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table (content management)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_type TEXT NOT NULL CHECK (module_type IN ('module-a', 'module-b', 'module-c')),
    text TEXT NOT NULL,
    text_he TEXT NOT NULL,
    category TEXT,
    video_url TEXT,
    video_title TEXT,
    video_title_he TEXT,
    video_transcript TEXT,  -- Transcript of YouTube video for AI analysis
    parent_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practices table
CREATE TABLE IF NOT EXISTS practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('module-a', 'module-b', 'module-c', 'simulation')),
    status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
    total_score INTEGER,
    module_scores JSONB,
    scores JSONB,
    feedback JSONB,
    improvements TEXT[],
    strengths TEXT[],
    duration INTEGER,
    module_a_info JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Practice Questions (per-question analysis)
CREATE TABLE IF NOT EXISTS practice_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    question_id TEXT NOT NULL,
    question_text TEXT,
    question_text_he TEXT,
    transcript TEXT,
    duration INTEGER,
    scores JSONB,
    feedback JSONB,
    total_score INTEGER,
    recording_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Practices policies
CREATE POLICY "Users can view own practices" ON practices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practices" ON practices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practices" ON practices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practices" ON practices
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all practices" ON practices
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Practice questions policies
CREATE POLICY "Users can manage own practice questions" ON practice_questions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM practices WHERE practices.id = practice_id AND practices.user_id = auth.uid())
    );

CREATE POLICY "Admins can view all practice questions" ON practice_questions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Questions policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can read questions" ON questions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage questions" ON questions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'student'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for recordings
CREATE POLICY "Users can upload own recordings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own recordings" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own recordings" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Seed initial questions (optional - you can modify these)
INSERT INTO questions (module_type, text, text_he, category) VALUES
    ('module-a', 'Tell me about your favorite hobby and why you enjoy it.', 'ספר/י על התחביב האהוב עליך ומדוע את/ה נהנה/ית ממנו.', 'personal'),
    ('module-a', 'What do you think about social media and its impact on teenagers?', 'מה דעתך על רשתות חברתיות והשפעתן על בני נוער?', 'opinion'),
    ('module-a', 'Describe a memorable trip or vacation you have taken.', 'תאר/י טיול או חופשה בלתי נשכחים שעשית.', 'personal'),
    ('module-a', 'Do you think students should wear school uniforms? Explain your opinion.', 'האם לדעתך תלמידים צריכים ללבוש מדים? הסבר/י את דעתך.', 'opinion'),
    ('module-a', 'Tell me about a person who has influenced your life and how.', 'ספר/י על אדם שהשפיע על חייך וכיצד.', 'personal'),
    ('module-a', 'What are the advantages and disadvantages of learning online?', 'מהם היתרונות והחסרונות של למידה מקוונת?', 'opinion'),
    ('module-b', 'Describe your project and explain why you chose this topic.', 'תאר/י את הפרויקט שלך והסבר/י מדוע בחרת בנושא זה.', NULL),
    ('module-b', 'What challenges did you face while working on your project?', 'אילו אתגרים נתקלת בהם במהלך העבודה על הפרויקט שלך?', NULL),
    ('module-b', 'What did you learn from doing this project?', 'מה למדת מהכנת הפרויקט הזה?', NULL),
    ('module-b', 'If you could change something about your project, what would it be?', 'אם היית יכול/ה לשנות משהו בפרויקט שלך, מה היה זה?', NULL)
ON CONFLICT DO NOTHING;

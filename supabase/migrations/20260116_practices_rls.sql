-- Add RLS policies for practices table

-- Allow authenticated users to insert their own practices
DROP POLICY IF EXISTS "Users can insert own practices" ON practices;
CREATE POLICY "Users can insert own practices" ON practices
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own practices
DROP POLICY IF EXISTS "Users can view own practices" ON practices;
CREATE POLICY "Users can view own practices" ON practices
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own practices
DROP POLICY IF EXISTS "Users can update own practices" ON practices;
CREATE POLICY "Users can update own practices" ON practices
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own practices
DROP POLICY IF EXISTS "Users can delete own practices" ON practices;
CREATE POLICY "Users can delete own practices" ON practices
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Same for practice_questions
DROP POLICY IF EXISTS "Users can insert own practice questions" ON practice_questions;
CREATE POLICY "Users can insert own practice questions" ON practice_questions
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM practices 
        WHERE practices.id = practice_questions.practice_id 
        AND practices.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can view own practice questions" ON practice_questions;
CREATE POLICY "Users can view own practice questions" ON practice_questions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM practices 
        WHERE practices.id = practice_questions.practice_id 
        AND practices.user_id = auth.uid()
    )
);

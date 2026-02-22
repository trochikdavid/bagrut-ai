import { createClient } from "@supabase/supabase-js"
import fs from "fs"

const supabaseUrl = "https://sjyororqyzzxyygafleg.supabase.co"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeW9yb3JxeXp6eHl5Z2FmbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDIyNDksImV4cCI6MjA4Mzk3ODI0OX0.j21G2oaoFODFICd5_wONxTx8BF6m7ZLkSLWa7kQ3pFA" // fallback to anon

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('execute_sql_query', {
    query: `
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS terms_version TEXT,
      ADD COLUMN IF NOT EXISTS privacy_agreed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS privacy_version TEXT,
      ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT false;
    `
  })
  
  // also run handle_new_user update
  await supabase.rpc('execute_sql_query', {
    query: `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO public.profiles (
            id, 
            name, 
            email, 
            role,
            terms_agreed,
            terms_version,
            privacy_agreed,
            privacy_version,
            is_adult
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
            NEW.email,
            'student',
            COALESCE((NEW.raw_user_meta_data->>'terms_agreed')::boolean, false),
            NEW.raw_user_meta_data->>'terms_version',
            COALESCE((NEW.raw_user_meta_data->>'privacy_agreed')::boolean, false),
            NEW.raw_user_meta_data->>'privacy_version',
            COALESCE((NEW.raw_user_meta_data->>'is_adult')::boolean, false)
        );
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });
  console.log("Error:", error)
}
run();

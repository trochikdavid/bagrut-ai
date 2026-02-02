-- Add video_transcript column to questions table
-- This field stores the YouTube video transcript for Module C questions
-- It will be used in the future for AI-based answer analysis

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS video_transcript TEXT;

-- Add comment for documentation
COMMENT ON COLUMN questions.video_transcript IS 'Transcript of the YouTube video for Module C questions. Used for AI analysis.';

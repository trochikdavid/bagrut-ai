-- Background Processing Migration
-- Adds processing status tracking to practices table

-- Add processing status column
ALTER TABLE practices 
ADD COLUMN IF NOT EXISTS processing_status TEXT 
DEFAULT 'pending' 
CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add error message column for failed processing
ALTER TABLE practices 
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Add index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_practices_processing_status 
ON practices(processing_status) WHERE processing_status != 'completed';

-- Enable realtime for practices table (for live status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE practices;

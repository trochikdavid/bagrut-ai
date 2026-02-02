-- Migration: Add function to get practiced question IDs per user
-- Created: 2026-02-01
-- Purpose: Support smart question selection that prioritizes unpracticed questions

-- Helper function to get practiced question IDs for a user per module
-- This tracks questions across ALL practice types (module-specific + simulation)
CREATE OR REPLACE FUNCTION get_practiced_question_ids(user_uuid UUID, module_type TEXT)
RETURNS TABLE(question_id TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT pq.question_id
    FROM practice_questions pq
    JOIN practices p ON pq.practice_id = p.id
    WHERE p.user_id = user_uuid
      AND p.status = 'completed'
      AND (
        -- Module-specific practice
        p.type = module_type
        -- OR simulation (contains all modules)
        OR p.type = 'simulation'
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_practiced_question_ids(UUID, TEXT) TO authenticated;

-- Create feedback table for beta user comments
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for user_id
CREATE INDEX idx_feedback_user_id ON feedback(user_id);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for feedback
CREATE POLICY "Users can create their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );
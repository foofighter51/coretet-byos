-- Create tasks table for track-specific to-do items
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  due_date date,
  priority text CHECK (priority IN ('low', 'medium', 'high')),
  category text,
  user_order integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_tasks_track_id ON tasks(track_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update user_order for drag and drop reordering
CREATE OR REPLACE FUNCTION reorder_tasks(
  p_track_id uuid,
  p_task_id uuid,
  p_new_position integer
) RETURNS void AS $$
DECLARE
  v_old_position integer;
  v_user_id uuid;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  -- Get the old position
  SELECT user_order INTO v_old_position
  FROM tasks
  WHERE id = p_task_id AND track_id = p_track_id AND user_id = v_user_id;
  
  IF v_old_position IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  
  -- Update positions
  IF p_new_position < v_old_position THEN
    -- Moving up
    UPDATE tasks
    SET user_order = user_order + 1
    WHERE track_id = p_track_id 
      AND user_id = v_user_id
      AND user_order >= p_new_position 
      AND user_order < v_old_position;
  ELSIF p_new_position > v_old_position THEN
    -- Moving down
    UPDATE tasks
    SET user_order = user_order - 1
    WHERE track_id = p_track_id 
      AND user_id = v_user_id
      AND user_order > v_old_position 
      AND user_order <= p_new_position;
  END IF;
  
  -- Update the moved task
  UPDATE tasks
  SET user_order = p_new_position,
      updated_at = now()
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get next user_order value
CREATE OR REPLACE FUNCTION get_next_task_order(p_track_id uuid) RETURNS integer AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(user_order) + 1 
     FROM tasks 
     WHERE track_id = p_track_id AND user_id = auth.uid()),
    1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create common task categories table
CREATE TABLE IF NOT EXISTS task_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Insert default categories
INSERT INTO task_categories (name, color) VALUES
  ('Lyrics', '#10B981'),      -- Green
  ('Arrangement', '#3B82F6'),  -- Blue
  ('Recording', '#EF4444'),    -- Red
  ('Mixing', '#F59E0B'),       -- Yellow
  ('Mastering', '#8B5CF6'),    -- Purple
  ('Marketing', '#EC4899'),    -- Pink
  ('Other', '#6B7280')         -- Gray
ON CONFLICT (name) DO NOTHING;

-- Grant select on categories to all authenticated users
GRANT SELECT ON task_categories TO authenticated;
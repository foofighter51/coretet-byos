-- Safe version of tasks migration that checks for existing objects
-- Apply this migration in Supabase SQL Editor

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

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_tasks_track_id ON tasks(track_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Create RLS policies
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

-- Create or replace function to update user_order for drag and drop reordering
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
  
  -- If moving down, shift tasks up
  IF v_old_position < p_new_position THEN
    UPDATE tasks
    SET user_order = user_order - 1
    WHERE track_id = p_track_id
      AND user_id = v_user_id
      AND user_order > v_old_position
      AND user_order <= p_new_position;
  -- If moving up, shift tasks down
  ELSIF v_old_position > p_new_position THEN
    UPDATE tasks
    SET user_order = user_order + 1
    WHERE track_id = p_track_id
      AND user_id = v_user_id
      AND user_order >= p_new_position
      AND user_order < v_old_position;
  END IF;
  
  -- Update the task's position
  UPDATE tasks
  SET user_order = p_new_position,
      updated_at = now()
  WHERE id = p_task_id AND track_id = p_track_id AND user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to set default user_order on insert
CREATE OR REPLACE FUNCTION set_default_task_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_order IS NULL THEN
    SELECT COALESCE(MAX(user_order), 0) + 1 INTO NEW.user_order
    FROM tasks
    WHERE track_id = NEW.track_id AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_task_order_trigger ON tasks;
CREATE TRIGGER set_task_order_trigger
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_default_task_order();

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create or replace function to auto-complete sub-tasks when parent is completed
CREATE OR REPLACE FUNCTION auto_complete_subtasks()
RETURNS TRIGGER AS $$
BEGIN
  -- If task is being marked as completed
  IF NEW.completed = true AND OLD.completed = false THEN
    NEW.completed_at = now();
    
    -- Auto-complete any tasks with this task's title as a dependency
    UPDATE tasks
    SET completed = true,
        completed_at = now()
    WHERE track_id = NEW.track_id
      AND user_id = NEW.user_id
      AND description LIKE '%depends on: ' || NEW.title || '%'
      AND completed = false;
  END IF;
  
  -- If task is being uncompleted
  IF NEW.completed = false AND OLD.completed = true THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS auto_complete_subtasks_trigger ON tasks;
CREATE TRIGGER auto_complete_subtasks_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_subtasks();

-- Grant permissions
GRANT ALL ON tasks TO authenticated;
GRANT SELECT ON tasks TO anon;

-- Add helpful comments
COMMENT ON TABLE tasks IS 'Track-specific to-do items for music production workflow';
COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, or high';
COMMENT ON COLUMN tasks.category IS 'Custom category for organizing tasks (e.g., recording, mixing, mastering)';
COMMENT ON COLUMN tasks.user_order IS 'Custom ordering for drag-and-drop functionality';

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE 'Tasks migration completed successfully!';
  RAISE NOTICE 'Table tasks created with RLS policies';
  RAISE NOTICE 'Functions created for ordering and auto-completion';
END $$;
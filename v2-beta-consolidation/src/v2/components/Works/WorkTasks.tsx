import React, { useState, useEffect } from 'react';
import { Check, X, Plus, Square, CheckSquare, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Task {
  id: string;
  content: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  user_id: string;
}

interface WorkTasksProps {
  workId: string;
}

/**
 * WorkTasks - Task management for a work
 */
export default function WorkTasks({ workId }: WorkTasksProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadTasks();
  }, [workId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Get project to extract tasks from metadata
      const { data: project, error } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', workId)
        .single();

      if (error) throw error;

      // Parse tasks from metadata
      const metadata = project?.metadata as any || {};
      const tasksArray = metadata.tasks || [];
      
      setTasks(tasksArray);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || !user) return;

    try {
      const newTaskObj: Task = {
        id: `task_${Date.now()}`,
        content: newTask.trim(),
        completed: false,
        priority,
        due_date: dueDate || undefined,
        created_at: new Date().toISOString(),
        user_id: user.id
      };

      // Get current project metadata
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', workId)
        .single();

      if (fetchError) throw fetchError;

      const metadata = project?.metadata as any || {};
      const currentTasks = metadata.tasks || [];
      
      // Add new task
      const updatedTasks = [...currentTasks, newTaskObj];

      // Update project metadata with new tasks
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          metadata: {
            ...metadata,
            tasks: updatedTasks
          }
        })
        .eq('id', workId);

      if (updateError) throw updateError;

      setTasks(updatedTasks);
      setNewTask('');
      setDueDate('');
      setPriority('medium');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      // Get current project metadata
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', workId)
        .single();

      if (fetchError) throw fetchError;

      const metadata = project?.metadata as any || {};
      const currentTasks = metadata.tasks || [];
      
      // Toggle task completion
      const updatedTasks = currentTasks.map((t: Task) => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );

      // Update project metadata
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          metadata: {
            ...metadata,
            tasks: updatedTasks
          }
        })
        .eq('id', workId);

      if (updateError) throw updateError;

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      // Get current project metadata
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', workId)
        .single();

      if (fetchError) throw fetchError;

      const metadata = project?.metadata as any || {};
      const currentTasks = metadata.tasks || [];
      
      // Remove the task
      const updatedTasks = currentTasks.filter((t: Task) => t.id !== taskId);

      // Update project metadata
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          metadata: {
            ...metadata,
            tasks: updatedTasks
          }
        })
        .eq('id', workId);

      if (updateError) throw updateError;

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-accent-coral border-accent-coral';
      case 'medium': return 'text-accent-yellow border-accent-yellow';
      case 'low': return 'text-silver/60 border-silver/60';
      default: return 'text-silver/60 border-silver/60';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length
  };

  if (loading) {
    return (
      <div className="bg-forest-main border border-forest-light rounded-xl p-6">
        <div className="text-center py-8">
          <p className="font-quicksand text-silver/60">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Add New Task */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-forest-main border border-forest-light rounded-xl p-6">
          <h3 className="font-anton text-lg text-silver mb-4">Add Task</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newTask.trim()) {
                  e.preventDefault();
                  addTask();
                }
              }}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 bg-forest-dark border border-forest-light rounded-lg font-quicksand text-silver placeholder:text-silver/40 focus:outline-none focus:border-accent-yellow"
            />
            
            <div className="flex items-center space-x-2">
              <label className="font-quicksand text-xs text-silver/60">Priority:</label>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1 rounded-lg font-quicksand text-xs capitalize transition-colors ${
                      priority === p
                        ? `${getPriorityColor(p)} bg-forest-dark border`
                        : 'text-silver/40 hover:text-silver'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block font-quicksand text-xs text-silver/60 mb-2">Due Date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-forest-dark border border-forest-light rounded-lg font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
              />
            </div>
            
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="w-full px-4 py-2 bg-accent-yellow text-forest-dark font-quicksand font-semibold rounded-lg hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Task Stats */}
        <div className="bg-forest-main border border-forest-light rounded-xl p-6">
          <h3 className="font-anton text-lg text-silver mb-4">Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-quicksand text-sm text-silver/60">Total Tasks</span>
              <span className="font-quicksand text-sm text-silver">{taskStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-quicksand text-sm text-silver/60">Completed</span>
              <span className="font-quicksand text-sm text-accent-yellow">{taskStats.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-quicksand text-sm text-silver/60">Active</span>
              <span className="font-quicksand text-sm text-silver">{taskStats.active}</span>
            </div>
            
            {taskStats.total > 0 && (
              <div className="pt-3 border-t border-forest-light">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-quicksand text-xs text-silver/60">Completion</span>
                  <span className="font-quicksand text-xs text-silver">
                    {Math.round((taskStats.completed / taskStats.total) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-forest-dark rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-yellow transition-all duration-300"
                    style={{ width: `${(taskStats.completed / taskStats.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="lg:col-span-2">
        <div className="bg-forest-main border border-forest-light rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-anton text-lg text-silver">Tasks</h3>
            <div className="flex space-x-2">
              {(['all', 'active', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg font-quicksand text-xs capitalize transition-colors ${
                    filter === f
                      ? 'bg-forest-dark text-silver'
                      : 'text-silver/40 hover:text-silver'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {filteredTasks.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`bg-forest-dark rounded-lg p-4 hover:bg-forest-dark/70 transition-colors group ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 text-silver/60 hover:text-accent-yellow transition-colors"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`font-quicksand text-sm text-silver ${
                        task.completed ? 'line-through' : ''
                      }`}>
                        {task.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`font-quicksand text-xs px-2 py-0.5 rounded border ${
                          getPriorityColor(task.priority)
                        }`}>
                          {task.priority}
                        </span>
                        
                        {task.due_date && (
                          <div className="flex items-center space-x-1 text-silver/60">
                            <Calendar className="w-3 h-3" />
                            <span className="font-quicksand text-xs">
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-silver/40 hover:text-accent-coral p-1"
                      title="Delete task"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-silver/20 mx-auto mb-3" />
              <p className="font-quicksand text-silver/60 mb-2">
                {filter === 'completed' ? 'No completed tasks' : 
                 filter === 'active' ? 'No active tasks' : 'No tasks yet'}
              </p>
              <p className="font-quicksand text-sm text-silver/40">
                Add tasks to track what needs to be done
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
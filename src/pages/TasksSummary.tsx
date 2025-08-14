import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, Track, TaskCategory } from '../types';
import { supabase } from '../lib/supabase';
import { useLibrary } from '../contexts/LibraryContext';
import { CalendarDays, Clock, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns';

interface TaskWithTrack extends Task {
  track?: Track;
}

const TasksSummary: React.FC = () => {
  const navigate = useNavigate();
  const { tracks } = useLibrary();
  const [tasks, setTasks] = useState<TaskWithTrack[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, [tracks]);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      // Match tasks with tracks
      const tasksWithTracks = (data || []).map(task => ({
        ...task,
        track: tracks.find(t => t.id === task.track_id)
      }));

      setTasks(tasksWithTracks);
      setDbError(null);
    } catch (error: unknown) {
      const taskError = error as { code?: string; message?: string };
      console.error('Error fetching tasks:', taskError);
      if (taskError.code === '42P01') {
        setDbError('Tasks database not set up. Please run the migration in Supabase SQL Editor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;
      
      setTasks(tasks.map(t => 
        t.id === task.id 
          ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }
          : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const navigateToTrack = (trackId: string) => {
    navigate('/', { state: { selectedTrackId: trackId } });
  };

  // Filter tasks
  const filteredTasks = tasks
    .filter(task => showCompleted || !task.completed)
    .filter(task => !filterCategory || task.category === filterCategory)
    .filter(task => !filterPriority || task.priority === filterPriority);

  // Group tasks by track
  const tasksByTrack = filteredTasks.reduce((acc, task) => {
    const trackId = task.track_id;
    if (!acc[trackId]) {
      acc[trackId] = {
        track: task.track,
        tasks: []
      };
    }
    acc[trackId].tasks.push(task);
    return acc;
  }, {} as Record<string, { track?: Track; tasks: TaskWithTrack[] }>);

  // Sort tracks by number of active tasks
  const sortedTracks = Object.entries(tasksByTrack)
    .sort(([, a], [, b]) => {
      const aActive = a.tasks.filter(t => !t.completed).length;
      const bActive = b.tasks.filter(t => !t.completed).length;
      return bActive - aActive;
    });

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-accent-coral';
      case 'medium': return 'text-accent-yellow';
      case 'low': return 'text-green-500';
      default: return 'text-silver/40';
    }
  };

  const getDueDateInfo = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    
    if (isPast(date) && !isToday(date)) {
      return { text: `Overdue (${format(date, 'MMM d')})`, color: 'text-accent-coral' };
    } else if (isToday(date)) {
      return { text: 'Due today', color: 'text-accent-yellow' };
    } else if (isTomorrow(date)) {
      return { text: 'Due tomorrow', color: 'text-accent-yellow' };
    } else if (date <= addDays(now, 7)) {
      return { text: format(date, 'MMM d'), color: 'text-silver' };
    }
    return { text: format(date, 'MMM d'), color: 'text-silver/60' };
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="font-anton text-4xl text-silver mb-8">Tasks Summary</h1>
        <div className="text-silver/60 font-quicksand">Loading tasks...</div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="p-8">
        <h1 className="font-anton text-4xl text-silver mb-8">Tasks Summary</h1>
        <div className="bg-accent-coral/10 border border-accent-coral/20 rounded-lg p-6 max-w-2xl">
          <h3 className="font-quicksand font-medium text-accent-coral mb-2">Database Setup Required</h3>
          <p className="font-quicksand text-sm text-silver mb-4">{dbError}</p>
          <div className="bg-forest-dark/50 rounded p-4">
            <p className="font-quicksand text-sm text-silver/80 mb-2">To set up the Tasks feature:</p>
            <ol className="list-decimal list-inside font-quicksand text-sm text-silver/60 space-y-1">
              <li>Go to your Supabase SQL Editor</li>
              <li>Copy the contents of apply_tasks_migration.sql</li>
              <li>Run the migration to create the necessary tables</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-anton text-4xl text-silver mb-4">Tasks Summary</h1>
        
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
          >
            <option value="">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 font-quicksand text-sm text-silver">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded bg-forest-light border-forest-light focus:ring-accent-yellow"
            />
            Show completed tasks
          </label>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-forest-light rounded-lg p-4">
            <div className="font-quicksand text-sm text-silver/60 mb-1">Total Active</div>
            <div className="font-anton text-2xl text-silver">
              {tasks.filter(t => !t.completed).length}
            </div>
          </div>
          <div className="bg-forest-light rounded-lg p-4">
            <div className="font-quicksand text-sm text-silver/60 mb-1">Due Today</div>
            <div className="font-anton text-2xl text-accent-yellow">
              {tasks.filter(t => !t.completed && t.due_date && isToday(new Date(t.due_date))).length}
            </div>
          </div>
          <div className="bg-forest-light rounded-lg p-4">
            <div className="font-quicksand text-sm text-silver/60 mb-1">Overdue</div>
            <div className="font-anton text-2xl text-accent-coral">
              {tasks.filter(t => !t.completed && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))).length}
            </div>
          </div>
          <div className="bg-forest-light rounded-lg p-4">
            <div className="font-quicksand text-sm text-silver/60 mb-1">High Priority</div>
            <div className="font-anton text-2xl text-silver">
              {tasks.filter(t => !t.completed && t.priority === 'high').length}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks by Track */}
      <div className="space-y-6">
        {sortedTracks.length === 0 ? (
          <div className="text-center py-12 text-silver/40 font-quicksand">
            {showCompleted ? 'No tasks found' : 'No active tasks'}
          </div>
        ) : (
          sortedTracks.map(([trackId, { track, tasks: trackTasks }]) => {
            const activeTasks = trackTasks.filter(t => !t.completed).length;
            
            return (
              <div key={trackId} className="bg-forest-light rounded-lg overflow-hidden">
                {/* Track Header */}
                <div 
                  className="p-4 border-b border-forest-main cursor-pointer hover:bg-forest-light/80 transition-colors"
                  onClick={() => navigateToTrack(trackId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-anton text-lg text-silver flex items-center gap-3">
                        {track?.name || 'Unknown Track'}
                        {activeTasks > 0 && (
                          <span className="font-quicksand text-sm text-accent-yellow">
                            {activeTasks} active
                          </span>
                        )}
                      </h3>
                      {track?.artist && (
                        <p className="font-quicksand text-sm text-silver/60">{track.artist}</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-silver/40" />
                  </div>
                </div>

                {/* Track Tasks */}
                <div className="divide-y divide-forest-main">
                  {trackTasks.map(task => {
                    const taskCategory = categories.find(c => c.name === task.category);
                    const dueDateInfo = getDueDateInfo(task.due_date);
                    
                    return (
                      <div key={task.id} className="p-4 flex items-start gap-3">
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 size={20} className="text-green-500" />
                          ) : (
                            <Clock size={20} className="text-silver/40 hover:text-silver" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-quicksand text-sm ${task.completed ? 'line-through text-silver/40' : 'text-silver'}`}>
                              {task.title}
                            </span>
                            {task.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded font-quicksand ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                            {taskCategory && (
                              <span 
                                className="text-xs px-2 py-0.5 rounded font-quicksand"
                                style={{ backgroundColor: taskCategory.color + '20', color: taskCategory.color }}
                              >
                                {taskCategory.name}
                              </span>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="font-quicksand text-sm text-silver/60 mb-1">{task.description}</p>
                          )}
                          
                          {dueDateInfo && (
                            <div className={`flex items-center gap-1 font-quicksand text-xs ${dueDateInfo.color}`}>
                              <CalendarDays size={14} />
                              <span>{dueDateInfo.text}</span>
                              {dueDateInfo.color === 'text-accent-coral' && <AlertCircle size={14} />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TasksSummary;
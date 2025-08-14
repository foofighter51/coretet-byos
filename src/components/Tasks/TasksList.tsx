import React, { useState, useEffect } from 'react';
import { Task, TaskCategory } from '../../types';
import { supabase } from '../../lib/supabase';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface TaskError {
  code?: string;
  message?: string;
  [key: string]: unknown;
}
import { SortableItem } from './SortableItem';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { FilterIcon, PlusIcon } from 'lucide-react';

interface TasksListProps {
  trackId: string;
}

type SortOption = 'user_order' | 'priority' | 'due_date' | 'created_at';
type FilterOption = 'all' | 'active' | 'completed';

export const TasksList: React.FC<TasksListProps> = ({ trackId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('user_order');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [dbError, setDbError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, [trackId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('track_id', trackId)
        .order('user_order', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
      setDbError(null);
    } catch (error: unknown) {
      const taskError = error as TaskError;
      console.error('Error fetching tasks:', taskError);
      if (taskError.code === '42P01') {
        setDbError('Tasks database not set up. Please run the migration in Supabase.');
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);

      // Update user_order in database
      try {
        await supabase.rpc('reorder_tasks', {
          p_track_id: trackId,
          p_task_id: active.id,
          p_new_position: newIndex + 1
        });
      } catch (error) {
        console.error('Error reordering tasks:', error);
        fetchTasks(); // Refresh on error
      }
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      const { data: orderData } = await supabase
        .rpc('get_next_task_order', { p_track_id: trackId });

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          track_id: trackId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          user_order: orderData
        })
        .select()
        .single();

      if (error) throw error;
      setTasks([...tasks, data]);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    await handleUpdateTask(task.id, {
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : null
    });
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filterBy === 'active') return !task.completed;
      if (filterBy === 'completed') return task.completed;
      return true;
    })
    .filter(task => {
      if (filterCategory) return task.category === filterCategory;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
          return (priorityOrder[a.priority || 'undefined'] || 3) - (priorityOrder[b.priority || 'undefined'] || 3);
        case 'due_date':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return (a.user_order || 0) - (b.user_order || 0);
      }
    });

  if (loading) {
    return <div className="border-2 border-accent-yellow rounded-lg p-4">
      <div className="font-quicksand text-sm text-silver/60">Loading tasks...</div>
    </div>;
  }

  if (dbError) {
    return (
      <div className="border-2 border-accent-yellow rounded-lg p-4">
        <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider mb-2">Tasks</h3>
        <div className="bg-accent-coral/10 border border-accent-coral/20 rounded-lg p-3">
          <p className="font-quicksand text-sm text-accent-coral mb-2">{dbError}</p>
          <p className="font-quicksand text-xs text-silver/60">
            See TASKS_MIGRATION_INSTRUCTIONS.md for setup instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-accent-yellow rounded-lg p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider">Tasks</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1 bg-accent-yellow text-forest-dark hover:bg-accent-yellow/90 rounded-md text-sm font-quicksand font-medium transition-colors"
        >
          <PlusIcon size={16} />
          Add Task
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as FilterOption)}
          className="flex-1 min-w-0 bg-forest-light border border-forest-light rounded px-2 py-1 text-sm font-quicksand text-silver focus:outline-none focus:border-accent-yellow"
        >
          <option value="all">All Tasks</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="flex-1 min-w-0 bg-forest-light border border-forest-light rounded px-2 py-1 text-sm font-quicksand text-silver focus:outline-none focus:border-accent-yellow"
        >
          <option value="user_order">Custom Order</option>
          <option value="priority">Priority</option>
          <option value="due_date">Due Date</option>
          <option value="created_at">Created</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex-1 min-w-0 bg-forest-light border border-forest-light rounded px-2 py-1 text-sm font-quicksand text-silver focus:outline-none focus:border-accent-yellow"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <TaskForm
          categories={categories}
          onSubmit={handleCreateTask}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingTask && (
        <TaskForm
          task={editingTask}
          categories={categories}
          onSubmit={(data) => handleUpdateTask(editingTask.id, data)}
          onCancel={() => setEditingTask(null)}
        />
      )}

      <div className="space-y-2 overflow-x-hidden">
        {sortBy === 'user_order' && filterBy === 'all' && !filterCategory ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredTasks.map((task) => (
                <SortableItem key={task.id} id={task.id}>
                  <TaskItem
                    task={task}
                    categories={categories}
                    onToggle={() => handleToggleComplete(task)}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              categories={categories}
              onToggle={() => handleToggleComplete(task)}
              onEdit={() => setEditingTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))
        )}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-8 text-silver/40 font-quicksand text-sm">
          {filterBy === 'completed' ? 'No completed tasks' : 
           filterBy === 'active' ? 'No active tasks' : 
           'No tasks yet. Add one to get started!'}
        </div>
      )}
    </div>
  );
};
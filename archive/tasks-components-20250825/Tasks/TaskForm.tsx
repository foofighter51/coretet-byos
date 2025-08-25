import React, { useState } from 'react';
import { Task, TaskCategory } from '../../types';
import { X } from 'lucide-react';

interface TaskFormProps {
  task?: Task;
  categories: TaskCategory[];
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ 
  task, 
  categories, 
  onSubmit, 
  onCancel 
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [category, setCategory] = useState(task?.category || '');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [dueDate, setDueDate] = useState(
    task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority as Task['priority'],
      category: showCustomCategory && customCategory.trim() ? customCategory.trim() : category || undefined,
      due_date: dueDate || undefined,
    });
  };

  return (
    <div className="bg-forest-light/50 rounded-lg p-4 mb-4 border border-forest-light">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-quicksand font-medium text-silver">{task ? 'Edit Task' : 'New Task'}</h4>
        <button
          onClick={onCancel}
          className="p-1 text-silver/40 hover:text-silver transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full px-3 py-2 bg-forest-main rounded border border-forest-light focus:border-accent-yellow focus:outline-none font-quicksand text-sm text-silver placeholder-silver/40"
          autoFocus
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)..."
          rows={2}
          className="w-full px-3 py-2 bg-forest-main rounded border border-forest-light focus:border-accent-yellow focus:outline-none resize-none font-quicksand text-sm text-silver placeholder-silver/40"
        />

        <div className="grid grid-cols-3 gap-3">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 bg-forest-main rounded border border-forest-light focus:border-accent-yellow focus:outline-none font-quicksand text-sm text-silver"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <div className="relative">
            <select
              value={showCustomCategory ? 'custom' : category}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomCategory(true);
                  setCategory('');
                } else {
                  setShowCustomCategory(false);
                  setCategory(e.target.value);
                  setCustomCategory('');
                }
              }}
              className="px-3 py-2 bg-forest-main rounded border border-forest-light focus:border-accent-yellow focus:outline-none font-quicksand text-sm text-silver w-full"
            >
              <option value="">No Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
              <option value="custom">+ Custom Category</option>
            </select>
            {showCustomCategory && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category..."
                className="mt-2 px-3 py-2 bg-forest-main rounded border border-forest-light focus:border-accent-yellow focus:outline-none font-quicksand text-sm text-silver w-full"
                autoFocus
              />
            )}
          </div>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 bg-forest-main rounded border border-forest-light focus:border-accent-yellow focus:outline-none font-quicksand text-sm text-silver"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-forest-light hover:bg-forest-light/80 rounded text-sm font-quicksand text-silver transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-4 py-2 bg-accent-yellow hover:bg-accent-yellow/90 disabled:bg-forest-light disabled:text-silver/40 disabled:cursor-not-allowed rounded text-sm font-quicksand text-forest-dark font-medium transition-colors"
          >
            {task ? 'Update' : 'Create'} Task
          </button>
        </div>
      </form>
    </div>
  );
};
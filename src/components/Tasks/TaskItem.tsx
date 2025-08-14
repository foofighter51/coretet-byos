import React from 'react';
import { Task, TaskCategory } from '../../types';
import { CheckCircle2, Circle, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

interface TaskItemProps {
  task: Task;
  categories: TaskCategory[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  categories, 
  onToggle, 
  onEdit, 
  onDelete 
}) => {
  const category = categories.find(c => c.name === task.category);
  const isOverdue = task.due_date && !task.completed && isPast(new Date(task.due_date));
  const isDueSoon = task.due_date && !task.completed && (
    isToday(new Date(task.due_date)) || 
    isTomorrow(new Date(task.due_date))
  );

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-accent-coral';
      case 'medium': return 'text-accent-yellow';
      case 'low': return 'text-green-500';
      default: return 'text-silver/40';
    }
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg bg-forest-light/50 hover:bg-forest-light/70 transition-colors ${task.completed ? 'opacity-60' : ''}`}>
      <button
        onClick={onToggle}
        className="mt-0.5 flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle size={20} className="text-silver/40 hover:text-silver" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`font-quicksand text-sm truncate ${task.completed ? 'line-through text-silver/40' : 'text-silver'}`}>
            {task.title}
          </span>
          {task.priority && (
            <span className={`text-xs px-2 py-0.5 rounded font-quicksand ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          )}
          {category && (
            <span 
              className="text-xs px-2 py-0.5 rounded font-quicksand"
              style={{ backgroundColor: category.color + '20', color: category.color }}
            >
              {category.name}
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-silver/60 mb-1 font-quicksand break-words">{task.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-silver/40 font-quicksand">
          {task.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-accent-coral' : isDueSoon ? 'text-accent-yellow' : ''}`}>
              <Calendar size={14} />
              {format(new Date(task.due_date), 'MMM d')}
              {isOverdue && <AlertCircle size={14} />}
            </span>
          )}
          {task.completed && task.completed_at && (
            <span>
              Completed {format(new Date(task.completed_at), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="p-1 text-silver/40 hover:text-silver transition-colors"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-silver/40 hover:text-accent-coral transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
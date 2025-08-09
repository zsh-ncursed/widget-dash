import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Square } from 'lucide-react';
import WidgetTitle from './WidgetTitle';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoWidgetProps {
  onDataChange?: () => void;
  widgetId: string;
}

export default function TodoWidget({ onDataChange, widgetId }: TodoWidgetProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const storageKey = `widgetTodo_${widgetId}`;

  useEffect(() => {
    // Load todos from storage
    const browserAPI = (window as any).browser || (window as any).chrome;
    
    if (browserAPI && browserAPI.storage) {
      browserAPI.storage.local.get([storageKey], (result: any) => {
        if (result[storageKey]) {
          setTodos(JSON.parse(result[storageKey]).map((todo: any) => ({
            ...todo,
            createdAt: new Date(todo.createdAt)
          })));
        }
      });
    } else {
      const savedTodos = localStorage.getItem(storageKey);
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        })));
      }
    }
  }, []);

  const saveTodos = (newTodos: TodoItem[]) => {
    const browserAPI = (window as any).browser || (window as any).chrome;
    
    if (browserAPI && browserAPI.storage) {
      browserAPI.storage.local.set({ [storageKey]: JSON.stringify(newTodos) }, () => {
        onDataChange?.();
      });
    } else {
      localStorage.setItem(storageKey, JSON.stringify(newTodos));
      onDataChange?.();
    }
    setTodos(newTodos);
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;

    const todo: TodoItem = {
      id: `todo-${Date.now()}`,
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date()
    };

    saveTodos([...todos, todo]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    saveTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const removeTodo = (id: string) => {
    saveTodos(todos.filter(todo => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <WidgetTitle widgetId={widgetId} defaultTitle="Todo List" />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold">Todo List</h3>
          {todos.length > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {completedCount}/{todos.length}
            </span>
          )}
        </div>
      </div>

      {/* Add new todo */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new task..."
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={addTodo}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Todo list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {todos
          .sort((a, b) => {
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1; // Completed items go to bottom
            }
            return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first
          })
          .map(todo => (
            <div
              key={todo.id}
              className={`flex items-center gap-2 p-2 rounded border group ${
                todo.completed 
                  ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`flex-shrink-0 transition-colors ${
                  todo.completed 
                    ? 'text-green-500 hover:text-green-600' 
                    : 'text-gray-400 hover:text-green-500'
                }`}
              >
                {todo.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>
              
              <span
                className={`flex-1 text-sm ${
                  todo.completed 
                    ? 'line-through text-gray-500 dark:text-gray-400' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {todo.text}
              </span>
              
              <button
                onClick={() => removeTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        
        {todos.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No tasks yet. Add one above!
          </p>
        )}
      </div>
    </div>
  );
}

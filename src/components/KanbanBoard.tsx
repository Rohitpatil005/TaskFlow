import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { wsService } from '../services/websocket';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: { _id: string; name: string };
  dueDate?: string;
  order: number;
}

interface KanbanBoardProps {
  projectId: string;
  token: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { id: 'inprogress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export default function KanbanBoard({ projectId, token }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({
    todo: '',
    inprogress: '',
    done: '',
  });
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();

    // Connect to WebSocket
    if (!wsService.isConnected()) {
      wsService.connect().catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
      });
    }

    // Subscribe to real-time updates
    const unsubscribeTasks = wsService.on('task-created', (data) => {
      if (data.project === projectId) {
        setTasks((prev) => [...prev, data]);
      }
    });

    const unsubscribeUpdate = wsService.on('task-updated', (data) => {
      if (data.project === projectId) {
        setTasks((prev) =>
          prev.map((t) => (t._id === data._id ? data : t))
        );
      }
    });

    const unsubscribeDelete = wsService.on('task-deleted', (data) => {
      setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
    });

    const unsubscribeReorder = wsService.on('task-reordered', (data) => {
      if (data.project === projectId) {
        setTasks((prev) =>
          prev.map((t) => (t._id === data._id ? data : t))
        );
      }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeUpdate();
      unsubscribeDelete();
      unsubscribeReorder();
    };
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/tasks/project/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(response.data);
    } catch (error) {
      console.warn('Failed to fetch tasks from API, using demo data');
      // Use demo data if backend is not available
      const demoTasks: Task[] = [
        {
          _id: 'task-1',
          title: 'Analytics Dashboard',
          description: 'Build charts for user engagement and system performance.',
          status: 'todo',
          priority: 'medium',
          project: projectId,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'task-2',
          title: 'Design System Implementation',
          description: 'Create a consistent set of UI components based on the new brand guidelines.',
          status: 'inprogress',
          priority: 'high',
          project: projectId,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'task-3',
          title: 'User Authentication Flow',
          description: 'Implement login, registration, and password recovery screens.',
          status: 'done',
          priority: 'high',
          project: projectId,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'task-4',
          title: 'Mobile Responsiveness',
          description: 'Ensure the application looks good on all device sizes.',
          status: 'todo',
          priority: 'low',
          project: projectId,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setTasks(demoTasks);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (status: 'todo' | 'inprogress' | 'done') => {
    const title = newTaskTitle[status].trim();
    if (!title) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/tasks`,
        { title, projectId, status, priority: 'medium' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks([...tasks, response.data]);
      setNewTaskTitle((prev) => ({ ...prev, [status]: '' }));
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((t) => t._id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggingTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: 'todo' | 'inprogress' | 'done') => {
    if (!draggingTask) return;

    try {
      const updatedTask = {
        ...draggingTask,
        status,
      };

      await axios.put(
        `${API_URL}/api/tasks/${draggingTask._id}/reorder`,
        { status, order: 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks(
        tasks.map((t) => (t._id === draggingTask._id ? updatedTask : t))
      );
      setDraggingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      setDraggingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="kanban-board overflow-x-auto">
      <div className="kanban-grid flex gap-6 min-w-full pb-6">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);

          return (
            <div
              key={column.id}
              className="kanban-column flex-shrink-0 w-96 bg-gray-100 rounded-lg p-4"
            >
              {/* Column Header */}
              <div className="column-header flex items-center gap-3 mb-4">
                <div className={`column-dot w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="column-title font-bold text-gray-900">{column.title}</h3>
                <span className="column-count bg-gray-300 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id as 'todo' | 'inprogress' | 'done')}
                className="tasks-container space-y-3 min-h-96 bg-white rounded-lg p-3"
              >
                {columnTasks.length === 0 ? (
                  <div className="empty-state text-center py-12">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No tasks yet</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className="task-card bg-white border-l-4 border-blue-500 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
                    >
                      <div className="task-header flex items-start justify-between gap-2">
                        <h4 className="task-title font-medium text-gray-900 flex-1 leading-snug">
                          {task.title}
                        </h4>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="delete-btn text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="task-description text-gray-600 text-sm mt-2">
                          {task.description}
                        </p>
                      )}

                      <div className="task-meta flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span
                          className={`priority-badge text-xs font-semibold px-2 py-1 rounded ${
                            PRIORITY_COLORS[task.priority]
                          }`}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </span>
                        {task.dueDate && (
                          <span className="due-date text-xs text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* New Task Form */}
              <div className="new-task-form mt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle[column.id as 'todo' | 'inprogress' | 'done']}
                    onChange={(e) =>
                      setNewTaskTitle((prev) => ({
                        ...prev,
                        [column.id]: e.target.value,
                      }))
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateTask(column.id as 'todo' | 'inprogress' | 'done');
                      }
                    }}
                    placeholder="Add new task..."
                    className="new-task-input flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={() =>
                      handleCreateTask(column.id as 'todo' | 'inprogress' | 'done')
                    }
                    className="add-task-btn bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

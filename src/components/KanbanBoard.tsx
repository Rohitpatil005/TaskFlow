import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, AlertCircle, ChevronRight, Check } from 'lucide-react';
import { wsService } from '../services/websocket';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Comment {
  _id: string;
  author: User;
  text: string;
  createdAt: string;
}

interface TimeEntry {
  _id: string;
  userId: User;
  duration: number;
  date: string;
}

interface ActivityItem {
  _id: string;
  userId: User;
  action: string;
  description: string;
  timestamp: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: User;
  dueDate?: string;
  labels: string[];
  comments: Comment[];
  timeEntries: TimeEntry[];
  totalTimeSpent: number;
  activityFeed: ActivityItem[];
  order: number;
}

interface KanbanBoardProps {
  projectId: string;
  token: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-red-500', bgLight: 'bg-red-50', headerBg: 'bg-gradient-to-r from-red-500 to-red-600', borderColor: 'border-red-200', containerBg: 'bg-red-25' },
  { id: 'inprogress', title: 'In Progress', color: 'bg-blue-500', bgLight: 'bg-blue-50', headerBg: 'bg-gradient-to-r from-blue-500 to-blue-600', borderColor: 'border-blue-200', containerBg: 'bg-blue-25' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500', bgLight: 'bg-emerald-50', headerBg: 'bg-gradient-to-r from-emerald-500 to-emerald-600', borderColor: 'border-emerald-200', containerBg: 'bg-emerald-25' },
];

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700 font-semibold',
  medium: 'bg-amber-100 text-amber-700 font-semibold',
  high: 'bg-red-100 text-red-700 font-semibold',
};

export default function KanbanBoard({ projectId, token }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({
    todo: '',
    inprogress: '',
    done: '',
  });
  const [newTaskDueDate, setNewTaskDueDate] = useState<Record<string, string>>({
    todo: '',
    inprogress: '',
    done: '',
  });
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchProjectMembers();

    // Connect to WebSocket (optional, app works without it)
    const connectWebSocket = async () => {
      try {
        await wsService.connect();

        // Subscribe to real-time updates only if WebSocket is connected
        if (wsService.isConnected()) {
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
        }
      } catch (error) {
        console.warn('WebSocket not available, app will work with polling only');
      }
    };

    const cleanup = connectWebSocket();

    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, [projectId]);

  const fetchProjectMembers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.members) {
        setTeamMembers(response.data.members);
      }
    } catch (error) {
      console.warn('Failed to fetch project members');
    }
  };

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
          order: 0,
          labels: ['frontend', 'dashboard'],
          comments: [],
          timeEntries: [],
          totalTimeSpent: 0,
          activityFeed: []
        },
        {
          _id: 'task-2',
          title: 'Design System Implementation',
          description: 'Create a consistent set of UI components based on the new brand guidelines.',
          status: 'inprogress',
          priority: 'high',
          order: 0,
          labels: ['design', 'components'],
          comments: [],
          timeEntries: [],
          totalTimeSpent: 0,
          activityFeed: []
        },
        {
          _id: 'task-3',
          title: 'User Authentication Flow',
          description: 'Implement login, registration, and password recovery screens.',
          status: 'done',
          priority: 'high',
          order: 0,
          labels: ['auth'],
          comments: [],
          timeEntries: [],
          totalTimeSpent: 120,
          activityFeed: []
        },
        {
          _id: 'task-4',
          title: 'Mobile Responsiveness',
          description: 'Ensure the application looks good on all device sizes.',
          status: 'todo',
          priority: 'low',
          order: 1,
          labels: ['responsive'],
          comments: [],
          timeEntries: [],
          totalTimeSpent: 0,
          activityFeed: []
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
        { title, projectId, status, priority: 'medium', dueDate: newTaskDueDate[status] || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks([...tasks, response.data]);
      setNewTaskTitle((prev) => ({ ...prev, [status]: '' }));
      setNewTaskDueDate((prev) => ({ ...prev, [status]: '' }));
    } catch (error) {
      console.warn('API not available, creating local task');
      // Create a demo task if API fails
      const demoTask: Task = {
        _id: `task-${Date.now()}`,
        title,
        description: '',
        status,
        priority: 'medium',
        dueDate: newTaskDueDate[status] || undefined,
        order: 0,
        labels: [],
        comments: [],
        timeEntries: [],
        totalTimeSpent: 0,
        activityFeed: []
      };
      setTasks([...tasks, demoTask]);
      setNewTaskTitle((prev) => ({ ...prev, [status]: '' }));
      setNewTaskDueDate((prev) => ({ ...prev, [status]: '' }));
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'inprogress' | 'done') => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    try {
      const updatedTask = { ...task, status: newStatus };
      await axios.put(
        `${API_URL}/api/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map((t) => (t._id === taskId ? updatedTask : t)));
    } catch (error) {
      console.warn('Failed to update task status, updating locally');
      const updatedTask = { ...task, status: newStatus };
      setTasks(tasks.map((t) => (t._id === taskId ? updatedTask : t)));
    }
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((t) => t._id !== taskId));
    } catch (error) {
      console.warn('Failed to delete task from API, removing locally');
      // Remove from local state even if API fails
      setTasks(tasks.filter((t) => t._id !== taskId));
    }
  };

  const handleAssignTask = async (taskId: string, userId: string | null) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/tasks/${taskId}`,
        { assignee: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map((t) => (t._id === taskId ? response.data : t)));
      if (selectedTask?._id === taskId) {
        setSelectedTask(response.data);
      }
    } catch (error) {
      console.warn('Failed to assign task');
    }
  };

  const handleAddComment = async (taskId: string) => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/tasks/${taskId}/comments`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map((t) => (t._id === taskId ? response.data : t)));
      if (selectedTask?._id === taskId) {
        setSelectedTask(response.data);
      }
      setNewComment('');
    } catch (error) {
      console.warn('Failed to add comment');
    }
  };

  const handleAddLabel = async (taskId: string) => {
    if (!newLabel.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/tasks/${taskId}/labels`,
        { label: newLabel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map((t) => (t._id === taskId ? response.data : t)));
      if (selectedTask?._id === taskId) {
        setSelectedTask(response.data);
      }
      setNewLabel('');
    } catch (error) {
      console.warn('Failed to add label');
    }
  };

  const handleRemoveLabel = async (taskId: string, label: string) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/tasks/${taskId}/labels/${encodeURIComponent(label)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map((t) => (t._id === taskId ? response.data : t)));
      if (selectedTask?._id === taskId) {
        setSelectedTask(response.data);
      }
    } catch (error) {
      console.warn('Failed to remove label');
    }
  };

  const handleLogTime = async (taskId: string, minutes: number) => {
    if (minutes <= 0) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/tasks/${taskId}/time`,
        { duration: minutes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map((t) => (t._id === taskId ? response.data : t)));
      if (selectedTask?._id === taskId) {
        setSelectedTask(response.data);
      }
    } catch (error) {
      console.warn('Failed to log time');
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
      console.warn('Failed to update task on API, updating locally');
      // Update local state even if API fails
      const updatedTask = {
        ...draggingTask,
        status,
      };
      setTasks(
        tasks.map((t) => (t._id === draggingTask._id ? updatedTask : t))
      );
      setDraggingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-75 animate-pulse"></div>
              <div className="relative inset-0 bg-slate-900 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
          <p className="text-slate-600 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-board overflow-x-auto bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 rounded-xl p-4 -m-4 transition-colors duration-300">
      <div className="kanban-grid flex gap-6 min-w-full pb-6">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);

          return (
            <div
              key={column.id}
              className={`kanban-column flex-shrink-0 w-96 flex flex-col rounded-2xl border-2 ${column.borderColor} dark:border-slate-600 overflow-hidden shadow-lg hover:shadow-xl transition-all dark:shadow-slate-950`}
            >
              {/* Column Header */}
              <div className={`column-header ${column.headerBg} flex items-center gap-3 px-6 py-5 text-white`}>
                <h3 className="column-title font-bold text-lg flex-1">{column.title}</h3>
                <span className={`column-count bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm`}>
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id as 'todo' | 'inprogress' | 'done')}
                className={`tasks-container space-y-3 min-h-96 flex-1 p-5 ${column.bgLight} dark:bg-slate-800/50`}
              >
                {columnTasks.length === 0 ? (
                  <div className="empty-state text-center py-12 text-slate-500 hover:text-slate-600 transition-colors">
                    <div className="text-4xl mb-3 animate-pulse">📭</div>
                    <p className="text-sm font-medium">No tasks yet</p>
                    <p className="text-xs text-slate-400 mt-1">Drag tasks here or create one</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskDetails(true);
                      }}
                      className="task-card bg-white dark:bg-slate-700 rounded-lg p-4 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer transform border border-slate-200 dark:border-slate-600 dark:shadow-slate-950"
                    >
                      <div className="task-header flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h4 className="task-title font-medium text-slate-900 dark:text-white leading-snug text-sm">
                            {task.title}
                          </h4>
                          {task.labels.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {task.labels.slice(0, 2).map((label) => (
                                <span key={label} className="inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                  {label}
                                </span>
                              ))}
                              {task.labels.length > 2 && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  +{task.labels.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task._id);
                          }}
                          className="delete-btn text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="task-description text-slate-600 dark:text-slate-300 text-xs mt-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.assignee && (
                        <div className="task-assignee flex items-center gap-2 mt-2 text-xs">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {task.assignee.name[0]}
                          </div>
                          <span className="text-slate-600 dark:text-slate-300">{task.assignee.name}</span>
                        </div>
                      )}

                      <div className="task-meta space-y-3 mt-3 pt-3 border-t border-slate-100">
                        {task.dueDate && (
                          <div className={`due-date flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded ${
                            isOverdue(task.dueDate)
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                            📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {isOverdue(task.dueDate) && <span className="ml-1">⚠️</span>}
                          </div>
                        )}

                        {/* Status Change Button */}
                        {column.id === 'todo' && (
                          <button
                            onClick={() => handleStatusChange(task._id, 'inprogress')}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-semibold hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
                          >
                            <ChevronRight className="w-3 h-3" />
                            Start
                          </button>
                        )}
                        {column.id === 'inprogress' && (
                          <button
                            onClick={() => handleStatusChange(task._id, 'done')}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-xs font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105"
                          >
                            <Check className="w-3 h-3" />
                            Complete
                          </button>
                        )}
                        {column.id === 'done' && (
                          <button
                            onClick={() => handleStatusChange(task._id, 'todo')}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-400 to-slate-500 text-white rounded-lg text-xs font-semibold hover:from-slate-500 hover:to-slate-600 transition-all transform hover:scale-105"
                          >
                            ↩️ Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* New Task Form */}
              <div className="new-task-form px-5 pb-5 bg-white/40 dark:bg-slate-700/30 space-y-3 transition-colors duration-300">
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
                  placeholder="Task title..."
                  className="new-task-input w-full px-3 py-2 text-sm border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-offset-0 outline-none bg-white dark:bg-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-300 transition-all hover:border-slate-300 dark:hover:border-slate-500"
                />
                <input
                  type="date"
                  value={newTaskDueDate[column.id as 'todo' | 'inprogress' | 'done']}
                  onChange={(e) =>
                    setNewTaskDueDate((prev) => ({
                      ...prev,
                      [column.id]: e.target.value,
                    }))
                  }
                  className="deadline-input w-full px-3 py-2 text-sm border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-offset-0 outline-none bg-white dark:bg-slate-600 text-slate-900 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-500"
                />
                <button
                  onClick={() =>
                    handleCreateTask(column.id as 'todo' | 'inprogress' | 'done')
                  }
                  className={`add-task-btn w-full flex items-center justify-center gap-2 ${column.color} text-white px-3 py-2 rounded-lg hover:opacity-90 transition-all hover:scale-105 shadow-md font-medium`}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedTask.title}</h2>
              <button
                onClick={() => setShowTaskDetails(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              {selectedTask.description && (
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
                  <p className="text-slate-600 dark:text-slate-300">{selectedTask.description}</p>
                </div>
              )}

              {/* Task Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Priority</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[selectedTask.priority]}`}>
                    {selectedTask.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Status</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                    {selectedTask.status}
                  </span>
                </div>
                {selectedTask.dueDate && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Due Date</p>
                    <p className="text-slate-900 dark:text-white">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Assigned To</h3>
                <select
                  value={selectedTask.assignee?._id || ''}
                  onChange={(e) => handleAssignTask(selectedTask._id, e.target.value || null)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Labels */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTask.labels.map((label) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                    >
                      {label}
                      <button
                        onClick={() => handleRemoveLabel(selectedTask._id, label)}
                        className="hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddLabel(selectedTask._id);
                    }}
                    placeholder="Add new label..."
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => handleAddLabel(selectedTask._id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Time Tracking */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Time Tracked</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">{selectedTask.totalTimeSpent} minutes</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Minutes"
                    min="1"
                    className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const minutes = parseInt((e.target as HTMLInputElement).value);
                        handleLogTime(selectedTask._id, minutes);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      const minutes = parseInt(input.value);
                      handleLogTime(selectedTask._id, minutes);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Log Time
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Comments ({selectedTask.comments.length})</h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {selectedTask.comments.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">No comments yet</p>
                  ) : (
                    selectedTask.comments.map((comment) => (
                      <div key={comment._id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{comment.author.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddComment(selectedTask._id);
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={() => handleAddComment(selectedTask._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Comment
                  </button>
                </div>
              </div>

              {/* Activity Feed */}
              {selectedTask.activityFeed.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Activity</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedTask.activityFeed.map((activity) => (
                      <div key={activity._id} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <p className="font-medium text-slate-900 dark:text-white">{activity.userId.name}</p>
                        <p>{activity.description || activity.action}</p>
                        <p className="text-xs">{new Date(activity.timestamp).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import axios from 'axios';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

interface Project {
  _id: string;
  name: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (projectId && token) {
      fetchData();
    }
  }, [projectId, token]);

  const fetchData = async () => {
    try {
      const [projectResponse, tasksResponse] = await Promise.all([
        axios.get(`${API_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/tasks/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setProject(projectResponse.data);
      setTasks(tasksResponse.data);
    } catch (error) {
      console.warn('Failed to fetch calendar data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <p className="text-slate-300">Loading calendar...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTasksForDate = (date: number) => {
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), date).toISOString().split('T')[0];
    return tasks.filter((task) => task.dueDate && task.dueDate.split('T')[0] === dateString);
  };

  const getTasksForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateString = selectedDate.toISOString().split('T')[0];
    return tasks.filter((task) => task.dueDate && task.dueDate.split('T')[0] === dateString);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="calendar-page min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="calendar-header bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sticky top-0 z-10 shadow-lg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="back-btn flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Calendar className="w-10 h-10" />
            Calendar View
          </h1>
          <p className="text-slate-300">{project.name}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 p-8">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {DAYS.map((day) => (
                  <div key={day} className="text-center py-2 font-semibold text-slate-600 dark:text-slate-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}

                {/* Days of month */}
                {daysArray.map((day) => {
                  const dayTasks = getTasksForDate(day);
                  const isSelected = selectedDate && 
                    selectedDate.getDate() === day && 
                    selectedDate.getMonth() === currentDate.getMonth();
                  const isToday = 
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                      className={`aspect-square p-2 rounded-lg border-2 transition-all hover:border-blue-400 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : isToday
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                        {day}
                      </div>
                      {dayTasks.length > 0 && (
                        <div className="flex flex-col gap-0.5">
                          {dayTasks.slice(0, 2).map((task) => (
                            <div
                              key={task._id}
                              className={`text-xs rounded px-1 py-0.5 truncate text-white ${
                                task.priority === 'high'
                                  ? 'bg-red-500'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                              }`}
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              +{dayTasks.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Tasks */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 p-8 h-fit">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
            </h2>

            {selectedDate ? (
              <div className="space-y-3">
                {getTasksForSelectedDate().length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">No tasks scheduled for this date</p>
                ) : (
                  getTasksForSelectedDate().map((task) => (
                    <div
                      key={task._id}
                      className={`p-4 rounded-lg border-l-4 ${
                        task.priority === 'high'
                          ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
                          : task.priority === 'medium'
                          ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
                      }`}
                    >
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{task.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          task.priority === 'high'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : task.priority === 'medium'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          task.status === 'done'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : task.status === 'inprogress'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">Click on a date to view tasks</p>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="mt-10 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Upcoming Tasks</h2>
          <div className="space-y-4">
            {tasks
              .filter((task) => task.dueDate)
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .slice(0, 10)
              .map((task) => {
                const dueDate = new Date(task.dueDate!);
                const isOverdue = dueDate < new Date() && dueDate.toDateString() !== new Date().toDateString();

                return (
                  <div
                    key={task._id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isOverdue
                        ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                      <p className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                        {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {isOverdue && ' (Overdue)'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : task.priority === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </main>
    </div>
  );
}

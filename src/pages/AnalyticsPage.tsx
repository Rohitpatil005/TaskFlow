import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import axios from 'axios';
import { ArrowLeft, BarChart3, PieChart, TrendingUp, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: { _id: string; name: string; email: string };
  totalTimeSpent: number;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
  members: Array<{ _id: string; name: string; email: string }>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.warn('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <p className="text-slate-300">Loading analytics...</p>
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

  // Calculate analytics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const tasksByPriority = {
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  };

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inprogress: tasks.filter((t) => t.status === 'inprogress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const tasksByAssignee = project.members.map((member) => ({
    name: member.name,
    assigned: tasks.filter((t) => t.assignee?._id === member._id).length,
    completed: tasks.filter((t) => t.assignee?._id === member._id && t.status === 'done').length,
  }));

  const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.totalTimeSpent || 0), 0);
  const avgTimePerTask = totalTasks > 0 ? Math.round(totalTimeSpent / totalTasks) : 0;

  const timeByAssignee = project.members
    .map((member) => {
      const memberTasks = tasks.filter((t) => t.assignee?._id === member._id);
      const timeSpent = memberTasks.reduce((sum, task) => sum + (task.totalTimeSpent || 0), 0);
      return { name: member.name, time: timeSpent };
    })
    .filter((item) => item.time > 0);

  return (
    <div className="analytics-page min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="analytics-header bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sticky top-0 z-10 shadow-lg transition-colors duration-300">
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
            <BarChart3 className="w-10 h-10" />
            Analytics & Insights
          </h1>
          <p className="text-slate-300">{project.name}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {/* Completion Rate */}
          <div className="metric-card bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-4xl font-bold text-green-600 dark:text-green-400">{completionRate}%</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Completion Rate</p>
            <p className="text-slate-900 dark:text-white text-lg font-semibold mt-2">
              {completedTasks} of {totalTasks} tasks
            </p>
          </div>

          {/* Total Tasks */}
          <div className="metric-card bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalTasks}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Tasks</p>
            <p className="text-slate-900 dark:text-white text-lg font-semibold mt-2">
              {tasksByStatus.todo} To Do, {tasksByStatus.inprogress} In Progress
            </p>
          </div>

          {/* Total Time */}
          <div className="metric-card bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">{totalTimeSpent}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Time Logged</p>
            <p className="text-slate-900 dark:text-white text-lg font-semibold mt-2">{totalTimeSpent} minutes</p>
          </div>

          {/* Team Members */}
          <div className="metric-card bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">{project.members.length}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Team Members</p>
            <p className="text-slate-900 dark:text-white text-lg font-semibold mt-2">Active collaborators</p>
          </div>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Tasks by Priority */}
          <div className="chart-card bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-slate-100 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Tasks by Priority
            </h2>
            <div className="space-y-4">
              {[
                { label: 'High Priority', value: tasksByPriority.high, color: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-400' },
                { label: 'Medium Priority', value: tasksByPriority.medium, color: 'bg-amber-100 dark:bg-amber-900/30', textColor: 'text-amber-600 dark:text-amber-400' },
                { label: 'Low Priority', value: tasksByPriority.low, color: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.color} ${item.textColor}`}>
                      {item.value}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color.split(' ')[0]}`}
                      style={{ width: `${totalTasks > 0 ? (item.value / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks by Status */}
          <div className="chart-card bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-slate-100 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-blue-500" />
              Tasks by Status
            </h2>
            <div className="space-y-4">
              {[
                { label: 'To Do', value: tasksByStatus.todo, color: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-400' },
                { label: 'In Progress', value: tasksByStatus.inprogress, color: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400' },
                { label: 'Done', value: tasksByStatus.done, color: 'bg-emerald-100 dark:bg-emerald-900/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.color} ${item.textColor}`}>
                      {item.value}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color.split(' ')[0]}`}
                      style={{ width: `${totalTasks > 0 ? (item.value / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks by Assignee */}
          <div className="chart-card bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-slate-100 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              Tasks by Assignee
            </h2>
            <div className="space-y-4">
              {tasksByAssignee.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No tasks assigned yet</p>
              ) : (
                tasksByAssignee.map((assignee) => (
                  <div key={assignee.name}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{assignee.name}</p>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {assignee.completed}/{assignee.assigned} completed
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-purple-500"
                        style={{ width: `${assignee.assigned > 0 ? (assignee.completed / assignee.assigned) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Time Logged by Team */}
          <div className="chart-card bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-slate-100 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-orange-500" />
              Time Logged by Team
            </h2>
            <div className="space-y-4">
              {timeByAssignee.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No time logged yet</p>
              ) : (
                timeByAssignee.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</p>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.time} min</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-orange-500"
                        style={{ width: `${totalTimeSpent > 0 ? (item.time / totalTimeSpent) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

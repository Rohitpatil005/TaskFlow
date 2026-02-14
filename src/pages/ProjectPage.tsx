import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import axios from 'axios';
import { ArrowLeft, Moon, Sun, BarChart3, Calendar as CalendarIcon, Download, X } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import { exportToCSV, exportToPDF, exportToJSON } from '../services/exportService';

interface Project {
  _id: string;
  name: string;
  description: string;
  owner: { _id: string; name: string; email: string };
  members: Array<{ _id: string; name: string; email: string }>;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (projectId && token) {
      fetchProject();
    }
  }, [projectId, token]);

  const fetchProject = async () => {
    try {
      const [projectResponse, tasksResponse] = await Promise.all([
        axios.get(`${API_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/tasks/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: [] }))
      ]);
      setProject(projectResponse.data);
      setTasks(tasksResponse.data);
    } catch (error) {
      console.warn('Failed to fetch project from API, using demo data');
      // Use demo data if backend is not available
      const demoProjects: { [key: string]: Project } = {
        'demo-project-1': {
          _id: 'demo-project-1',
          name: 'Project Alpha',
          description: 'Main project with multiple tasks',
          owner: { _id: 'admin-user-123', name: 'Admin User', email: 'admin@example.com' },
          members: [
            { _id: 'admin-user-123', name: 'Admin User', email: 'admin@example.com' },
            { _id: 'user-user-456', name: 'User Demo', email: 'user@example.com' }
          ],
          createdAt: new Date().toISOString()
        },
        'demo-project-2': {
          _id: 'demo-project-2',
          name: 'Design System',
          description: 'UI/UX design components and patterns',
          owner: { _id: 'admin-user-123', name: 'Admin User', email: 'admin@example.com' },
          members: [
            { _id: 'admin-user-123', name: 'Admin User', email: 'admin@example.com' }
          ],
          createdAt: new Date().toISOString()
        }
      };

      if (projectId && demoProjects[projectId]) {
        setProject(demoProjects[projectId]);
      } else {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">TaskFlow</h1>
            <p className="text-slate-300">Loading your project...</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 text-center">
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-3xl font-bold text-white mb-2">Project Not Found</h2>
            <p className="text-red-200 mb-6">The project you're looking for doesn't exist or has been deleted.</p>
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleExport = (format: 'csv' | 'pdf' | 'json') => {
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const exportData = {
      projectName: project.name,
      exportDate: new Date().toISOString(),
      totalTasks: tasks.length,
      completedTasks,
      tasks: tasks.map((task) => ({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee?.name,
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : undefined,
        labels: task.labels,
        comments: task.comments?.length || 0,
        timeSpent: task.totalTimeSpent
      })),
      teamMembers: project.members
    };

    if (format === 'csv') {
      exportToCSV(exportData);
    } else if (format === 'pdf') {
      exportToPDF(exportData);
    } else if (format === 'json') {
      exportToJSON(exportData);
    }

    setShowExportModal(false);
  };

  return (
    <div className="project-page min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
      {/* Header */}
      <header className="project-header bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sticky top-0 z-10 shadow-lg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate('/')}
              className="back-btn flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/project/${projectId}/analytics`)}
                className="analytics-btn flex items-center gap-2 px-4 py-2 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-all font-medium"
              >
                <BarChart3 className="w-5 h-5" />
                Analytics
              </button>
              <button
                onClick={() => navigate(`/project/${projectId}/calendar`)}
                className="calendar-btn flex items-center gap-2 px-4 py-2 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-all font-medium"
              >
                <CalendarIcon className="w-5 h-5" />
                Calendar
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="export-btn flex items-center gap-2 px-4 py-2 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-all font-medium"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="project-header-content">
            <h1 className="project-title text-4xl font-bold text-white mb-2">
              {project.name}
            </h1>
            {project.description && (
              <p className="project-description text-slate-300 text-lg">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="project-main max-w-7xl mx-auto px-6 py-10">
        {/* Project Info Cards */}
        <div className="project-meta mb-10">
          <div className="meta-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Owner Card */}
            <div className="meta-item bg-white rounded-2xl p-8 shadow-md border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 mb-4">
                <span className="text-xl">👤</span>
              </div>
              <p className="meta-label text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Project Owner
              </p>
              <p className="meta-value text-lg font-semibold text-slate-900">
                {project.owner.name}
              </p>
              <p className="text-sm text-slate-500 mt-2">{project.owner.email}</p>
            </div>

            {/* Team Members Card */}
            <div className="meta-item bg-white rounded-2xl p-8 shadow-md border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100 mb-4">
                <span className="text-xl">👥</span>
              </div>
              <p className="meta-label text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Team Members
              </p>
              <div className="meta-members flex items-center gap-3 flex-wrap mb-3">
                {project.members.map((member) => (
                  <div key={member._id} title={`${member.name} - ${member.email}`}>
                    <div
                      className="member-avatar w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md"
                    >
                      {member.name[0].toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 font-medium">{project.members.length} member{project.members.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Created Date Card */}
            <div className="meta-item bg-white rounded-2xl p-8 shadow-md border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-100 mb-4">
                <span className="text-xl">📅</span>
              </div>
              <p className="meta-label text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Created
              </p>
              <p className="meta-value text-lg font-semibold text-slate-900">
                {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                {Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
              </p>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="kanban-container bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 p-8 transition-colors duration-300">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent mb-8">Tasks</h2>
          {projectId && (
            <KanbanBoard projectId={projectId} token={token!} />
          )}
        </div>
      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Export Project</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-600 dark:text-slate-400 mb-6">Choose format to export your project data:</p>

              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">CSV Format</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Spreadsheet compatible</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <span className="text-lg">📄</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">PDF Format</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Printable document</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <span className="text-lg">⚙️</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">JSON Format</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">For backup & import</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

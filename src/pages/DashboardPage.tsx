import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import axios from 'axios';
import { Plus, LogOut, Settings, Bell, Users, X, Mail, Calendar, Shield, Moon, Sun } from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description: string;
  owner: { _id: string; name: string; email: string };
  members: Array<{ _id: string; name: string; email: string }>;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProject(response.data[0]);
      }
    } catch (error) {
      console.warn('Failed to fetch projects from API, using demo data');
      // Use demo data if backend is not available
      const demoProjects: Project[] = [
        {
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
        {
          _id: 'demo-project-2',
          name: 'Design System',
          description: 'UI/UX design components and patterns',
          owner: { _id: 'admin-user-123', name: 'Admin User', email: 'admin@example.com' },
          members: [
            { _id: 'admin-user-123', name: 'Admin User', email: 'admin@example.com' }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      setProjects(demoProjects);
      if (demoProjects.length > 0) {
        setSelectedProject(demoProjects[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetchProjects();
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = async () => {
    const name = prompt('Enter project name:');
    if (!name?.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/projects`,
        { name, description: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects([...projects, response.data]);
    } catch (error) {
      console.warn('Backend not available, creating demo project');
      // Create a demo project if backend is not available
      const ownerData = {
        _id: user?.id || 'unknown',
        name: user?.name || 'Unknown',
        email: user?.email || 'unknown@example.com'
      };
      const newProject: Project = {
        _id: `demo-project-${Date.now()}`,
        name,
        description: '',
        owner: ownerData,
        members: [ownerData],
        createdAt: new Date().toISOString()
      };
      setProjects([...projects, newProject]);
    }
  };

  return (
    <div className="dashboard-page flex h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="sidebar w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-r border-slate-700 dark:border-slate-800 flex flex-col shadow-2xl transition-colors duration-300">
        {/* Logo */}
        <div className="sidebar-header p-6 border-b border-slate-700 dark:border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">TaskIT</h1>
          <p className="text-xs text-slate-400 mt-1">Project Manager</p>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1 p-4 space-y-3">
          <button onClick={() => navigate('/')} className="nav-item flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 transition-all font-medium border border-transparent hover:border-blue-500/30 w-full text-left">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg"></div>
            Board
          </button>
          <button onClick={() => setShowTeamModal(true)} className="nav-item flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-purple-600/20 hover:text-purple-400 transition-all border border-transparent hover:border-purple-500/30 w-full text-left">
            <Users className="w-5 h-5 text-purple-400" />
            Team
          </button>
          <button onClick={() => setShowNotificationsModal(true)} className="nav-item flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-emerald-600/20 hover:text-emerald-400 transition-all border border-transparent hover:border-emerald-500/30 w-full text-left">
            <Bell className="w-5 h-5 text-emerald-400" />
            Notifications
          </button>
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 border-t border-slate-700 dark:border-slate-800">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all border border-slate-600/30 dark:border-slate-700/30"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                Dark Mode
              </>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="sidebar-footer p-4 border-t border-slate-700 dark:border-slate-800 space-y-4">
          <button onClick={() => setShowProfileModal(true)} className="user-profile flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-slate-600/30 w-full hover:border-slate-500/50 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="logout-btn w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-red-600/20 rounded-xl transition-all border border-transparent hover:border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="header bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-700/50 dark:border-slate-800/50 px-8 py-6 flex items-center justify-between shadow-lg transition-colors duration-300">
          <div className="header-left">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Dashboard
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage all your projects</p>
          </div>
          <div className="header-right flex items-center gap-3">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input px-4 py-2.5 rounded-lg border border-slate-500/30 bg-slate-700/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400 transition-all hover:border-slate-500/50"
            />
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="sync-btn px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all disabled:opacity-60 flex items-center gap-2"
            >
              <span className={`${isSyncing ? 'animate-spin' : ''}`}>◐</span>
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
            <button
              onClick={() => selectedProject && navigate(`/project/${selectedProject._id}`)}
              className="new-task-btn flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="content flex-1 overflow-auto bg-gradient-to-br from-transparent via-purple-50/30 to-transparent dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900/30 dark:to-slate-950 transition-colors duration-300">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-600 text-lg">Loading...</p>
            </div>
          ) : !selectedProject ? (
            <div className="flex flex-col items-center justify-center h-full">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">No projects yet</h3>
              <button
                onClick={handleCreateProject}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Create First Project
              </button>
            </div>
          ) : (
            <div className="p-8">
              <button
                onClick={handleCreateProject}
                className="mb-8 flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium hover:border-slate-400 dark:hover:border-slate-500"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project, index) => {
                    const gradients = [
                      'from-blue-500 to-cyan-500',
                      'from-purple-500 to-pink-500',
                      'from-emerald-500 to-teal-500',
                      'from-orange-500 to-red-500',
                      'from-indigo-500 to-purple-500',
                      'from-rose-500 to-pink-500'
                    ];
                    const gradient = gradients[index % gradients.length];

                    return (
                      <div
                        key={project._id}
                        onClick={() => {
                          setSelectedProject(project);
                          navigate(`/project/${project._id}`);
                        }}
                        className={`project-card bg-gradient-to-br ${gradient} rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer p-6 text-white overflow-hidden relative group transform hover:-translate-y-2`}
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="project-name text-xl font-bold mb-2">
                                {project.name}
                              </h3>
                            </div>
                            <div className="text-2xl">📁</div>
                          </div>
                          <p className="project-description text-white/90 text-sm mb-6 line-clamp-2">
                            {project.description || 'No description provided'}
                          </p>
                          <div className="project-footer space-y-2 pt-4 border-t border-white/20">
                            <div className="flex items-center gap-2 text-sm">
                              <span>👤</span>
                              <span className="text-white/90">{project.owner.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span>👥</span>
                              <span className="text-white/90">{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-16">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No projects found</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Try adjusting your search or create a new project</p>
                    <button
                      onClick={handleCreateProject}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Create New Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/80 backdrop-blur">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                Team Members
              </h2>
              <button onClick={() => setShowTeamModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedProject?.members && selectedProject.members.length > 0 ? (
                selectedProject.members.map((member) => (
                  <div key={member._id} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-purple-500/30 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
                      {member.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{member.name}</p>
                      <p className="text-sm text-slate-400">{member.email}</p>
                    </div>
                    {member._id === selectedProject.owner._id && (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
                        Owner
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No team members</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/80 backdrop-blur">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-emerald-400" />
                Notifications
              </h2>
              <button onClick={() => setShowNotificationsModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Project Invitation</p>
                    <p className="text-sm text-slate-400 mt-1">You were added to a new project</p>
                    <p className="text-xs text-slate-500 mt-2">2 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Task Assigned</p>
                    <p className="text-sm text-slate-400 mt-1">You have been assigned a new task</p>
                    <p className="text-xs text-slate-500 mt-2">5 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Team Member Joined</p>
                    <p className="text-sm text-slate-400 mt-1">A new member has joined your project</p>
                    <p className="text-xs text-slate-500 mt-2">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-400" />
                Profile Settings
              </h2>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg">
                  {user?.name?.[0]}
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{user?.name}</p>
                  <p className="text-sm text-slate-400 capitalize">{user?.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Email</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>

                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Role</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user?.role === 'admin'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Member Since</p>
                  <p className="text-white font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowProfileModal(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

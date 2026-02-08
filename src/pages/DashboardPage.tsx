import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import { Plus, LogOut, Settings, Bell, Users } from 'lucide-react';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
    <div className="dashboard-page flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="sidebar-header p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1 p-4 space-y-2">
          <a href="#board" className="nav-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium">
            <div className="w-5 h-5 bg-gray-400 rounded"></div>
            Board
          </a>
          <a href="#team" className="nav-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
            <Users className="w-5 h-5" />
            Team
          </a>
          <a href="#notifications" className="nav-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            Notifications
          </a>
        </nav>

        {/* User Profile */}
        <div className="sidebar-footer p-4 border-t border-gray-200 space-y-4">
          <div className="user-profile flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-semibold text-gray-700">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="header bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="header-left">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedProject?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="header-right flex items-center gap-4">
            <input
              type="text"
              placeholder="Search tasks, tags, or assignees..."
              className="search-input px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button className="simulate-btn px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
              ◐ Simulate Sync
            </button>
            <button
              onClick={() => selectedProject && navigate(`/project/${selectedProject._id}`)}
              className="new-task-btn flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="content flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : !selectedProject ? (
            <div className="flex flex-col items-center justify-center h-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No projects yet</h3>
              <button
                onClick={handleCreateProject}
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Project
              </button>
            </div>
          ) : (
            <div className="p-8">
              <button
                onClick={handleCreateProject}
                className="mb-8 flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    onClick={() => {
                      setSelectedProject(project);
                      navigate(`/project/${project._id}`);
                    }}
                    className="project-card bg-white rounded-lg shadow hover:shadow-md transition-all cursor-pointer p-6 border-t-4 border-blue-500"
                  >
                    <h3 className="project-name text-lg font-bold text-gray-900 mb-2">
                      {project.name}
                    </h3>
                    <p className="project-description text-gray-600 text-sm mb-4">
                      {project.description || 'No description'}
                    </p>
                    <div className="project-footer text-xs text-gray-500 space-y-1">
                      <p>Owner: {project.owner.name}</p>
                      <p>Members: {project.members.length}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

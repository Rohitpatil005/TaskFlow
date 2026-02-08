import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';

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
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && token) {
      fetchProject();
    }
  }, [projectId, token]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject(response.data);
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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  return (
    <div className="project-page min-h-screen bg-gray-50">
      {/* Header */}
      <header className="project-header bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/')}
            className="back-btn flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </button>
          <div className="project-header-content">
            <h1 className="project-title text-3xl font-bold text-gray-900 mb-1">
              {project.name}
            </h1>
            {project.description && (
              <p className="project-description text-gray-600">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="project-main max-w-7xl mx-auto px-6 py-8">
        <div className="project-meta mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <div className="meta-grid grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="meta-item">
              <p className="meta-label text-sm font-semibold text-gray-600 uppercase">
                Owner
              </p>
              <p className="meta-value text-gray-900 font-medium">
                {project.owner.name}
              </p>
            </div>
            <div className="meta-item">
              <p className="meta-label text-sm font-semibold text-gray-600 uppercase">
                Team Members
              </p>
              <div className="meta-members flex items-center gap-2 mt-1">
                {project.members.map((member) => (
                  <span
                    key={member._id}
                    className="member-avatar w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold"
                    title={member.name}
                  >
                    {member.name[0]}
                  </span>
                ))}
              </div>
            </div>
            <div className="meta-item">
              <p className="meta-label text-sm font-semibold text-gray-600 uppercase">
                Created
              </p>
              <p className="meta-value text-gray-900 font-medium">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="kanban-container bg-white rounded-lg p-6">
          {projectId && (
            <KanbanBoard projectId={projectId} token={token!} />
          )}
        </div>
      </main>
    </div>
  );
}

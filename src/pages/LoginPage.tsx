import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: 'admin@example.com',
    password: '123456',
    name: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleDemoLogin = async (role: 'admin' | 'user') => {
    setLoading(true);
    setError('');
    try {
      const demoCredentials = {
        admin: { email: 'admin@example.com', password: '123456' },
        user: { email: 'user@example.com', password: '123456' },
      };
      await login(demoCredentials[role].email, demoCredentials[role].password);
      navigate('/');
    } catch {
      setError('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.name);
      }
      navigate('/');
    } catch {
      setError(mode === 'login' ? 'Invalid email or password' : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page min-h-screen flex items-center justify-center p-8"
      style={{
        backgroundImage: 'url(https://cdn.builder.io/api/v1/image/assets%2Fac959fb4a2c642cdad570cf5ce6b4aad%2Fdcc5fa33276b4cf79301ae9ee9e744fa?format=webp&width=800&height=1200)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="auth-form-box bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">TaskFlow</h1>
            <p className="text-gray-600 text-sm mt-2">Project Management</p>
          </div>

          {/* Form Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <p className="text-gray-600 text-sm mb-8">
            {mode === 'login'
              ? 'Welcome back. Enter your details below.'
              : 'Get started with TaskFlow today.'}
          </p>

          {/* Tabs */}
          <div className="form-tabs flex gap-0 mb-8 border-b border-gray-200">
            <button
              onClick={() => setMode('login')}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="input-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                  required={mode === 'signup'}
                />
              </div>
            )}

            <div className="input-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                required
              />
            </div>

            <div className="input-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                required
              />
            </div>

            {error && (
              <div className="error-alert bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-button w-full bg-gray-900 text-white py-2.5 px-4 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Moon, Sun } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
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
    <div className="auth-page min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-100 dark:via-purple-50 dark:to-slate-100 relative overflow-hidden transition-colors duration-300">
      {/* Animated background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-8 p-2 rounded-lg bg-white/10 dark:bg-slate-800/30 hover:bg-white/20 dark:hover:bg-slate-700/30 text-white dark:text-slate-300 transition-all border border-white/20 dark:border-slate-700/30 z-10"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="auth-form-box bg-gradient-to-br from-slate-800/40 to-slate-900/40 dark:from-white/40 dark:to-slate-100/40 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-700/30 dark:border-slate-300/30 transition-colors duration-300">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">TaskIT</h1>
            <p className="text-slate-300 dark:text-slate-700 text-sm mt-2 font-medium">Project Management</p>
          </div>

          {/* Form Title */}
          <h2 className="text-2xl font-bold text-white dark:text-slate-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </h2>
          <p className="text-slate-300 dark:text-slate-600 text-sm mb-8">
            {mode === 'login'
              ? 'Enter your credentials to access your projects.'
              : 'Create your account to manage projects efficiently.'}
          </p>

          {/* Tabs */}
          <div className="form-tabs flex gap-0 mb-8 bg-slate-700/30 dark:bg-slate-400/20 rounded-lg p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 pb-2 px-2 text-sm font-semibold rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 pb-2 px-2 text-sm font-semibold rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="input-group">
                <label className="block text-sm font-semibold text-slate-200 dark:text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-slate-600/50 dark:border-slate-400/50 rounded-lg bg-slate-700/20 dark:bg-slate-300/20 text-white dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                  required={mode === 'signup'}
                />
              </div>
            )}

            <div className="input-group">
              <label className="block text-sm font-semibold text-slate-200 dark:text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-slate-600/50 dark:border-slate-400/50 rounded-lg bg-slate-700/20 dark:bg-slate-300/20 text-white dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                required
              />
            </div>

            <div className="input-group">
              <label className="block text-sm font-semibold text-slate-200 dark:text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-600/50 dark:border-slate-400/50 rounded-lg bg-slate-700/20 dark:bg-slate-300/20 text-white dark:text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                required
              />
            </div>

            {error && (
              <div className="error-alert bg-red-500/20 dark:bg-red-500/10 border border-red-500/50 dark:border-red-500/30 text-red-200 dark:text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-button w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-3 transform hover:scale-105"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Demo Buttons */}
          {mode === 'login' && (
            <div className="mt-6 space-y-2 pt-6 border-t border-slate-700/30 dark:border-slate-400/30">
              <p className="text-xs text-slate-400 dark:text-slate-600 text-center mb-3">Quick demo access</p>
              <button
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-slate-600/50 dark:border-slate-400/50 rounded-lg text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-700/30 dark:hover:bg-slate-300/30 transition-all text-sm font-medium"
              >
                👤 Admin Demo
              </button>
              <button
                onClick={() => handleDemoLogin('user')}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-slate-600/50 dark:border-slate-400/50 rounded-lg text-slate-300 dark:text-slate-700 hover:text-white dark:hover:text-slate-900 hover:bg-slate-700/30 dark:hover:bg-slate-300/30 transition-all text-sm font-medium"
              >
                👥 User Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

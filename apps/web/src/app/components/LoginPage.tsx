import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, LogIn, Leaf, Droplet, Trees, Loader2 } from 'lucide-react';
import { appLogo } from '../../assets/brand';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 flex items-center justify-center p-4 py-8 sm:py-10 relative overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 opacity-10">
          <Trees className="w-64 h-64 text-white" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-10">
          <Leaf className="w-48 h-48 text-white" />
        </div>
        <div className="absolute top-1/2 right-1/4 opacity-10">
          <Droplet className="w-32 h-32 text-white" />
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <img
                src={appLogo}
                alt="Bantay Kalikasan Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">MENRO Portal</h1>
            <p className="text-gray-600 mb-1">BANTAY KALIKASAN</p>
            <p className="text-sm text-gray-500">Municipality of Rizal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="your.email@rizal.gov"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-70 text-white py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/citizen-login')}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-800 mb-3"
            >
              Are you a citizen? <span className="text-green-600 font-medium">Submit an Inquiry →</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mb-3"
            >
              ← Back to Website
            </button>
            <p className="text-center text-xs text-gray-500">
              Protected by Municipal Government Security
            </p>
            <p className="text-center text-xs text-gray-400 mt-1">
              © 2026 Municipality of Rizal - MENRO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

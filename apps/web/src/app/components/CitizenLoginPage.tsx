import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Lock, Mail, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useCitizenAuth } from '../contexts/CitizenAuthContext';
import type { InquiryPrefill } from '../lib/inquiryPrefill';
import { appLogo } from '../../assets/brand';

export function CitizenLoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useCitizenAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inquiryPrefill = location.state as Partial<InquiryPrefill> | null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegistering) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const err = await register({ name, email, password, phone });
      setLoading(false);
      if (err) {
        setError(err);
      } else {
        navigate('/citizen-portal', { state: inquiryPrefill ?? undefined });
      }
    } else {
      const err = await login(email, password);
      setLoading(false);
      if (err) {
        setError(err);
      } else {
        navigate('/citizen-portal', { state: inquiryPrefill ?? undefined });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 flex items-center justify-center p-4 py-8 sm:py-10 overflow-x-hidden">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <img src={appLogo} alt="Bantay Kalikasan Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isRegistering ? 'Create Account' : 'Citizen Portal'}
            </h1>
            <p className="text-gray-600">MENRO Online Inquiry System</p>
            <p className="text-sm text-gray-500 mt-1">Municipality of Rizal</p>
          </div>

          {inquiryPrefill?.subject && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              You selected <strong>{inquiryPrefill.subject}</strong>
              {inquiryPrefill.category ? ` (${inquiryPrefill.category})` : ''}. Sign in or register to continue.
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                !isRegistering ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                isRegistering ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Juan Dela Cruz"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0917-XXX-XXXX"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="your.email@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Enter password"
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
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRegistering ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            <button
              type="button"
              onClick={() => navigate('/staff-login')}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
            >
              Are you a MENRO staff member? <span className="text-green-600 font-medium">Staff Login →</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

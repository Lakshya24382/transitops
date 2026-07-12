import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="w-1/2 bg-[#1a1f2e] text-white p-16 flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 bg-brand-gold rounded-md mb-6 flex items-center justify-center font-bold text-brand-navy">
            T
          </div>
          <h1 className="text-2xl font-semibold">TransitOps</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Transport Operations Platform</p>

          <div className="mt-16">
            <p className="text-sm text-gray-300 mb-3">One login, four roles:</p>
            <ul className="space-y-2 text-sm text-gray-400">
              {['Dispatcher', 'Fleet Manager', 'Safety Officer', 'Financial Analyst'].map(r => (
                <li key={r} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-gold rounded-full" /> {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 text-xs text-gray-500 space-y-1">
            <p>Access is scoped by role after login:</p>
            <p>• Fleet Manager → Fleet, Maintenance</p>
            <p>• Dispatcher → Dashboard, Trips</p>
            <p>• Safety Officer → Drivers, Compliance</p>
            <p>• Financial Analyst → Fuel & Expenses, Analytics</p>
          </div>
        </div>
        <p className="text-xs text-gray-600">TRANSITOPS © 2026 · RBAC ENABLED</p>
      </div>

      {/* Right panel: form */}
      <div className="w-1/2 flex items-center justify-center p-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Sign in to your account</h2>
          <p className="text-gray-500 text-sm mt-1 mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="raven@transitops.in"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
                ✗ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold text-white font-medium rounded-md py-2.5 text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

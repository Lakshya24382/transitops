import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Dispatcher', 'Fleet Manager', 'Safety Officer', 'Financial Analyst'];

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Dispatcher' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create an account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" required placeholder="Full name" value={form.name} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="Email" value={form.email} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <input name="password" type="password" required placeholder="Password" value={form.password} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <select name="role" value={form.role} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-brand-gold text-white font-medium rounded-md py-2.5 text-sm hover:opacity-90 disabled:opacity-50">
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Already have an account? <a href="/login" className="text-brand-gold font-medium">Sign in</a>
        </p>
      </div>
    </div>
  );
}

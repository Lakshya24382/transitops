import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';

const ROLES = ['Dispatcher', 'Safety Officer', 'Financial Analyst'];

export default function Signup() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Dispatcher' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await authApi.signup(form);
      setSuccess(`Account created for ${form.name} (${form.role})`);
      setForm({ name: '', email: '', password: '', role: 'Dispatcher' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Create User Account">
      <div className="max-w-sm bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500 mb-4">
          Fleet Managers can create accounts for team members here. Users cannot self-register.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" required placeholder="Full name" value={form.name} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="Email" value={form.email} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <input name="password" type="password" required placeholder="Temporary password" value={form.password} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <select name="role" value={form.role} onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-3 py-2">{success}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-brand-gold text-white font-medium rounded-md py-2.5 text-sm hover:opacity-90 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

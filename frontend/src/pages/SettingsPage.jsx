import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import { Check, Minus } from 'lucide-react';

const RBAC_MATRIX = [
  { role: 'Fleet Manager', fleet: 'full', drivers: 'full', trips: 'view', fuelExp: 'full', analytics: 'full' },
  { role: 'Dispatcher', fleet: 'view', drivers: 'view', trips: 'full', fuelExp: 'none', analytics: 'none' },
  { role: 'Safety Officer', fleet: 'none', drivers: 'full', trips: 'none', fuelExp: 'none', analytics: 'view' },
  { role: 'Financial Analyst', fleet: 'none', drivers: 'none', trips: 'none', fuelExp: 'full', analytics: 'full' },
];

function AccessIcon({ level }) {
  if (level === 'full') return <Check size={14} className="text-green-600 mx-auto" />;
  if (level === 'view') return <span className="text-xs text-blue-500 font-medium">view</span>;
  return <Minus size={14} className="text-gray-300 mx-auto" />;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const isFleetManager = user?.role === 'Fleet Manager';

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // General (Fleet Manager only, local demo state)
  const [depotName, setDepotName] = useState('Gandhinagar Depot 674');
  const [currency, setCurrency] = useState('INR (₹)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');
  const [generalSaved, setGeneralSaved] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErr('');
    setProfileMsg('');
    setProfileLoading(true);
    try {
      const { user: updated } = await authApi.updateProfile(name);
      updateUser(updated);
      setProfileMsg('Name updated successfully');
    } catch (err) {
      setProfileErr(err.response?.data?.error || 'Failed to update name');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');
    if (newPassword !== confirmPassword) {
      setPwErr('New password and confirmation do not match');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwMsg('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwErr(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleGeneralSave = (e) => {
    e.preventDefault();
    // Placeholder: no settings table in schema; wire to backend if time permits.
    setGeneralSaved(true);
    setTimeout(() => setGeneralSaved(false), 2000);
  };

  return (
    <Layout title="Settings">
      <div className="grid grid-cols-2 gap-6">
        {/* Profile — all roles */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Profile</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Email</label>
              <input value={user?.email} disabled
                className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Role</label>
              <input value={user?.role} disabled
                className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            {profileErr && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{profileErr}</div>}
            {profileMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-3 py-2">{profileMsg}</div>}
            <button type="submit" disabled={profileLoading}
              className="bg-brand-gold text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 disabled:opacity-50">
              {profileLoading ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* Change Password — all roles */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase">Current Password</label>
              <input required type="password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">New Password</label>
              <input required type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Confirm New Password</label>
              <input required type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            {pwErr && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{pwErr}</div>}
            {pwMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-3 py-2">{pwMsg}</div>}
            <button type="submit" disabled={pwLoading}
              className="bg-brand-gold text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 disabled:opacity-50">
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Fleet Manager only: General + Create User */}
        {isFleetManager && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">General</h3>
            <a href="/signup" className="inline-block text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md mb-4 hover:bg-gray-200">
              + Create User Account
            </a>
            <form onSubmit={handleGeneralSave} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Depot Name</label>
                <input value={depotName} onChange={(e) => setDepotName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1">
                  <option>INR (₹)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Distance Unit</label>
                <select value={distanceUnit} onChange={(e) => setDistanceUnit(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1">
                  <option>Kilometers</option>
                  <option>Miles</option>
                </select>
              </div>
              <button type="submit" className="bg-brand-gold text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90">
                {generalSaved ? 'Saved ✓' : 'Save changes'}
              </button>
            </form>
          </div>
        )}

        {/* Fleet Manager only: RBAC Matrix */}
        {isFleetManager && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Role-Based Access (RBAC)</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                  <th className="pb-2">Role</th>
                  <th className="pb-2 text-center">Fleet</th>
                  <th className="pb-2 text-center">Drivers</th>
                  <th className="pb-2 text-center">Trips</th>
                  <th className="pb-2 text-center">Fuel/Exp</th>
                  <th className="pb-2 text-center">Analytics</th>
                </tr>
              </thead>
              <tbody>
                {RBAC_MATRIX.map(row => (
                  <tr key={row.role} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium text-gray-800">{row.role}</td>
                    <td className="py-2.5 text-center"><AccessIcon level={row.fleet} /></td>
                    <td className="py-2.5 text-center"><AccessIcon level={row.drivers} /></td>
                    <td className="py-2.5 text-center"><AccessIcon level={row.trips} /></td>
                    <td className="py-2.5 text-center"><AccessIcon level={row.fuelExp} /></td>
                    <td className="py-2.5 text-center"><AccessIcon level={row.analytics} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-4">
              ✓ full access · "view" read-only · — no access
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

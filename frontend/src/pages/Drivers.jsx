import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import * as driversApi from '../api/drivers';

const emptyForm = {
  name: '', license_no: '', license_category: 'LMV',
  license_expiry: '', contact_no: '', safety_score: 100,
};

function isExpired(dateStr) {
  return new Date(dateStr) < new Date();
}

export default function Drivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const canEdit = user?.role === 'Fleet Manager' || user?.role === 'Safety Officer';

  const load = async () => {
    setLoading(true);
    try {
      const data = await driversApi.getDrivers();
      setDrivers(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.license_no.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await driversApi.createDriver(form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add driver');
    }
  };

  const toggleStatus = async (driver, newStatus) => {
    try {
      await driversApi.updateDriver(driver.id, { status: newStatus });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  return (
    <Layout title="Drivers & Safety Profiles">
      <div className="flex items-center justify-between mb-4">
        <input
          placeholder="Search name, license..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
        />
        {canEdit && (
          <button onClick={() => setShowModal(true)}
            className="bg-brand-gold text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90">
            + Add Driver
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">License No.</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Safety</th>
              <th className="px-4 py-3">Status</th>
              {canEdit && <th className="px-4 py-3">Toggle</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-6 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-6 text-gray-400">No drivers found</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                <td className="px-4 py-3 text-gray-600">{d.license_no}</td>
                <td className="px-4 py-3 text-gray-600">{d.license_category}</td>
                <td className={`px-4 py-3 ${isExpired(d.license_expiry) ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                  {new Date(d.license_expiry).toLocaleDateString()}
                  {isExpired(d.license_expiry) && ' EXPIRED'}
                </td>
                <td className="px-4 py-3 text-gray-600">{d.contact_no}</td>
                <td className="px-4 py-3 text-gray-600">{d.safety_score}%</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <select
                      value={d.status}
                      onChange={(e) => toggleStatus(d, e.target.value)}
                      className="border border-gray-200 rounded text-xs px-2 py-1"
                    >
                      {['Available', 'On Trip', 'Off Duty', 'Suspended'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-red-500 mt-3">
        Rule: Expired license or Suspended status → blocked from trip assignment
      </p>

      {showModal && (
        <Modal title="Add Driver" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Full Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <input required placeholder="License No." value={form.license_no}
              onChange={(e) => setForm({ ...form, license_no: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <select value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {['LMV', 'HMV', 'MC'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div>
              <label className="text-xs text-gray-500">License Expiry</label>
              <input required type="date" value={form.license_expiry}
                onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
            <input required placeholder="Contact Number" value={form.contact_no}
              onChange={(e) => setForm({ ...form, contact_no: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <div>
              <label className="text-xs text-gray-500">Safety Score</label>
              <input type="number" min="0" max="100" value={form.safety_score}
                onChange={(e) => setForm({ ...form, safety_score: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{error}</div>}
            <button type="submit" className="w-full bg-brand-gold text-white font-medium rounded-md py-2.5 text-sm hover:opacity-90">
              Save Driver
            </button>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

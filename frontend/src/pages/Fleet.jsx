import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { downloadCSV, downloadPDF } from '../utils/downloadCSV';
import * as vehiclesApi from '../api/vehicles';

const VEHICLE_TYPES = ['Van', 'Truck', 'Mini'];
const STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

const emptyForm = {
  registration_no: '', name_model: '', type: 'Van',
  max_capacity_kg: '', odometer: 0, acquisition_cost: '', region: '',
};

export default function Fleet() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const canEdit = user?.role === 'Fleet Manager';

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await vehiclesApi.getVehicles(params);
      setVehicles(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

  const filtered = vehicles.filter(v =>
    v.registration_no.toLowerCase().includes(search.toLowerCase()) ||
    v.name_model.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await vehiclesApi.createVehicle(form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add vehicle');
    }
  };

  return (
    <Layout title="Vehicle Registry">
      <div className="flex items-center justify-between mb-4 gap-3">
        <input
          placeholder="Search reg, model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
        />
        <div className="flex items-center gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Type: All</option>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Status: All</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {canEdit && (
            <>
              <button onClick={() => downloadPDF('/export/vehicles/pdf', 'vehicles.pdf')}
                className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-200">
                Export PDF
              </button>
              <button onClick={() => downloadCSV('/export/vehicles', 'vehicles.csv')}
                className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-200">
                Export CSV
              </button>
              <button onClick={() => setShowModal(true)}
                className="bg-brand-gold text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90">
                + Add Vehicle
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">Reg. No (unique)</th>
              <th className="px-4 py-3">Name/Model</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Acq. Cost</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">No vehicles found</td></tr>
            ) : filtered.map(v => (
              <tr key={v.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{v.registration_no}</td>
                <td className="px-4 py-3 text-gray-600">{v.name_model}</td>
                <td className="px-4 py-3 text-gray-600">{v.type}</td>
                <td className="px-4 py-3 text-gray-600">{v.max_capacity_kg} kg</td>
                <td className="px-4 py-3 text-gray-600">{v.odometer}</td>
                <td className="px-4 py-3 text-gray-600">₹{Number(v.acquisition_cost).toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-red-500 mt-3">
        Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
      </p>

      {showModal && (
        <Modal title="Add Vehicle" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Registration No." value={form.registration_no}
              onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <input required placeholder="Name/Model" value={form.name_model}
              onChange={(e) => setForm({ ...form, name_model: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input required type="number" placeholder="Max Capacity (kg)" value={form.max_capacity_kg}
              onChange={(e) => setForm({ ...form, max_capacity_kg: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <input type="number" placeholder="Odometer" value={form.odometer}
              onChange={(e) => setForm({ ...form, odometer: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <input required type="number" placeholder="Acquisition Cost" value={form.acquisition_cost}
              onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <input placeholder="Region" value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{error}</div>}
            <button type="submit" className="w-full bg-brand-gold text-white font-medium rounded-md py-2.5 text-sm hover:opacity-90">
              Save Vehicle
            </button>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

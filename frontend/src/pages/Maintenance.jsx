import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import * as maintenanceApi from '../api/maintenance';
import * as vehiclesApi from '../api/vehicles';

const emptyForm = { vehicle_id: '', service_type: '', cost: '', service_date: '' };

export default function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [logData, vehicleData] = await Promise.all([
        maintenanceApi.getMaintenanceLogs(),
        vehiclesApi.getVehicles(),
      ]);
      setLogs(logData);
      setVehicles(vehicleData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await maintenanceApi.createMaintenance(form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log service record');
    }
  };

  const handleClose = async (id) => {
    setError('');
    try {
      await maintenanceApi.closeMaintenance(id);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close maintenance record');
    }
  };

  // Only vehicles not currently On Trip can get maintenance logged
  const eligibleVehicles = vehicles.filter(v => v.status !== 'On Trip');

  return (
    <Layout title="Maintenance">
      <div className="grid grid-cols-3 gap-4">
        {/* Log Service Record */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Log Service Record</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase">Vehicle</label>
              <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1">
                <option value="">Select vehicle</option>
                {eligibleVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_no} ({v.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Service Type</label>
              <input required placeholder="e.g. Oil Change" value={form.service_type}
                onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Cost</label>
              <input required type="number" value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Date</label>
              <input required type="date" value={form.service_date}
                onChange={(e) => setForm({ ...form, service_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{error}</div>}

            <button type="submit" className="w-full bg-brand-gold text-white font-medium rounded-md py-2.5 text-sm hover:opacity-90">
              Save
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status="Available" /> <span>→</span> <StatusBadge status="In Shop" />
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="In Shop" /> <span>→</span> <StatusBadge status="Available" />
            </div>
            <p className="text-red-400">Note: In Shop vehicles are removed from the dispatch pool</p>
          </div>
        </div>

        {/* Service Log */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">Service Log</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-2">Vehicle</th>
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">Cost</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">No maintenance records yet</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">{log.registration_no}</td>
                  <td className="px-4 py-3 text-gray-600">{log.service_type}</td>
                  <td className="px-4 py-3 text-gray-600">₹{Number(log.cost).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                  <td className="px-4 py-3">
                    {log.status === 'active' && (
                      <button onClick={() => handleClose(log.id)}
                        className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-md font-medium hover:bg-green-100">
                        Mark Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

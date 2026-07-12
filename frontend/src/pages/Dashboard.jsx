import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import * as dashboardApi from '../api/dashboard';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [k, b, t] = await Promise.all([
          dashboardApi.getKPIs(),
          dashboardApi.getVehicleStatusBreakdown(),
          dashboardApi.getRecentTrips(),
        ]);
        setKpis(k);
        setBreakdown(b);
        setRecentTrips(t);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalVehicles = breakdown.reduce((sum, b) => sum + parseInt(b.count), 0) || 1;
  const statusColors = {
    Available: 'bg-green-500',
    'On Trip': 'bg-blue-500',
    'In Shop': 'bg-orange-500',
    Retired: 'bg-red-500',
  };

  if (loading) return <Layout title="Dashboard"><p className="text-gray-400">Loading...</p></Layout>;
  if (error) return <Layout title="Dashboard"><p className="text-red-500">{error}</p></Layout>;

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-7 gap-3 mb-6">
        <KPICard label="Active Vehicles" value={kpis.active_vehicles} />
        <KPICard label="Available Vehicles" value={kpis.available_vehicles} accent="blue" />
        <KPICard label="Vehicles in Maintenance" value={kpis.vehicles_in_maintenance} accent="orange" />
        <KPICard label="Active Trips" value={kpis.active_trips} accent="blue" />
        <KPICard label="Pending Trips" value={kpis.pending_trips} accent="orange" />
        <KPICard label="Drivers on Duty" value={kpis.drivers_on_duty} />
        <KPICard label="Fleet Utilization" value={`${kpis.fleet_utilization_pct}%`} accent="green" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Recent Trips */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Trips</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="pb-2">Trip</th>
                <th className="pb-2">Vehicle</th>
                <th className="pb-2">Driver</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">ETA</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map(trip => (
                <tr key={trip.id} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-800">{trip.trip_code}</td>
                  <td className="py-2 text-gray-600">{trip.vehicle_name || '--'}</td>
                  <td className="py-2 text-gray-600">{trip.driver_name || '--'}</td>
                  <td className="py-2"><StatusBadge status={trip.status} /></td>
                  <td className="py-2 text-gray-500">{trip.eta || 'Awaiting vehicle'}</td>
                </tr>
              ))}
              {recentTrips.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-gray-400">No trips yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vehicle Status breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Vehicle Status</h3>
          <div className="space-y-3">
            {breakdown.map(b => (
              <div key={b.status}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{b.status}</span>
                  <span>{b.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${statusColors[b.status] || 'bg-gray-400'}`}
                    style={{ width: `${(parseInt(b.count) / totalVehicles) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

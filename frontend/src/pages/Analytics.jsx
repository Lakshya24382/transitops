import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as analyticsApi from '../api/analytics';

export default function Analytics() {
  const [fuelEff, setFuelEff] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [opCost, setOpCost] = useState(null);
  const [roiList, setRoiList] = useState([]);
  const [topCostliest, setTopCostliest] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [fe, fu, oc, roi, top, mr] = await Promise.all([
          analyticsApi.getFuelEfficiency(),
          analyticsApi.getFleetUtilization(),
          analyticsApi.getOperationalCostSummary(),
          analyticsApi.getVehicleROI(),
          analyticsApi.getTopCostliest(),
          analyticsApi.getMonthlyRevenue(),
        ]);
        setFuelEff(fe);
        setUtilization(fu);
        setOpCost(oc);
        setRoiList(roi);
        setTopCostliest(top);
        setMonthly(mr);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const avgROI = roiList.length > 0
    ? (roiList.reduce((sum, v) => sum + v.roi_pct, 0) / roiList.length).toFixed(1)
    : 0;

  const maxCost = Math.max(...topCostliest.map(v => parseFloat(v.total_cost)), 1);

  if (loading) return <Layout title="Reports & Analytics"><p className="text-gray-400">Loading...</p></Layout>;
  if (error) return <Layout title="Reports & Analytics"><p className="text-red-500">{error}</p></Layout>;

  return (
    <Layout title="Reports & Analytics">
      <div className="flex items-center justify-between mb-4">
        <input placeholder="Search..." className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64" />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <KPICard label="Fuel Efficiency" value={`${fuelEff.fuel_efficiency_km_per_l} km/l`} accent="blue" />
        <KPICard label="Fleet Utilization" value={`${utilization.fleet_utilization_pct}%`} accent="green" />
        <KPICard label="Operational Cost" value={`₹${opCost.total_operational_cost.toLocaleString()}`} accent="orange" />
        <KPICard label="Vehicle ROI" value={`${avgROI}%`} accent="green" />
      </div>
      <p className="text-xs text-gray-400 mb-6">ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost</p>

      <div className="grid grid-cols-3 gap-4">
        {/* Monthly Revenue Chart */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Revenue</h3>
          {monthly.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No completed trips yet to chart revenue</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Costliest Vehicles */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Costliest Vehicles</h3>
          <div className="space-y-3">
            {topCostliest.length === 0 ? (
              <p className="text-gray-400 text-sm">No cost data yet</p>
            ) : topCostliest.map((v, i) => (
              <div key={v.id}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{v.registration_no}</span>
                  <span>₹{Number(v.total_cost).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-blue-500'}`}
                    style={{ width: `${(parseFloat(v.total_cost) / maxCost) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicle ROI table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-4">
        <h3 className="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">Vehicle ROI Breakdown</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-2">Vehicle</th>
              <th className="px-4 py-2">Revenue</th>
              <th className="px-4 py-2">Fuel</th>
              <th className="px-4 py-2">Maintenance</th>
              <th className="px-4 py-2">ROI</th>
            </tr>
          </thead>
          <tbody>
            {roiList.map(v => (
              <tr key={v.vehicle_id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{v.registration_no}</td>
                <td className="px-4 py-3 text-gray-600">₹{v.revenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">₹{v.total_fuel.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">₹{v.total_maintenance.toLocaleString()}</td>
                <td className={`px-4 py-3 font-medium ${v.roi_pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {v.roi_pct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

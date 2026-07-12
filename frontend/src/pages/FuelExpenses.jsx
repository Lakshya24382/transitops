cat > src/pages/FuelExpenses.jsx << 'EOF'
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import * as fuelExpenseApi from '../api/fuelExpense';
import * as vehiclesApi from '../api/vehicles';

const emptyFuelForm = { vehicle_id: '', liters: '', cost: '', log_date: '' };
const emptyExpenseForm = { vehicle_id: '', toll: '', other: '' };

export default function FuelExpenses() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [fuelForm, setFuelForm] = useState(emptyFuelForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [f, e, v] = await Promise.all([
        fuelExpenseApi.getFuelLogs(),
        fuelExpenseApi.getExpenses(),
        vehiclesApi.getVehicles(),
      ]);
      setFuelLogs(f);
      setExpenses(e);
      setVehicles(v);

      // Sum operational cost across all vehicles
      const costs = await Promise.all(v.map(veh => fuelExpenseApi.getOperationalCost(veh.id)));
      const total = costs.reduce((sum, c) => sum + c.total_operational_cost, 0);
      setTotalCost(total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await fuelExpenseApi.logFuel(fuelForm);
      setShowFuelModal(false);
      setFuelForm(emptyFuelForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log fuel');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await fuelExpenseApi.addExpense(expenseForm);
      setShowExpenseModal(false);
      setExpenseForm(emptyExpenseForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
    }
  };

  return (
    <Layout title="Fuel & Expense Management">
      <div className="flex items-center justify-between mb-4">
        <input placeholder="Search..." className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64" />
        <div className="flex gap-2">
          <button onClick={() => setShowFuelModal(true)}
            className="bg-brand-gold text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90">
            + Log Fuel
          </button>
          <button onClick={() => setShowExpenseModal(true)}
            className="bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90">
            + Add Expense
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2 mb-4">{error}</div>}

      <div className="grid grid-cols-1 gap-6">
        {/* Fuel Logs */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">Fuel Logs</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-2">Vehicle</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Liters</th>
                <th className="px-4 py-2">Fuel Cost</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-6 text-gray-400">Loading...</td></tr>
              ) : fuelLogs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-gray-400">No fuel logs yet</td></tr>
              ) : fuelLogs.map(log => (
                <tr key={log.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">{log.registration_no}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(log.log_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{log.liters} L</td>
                  <td className="px-4 py-3 text-gray-600">₹{Number(log.cost).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expenses */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">Other Expenses (Toll / Misc)</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-2">Trip</th>
                <th className="px-4 py-2">Vehicle</th>
                <th className="px-4 py-2">Toll</th>
                <th className="px-4 py-2">Other</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">No expenses logged yet</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-600">{exp.trip_code || '--'}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{exp.registration_no}</td>
                  <td className="px-4 py-3 text-gray-600">₹{Number(exp.toll).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">₹{Number(exp.other).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">₹{Number(exp.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-600">Total Operational Cost (Auto) = Fuel + Maintenance</span>
          <span className="text-lg font-semibold text-brand-gold">₹{totalCost.toLocaleString()}</span>
        </div>
      </div>

      {showFuelModal && (
        <Modal title="Log Fuel" onClose={() => setShowFuelModal(false)}>
          <form onSubmit={handleFuelSubmit} className="space-y-3">
            <select required value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Select vehicle</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_no}</option>)}
            </select>
            <input required type="number" placeholder="Liters" value={fuelForm.liters}
              onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <input required type="number" placeholder="Cost" value={fuelForm.cost}
              onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <input required type="date" value={fuelForm.log_date}
              onChange={(e) => setFuelForm({ ...fuelForm, log_date: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <button type="submit" className="w-full bg-brand-gold text-white font-medium rounded-md py-2.5 text-sm hover:opacity-90">
              Save
            </button>
          </form>
        </Modal>
      )}

      {showExpenseModal && (
        <Modal title="Add Expense" onClose={() => setShowExpenseModal(false)}>
          <form onSubmit={handleExpenseSubmit} className="space-y-3">
            <select required value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Select vehicle</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_no}</option>)}
            </select>
            <input type="number" placeholder="Toll" value={expenseForm.toll}
              onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <input type="number" placeholder="Other" value={expenseForm.other}
              onChange={(e) => setExpenseForm({ ...expenseForm, other: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            <button type="submit" className="w-full bg-brand-gold text-white font-medium rounded-md py-2.5 text-sm hover:opacity-90">
              Save
            </button>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

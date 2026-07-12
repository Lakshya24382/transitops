import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import * as tripsApi from '../api/trips';
import * as vehiclesApi from '../api/vehicles';
import * as driversApi from '../api/drivers';
import { downloadCSV, downloadPDF } from '../utils/downloadCSV';

const emptyForm = {
  source: '', destination: '', vehicle_id: '', driver_id: '',
  cargo_weight_kg: '', planned_distance_km: '',
};

const STAGES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [draftTrip, setDraftTrip] = useState(null);
  const [error, setError] = useState('');
  const [capacityWarning, setCapacityWarning] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    const data = await tripsApi.getTrips();
    setTrips(data);
  };

  const loadPools = async () => {
    const [v, d] = await Promise.all([
      vehiclesApi.getAvailableVehicles(),
      driversApi.getAvailableDrivers(),
    ]);
    setAvailableVehicles(v);
    setAvailableDrivers(d);
  };

  useEffect(() => {
    Promise.all([loadTrips(), loadPools()]).finally(() => setLoading(false));
  }, []);

  // Live capacity check as user types/selects
  useEffect(() => {
    setCapacityWarning('');
    if (form.vehicle_id && form.cargo_weight_kg) {
      const vehicle = availableVehicles.find(v => v.id === form.vehicle_id);
      if (vehicle && parseFloat(form.cargo_weight_kg) > parseFloat(vehicle.max_capacity_kg)) {
        setCapacityWarning(
          `Vehicle Capacity: ${vehicle.max_capacity_kg} kg | Cargo Weight: ${form.cargo_weight_kg} kg\nCapacity exceeded by ${(form.cargo_weight_kg - vehicle.max_capacity_kg).toFixed(0)} kg — dispatch blocked`
        );
      }
    }
  }, [form.vehicle_id, form.cargo_weight_kg, availableVehicles]);

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const trip = await tripsApi.createTrip({
        ...form,
        vehicle_id: form.vehicle_id || null,
        driver_id: form.driver_id || null,
      });
      setDraftTrip(trip);
      setForm(emptyForm);
      await Promise.all([loadTrips(), loadPools()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create trip');
    }
  };

  const handleDispatch = async (tripId) => {
    setError('');
    try {
      await tripsApi.dispatchTrip(tripId);
      setDraftTrip(null);
      await Promise.all([loadTrips(), loadPools()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to dispatch trip');
    }
  };

  const handleCancel = async (tripId) => {
    setError('');
    try {
      await tripsApi.cancelTrip(tripId);
      setDraftTrip(null);
      await Promise.all([loadTrips(), loadPools()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel trip');
    }
  };

  const currentStageIndex = draftTrip ? STAGES.indexOf(draftTrip.status) : 0;

  return (
    <Layout title="Trip Dispatcher">
      <div className="flex justify-end mb-3">
        <button onClick={() => downloadPDF('/export/trips/pdf', 'trips.pdf')}
          className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-200 mr-2">
          Export PDF
        </button>
        <button onClick={() => downloadCSV('/export/trips', 'trips.csv')}
          className="bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-200">
          Export CSV
        </button>
      </div>

      {/* Lifecycle stepper */}
      <div className="flex items-center gap-2 mb-6">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              i <= currentStageIndex && draftTrip
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${i <= currentStageIndex && draftTrip ? 'bg-blue-500' : 'bg-gray-300'}`} />
              {stage}
            </div>
            {i < STAGES.length - 1 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Create Trip form */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Create Trip</h3>
          <form onSubmit={handleCreateDraft} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase">Source</label>
              <input required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Destination</label>
              <input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Vehicle (Available only)</label>
              <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1">
                <option value="">Select vehicle</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_no} - {v.max_capacity_kg} kg capacity</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Driver (Available only)</label>
              <select value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1">
                <option value="">Select driver</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Cargo Weight (kg)</label>
              <input required type="number" value={form.cargo_weight_kg}
                onChange={(e) => setForm({ ...form, cargo_weight_kg: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Planned Distance (km)</label>
              <input required type="number" value={form.planned_distance_km}
                onChange={(e) => setForm({ ...form, planned_distance_km: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" />
            </div>

            {capacityWarning && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-3 py-2 whitespace-pre-line">
                ✗ {capacityWarning}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{error}</div>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={!!capacityWarning}
                className="flex-1 bg-gray-200 text-gray-500 font-medium rounded-md py-2 text-sm disabled:opacity-50 enabled:bg-brand-gold enabled:text-white">
                Create Draft
              </button>
            </div>
          </form>

          {draftTrip && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Draft created: {draftTrip.trip_code}</p>
              <div className="flex gap-2">
                <button onClick={() => handleDispatch(draftTrip.id)}
                  disabled={!draftTrip.vehicle_id || !draftTrip.driver_id}
                  className="flex-1 bg-blue-600 text-white text-sm font-medium rounded-md py-2 disabled:opacity-40">
                  Dispatch
                </button>
                <button onClick={() => handleCancel(draftTrip.id)}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-md py-2">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Board */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Live Board</h3>
          <div className="space-y-2">
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : trips.length === 0 ? (
              <p className="text-gray-400 text-sm">No trips yet</p>
            ) : trips.map(trip => (
              <div key={trip.id} className="flex items-center justify-between border border-gray-100 rounded-md px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{trip.trip_code}</p>
                  <p className="text-xs text-gray-500">{trip.source} → {trip.destination}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={trip.status} />
                  <p className="text-xs text-gray-400 mt-1">
                    {trip.registration_no ? `${trip.registration_no} / ${trip.driver_name}` : 'Unassigned'}
                  </p>
                </div>
                {trip.status === 'Draft' && trip.vehicle_id && trip.driver_id && (
                  <button onClick={() => handleDispatch(trip.id)}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium hover:bg-blue-100">
                    Dispatch
                  </button>
                )}
                {trip.status === 'Dispatched' && (
                  <div className="flex gap-1">
                    <button onClick={async () => {
                        await tripsApi.completeTrip(trip.id, {});
                        await Promise.all([loadTrips(), loadPools()]);
                      }}
                      className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-md font-medium hover:bg-green-100">
                      Complete
                    </button>
                    <button onClick={() => handleCancel(trip.id)}
                      className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-md font-medium hover:bg-red-100">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        On Complete: odometer & fuel log → expenses → Vehicle & Driver Available
      </p>
    </Layout>
  );
}

import { pool } from '../db/pool.js';

export async function getDashboardKPIs(req, res) {
  try {
    const [
      activeVehicles, availableVehicles, inMaintenance,
      activeTrips, pendingTrips, driversOnDuty, totalVehicles
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM vehicles WHERE status != 'Retired'`),
      pool.query(`SELECT COUNT(*) FROM vehicles WHERE status = 'Available'`),
      pool.query(`SELECT COUNT(*) FROM vehicles WHERE status = 'In Shop'`),
      pool.query(`SELECT COUNT(*) FROM trips WHERE status = 'Dispatched'`),
      pool.query(`SELECT COUNT(*) FROM trips WHERE status = 'Draft'`),
      pool.query(`SELECT COUNT(*) FROM drivers WHERE status = 'On Trip'`),
      pool.query(`SELECT COUNT(*) FROM vehicles`),
    ]);

    const totalV = parseInt(totalVehicles.rows[0].count);
    const onTripV = parseInt(activeTrips.rows[0].count);
    // Fleet utilization = vehicles On Trip / total non-retired vehicles
    const activeV = parseInt(activeVehicles.rows[0].count);
    const utilization = activeV > 0 ? ((onTripV / activeV) * 100).toFixed(1) : 0;

    res.json({
      active_vehicles: activeV,
      available_vehicles: parseInt(availableVehicles.rows[0].count),
      vehicles_in_maintenance: parseInt(inMaintenance.rows[0].count),
      active_trips: onTripV,
      pending_trips: parseInt(pendingTrips.rows[0].count),
      drivers_on_duty: parseInt(driversOnDuty.rows[0].count),
      fleet_utilization_pct: parseFloat(utilization),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard KPIs' });
  }
}

export async function getVehicleStatusBreakdown(req, res) {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM vehicles
      GROUP BY status
    `);
    res.json({ breakdown: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicle status breakdown' });
  }
}

export async function getRecentTrips(req, res) {
  try {
    const result = await pool.query(`
      SELECT t.id, t.trip_code, t.status, t.eta, v.name_model as vehicle_name, d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);
    res.json({ trips: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent trips' });
  }
}
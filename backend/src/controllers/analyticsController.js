import { pool } from '../db/pool.js';

// Fuel Efficiency = total distance driven / total fuel consumed (fleet-wide or per vehicle)
export async function getFuelEfficiency(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(t.final_odometer), 0) as total_distance,
        COALESCE(SUM(t.fuel_consumed_l), 0) as total_fuel
      FROM trips t
      WHERE t.status = 'Completed' AND t.fuel_consumed_l > 0
    `);

    const { total_distance, total_fuel } = result.rows[0];
    const efficiency = total_fuel > 0 ? (total_distance / total_fuel).toFixed(1) : 0;

    res.json({ fuel_efficiency_km_per_l: parseFloat(efficiency) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute fuel efficiency' });
  }
}

export async function getFleetUtilization(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'On Trip') as on_trip,
        COUNT(*) FILTER (WHERE status != 'Retired') as active_total
      FROM vehicles
    `);
    const { on_trip, active_total } = result.rows[0];
    const utilization = active_total > 0 ? ((on_trip / active_total) * 100).toFixed(1) : 0;
    res.json({ fleet_utilization_pct: parseFloat(utilization) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute fleet utilization' });
  }
}

// Operational cost fleet-wide = SUM(fuel) + SUM(maintenance)
export async function getOperationalCostSummary(req, res) {
  try {
    const fuel = await pool.query('SELECT COALESCE(SUM(cost), 0) as total FROM fuel_logs');
    const maint = await pool.query('SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_logs');

    const totalFuel = parseFloat(fuel.rows[0].total);
    const totalMaint = parseFloat(maint.rows[0].total);

    res.json({
      total_fuel_cost: totalFuel,
      total_maintenance_cost: totalMaint,
      total_operational_cost: totalFuel + totalMaint,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute operational cost' });
  }
}

// Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
// ASSUMPTION: Revenue proxy = planned_distance_km * RATE_PER_KM for Completed trips.
// Adjust RATE_PER_KM or replace with a real revenue field as needed.
const RATE_PER_KM = 25;

export async function getVehicleROI(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        v.id, v.name_model, v.registration_no, v.acquisition_cost,
        COALESCE(SUM(t.planned_distance_km) FILTER (WHERE t.status = 'Completed'), 0) as total_distance,
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) as total_fuel,
        COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = v.id), 0) as total_maintenance
      FROM vehicles v
      LEFT JOIN trips t ON t.vehicle_id = v.id
      GROUP BY v.id
    `);

    const roiData = result.rows.map(row => {
      const revenue = parseFloat(row.total_distance) * RATE_PER_KM;
      const costs = parseFloat(row.total_fuel) + parseFloat(row.total_maintenance);
      const roi = row.acquisition_cost > 0
        ? (((revenue - costs) / parseFloat(row.acquisition_cost)) * 100).toFixed(1)
        : 0;

      return {
        vehicle_id: row.id,
        name_model: row.name_model,
        registration_no: row.registration_no,
        revenue,
        total_fuel: parseFloat(row.total_fuel),
        total_maintenance: parseFloat(row.total_maintenance),
        roi_pct: parseFloat(roi),
      };
    });

    res.json({ vehicles: roiData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute vehicle ROI' });
  }
}

// Top costliest vehicles (fuel + maintenance)
export async function getTopCostliestVehicles(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        v.id, v.name_model, v.registration_no,
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) +
        COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = v.id), 0) as total_cost
      FROM vehicles v
      ORDER BY total_cost DESC
      LIMIT 5
    `);
    res.json({ vehicles: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top costliest vehicles' });
  }
}

// Monthly revenue trend (based on completed trips, using same revenue proxy)
export async function getMonthlyRevenue(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', updated_at), 'Mon YYYY') as month,
        SUM(planned_distance_km) * $1 as revenue
      FROM trips
      WHERE status = 'Completed'
      GROUP BY DATE_TRUNC('month', updated_at)
      ORDER BY DATE_TRUNC('month', updated_at)
    `, [RATE_PER_KM]);
    res.json({ monthly: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly revenue' });
  }
}

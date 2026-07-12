import { pool } from '../db/pool.js';

export async function logFuel(req, res) {
  const { vehicle_id, liters, cost, log_date } = req.body;

  if (!vehicle_id || !liters || !cost || !log_date) {
    return res.status(400).json({ error: 'vehicle_id, liters, cost, log_date are required' });
  }

  try {
    const vResult = await pool.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const result = await pool.query(
      `INSERT INTO fuel_logs (vehicle_id, liters, cost, log_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [vehicle_id, liters, cost, log_date]
    );

    res.status(201).json({ fuelLog: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log fuel', details: err.message });
  }
}

export async function getFuelLogs(req, res) {
  const { vehicle_id } = req.query;
  let query = `
    SELECT f.*, v.name_model, v.registration_no
    FROM fuel_logs f
    JOIN vehicles v ON f.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];
  if (vehicle_id) {
    params.push(vehicle_id);
    query += ` AND f.vehicle_id = $${params.length}`;
  }
  query += ' ORDER BY f.log_date DESC';

  try {
    const result = await pool.query(query, params);
    res.json({ fuelLogs: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fuel logs' });
  }
}

export async function addExpense(req, res) {
  const { trip_id, vehicle_id, toll, other } = req.body;

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (trip_id, vehicle_id, toll, other)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [trip_id || null, vehicle_id, toll || 0, other || 0]
    );

    res.status(201).json({ expense: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add expense', details: err.message });
  }
}

export async function getExpenses(req, res) {
  const { vehicle_id, trip_id } = req.query;
  let query = `
    SELECT e.*, v.name_model, v.registration_no, t.trip_code
    FROM expenses e
    JOIN vehicles v ON e.vehicle_id = v.id
    LEFT JOIN trips t ON e.trip_id = t.id
    WHERE 1=1
  `;
  const params = [];
  if (vehicle_id) {
    params.push(vehicle_id);
    query += ` AND e.vehicle_id = $${params.length}`;
  }
  if (trip_id) {
    params.push(trip_id);
    query += ` AND e.trip_id = $${params.length}`;
  }
  query += ' ORDER BY e.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json({ expenses: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
}

// Total operational cost per vehicle = SUM(fuel.cost) + SUM(maintenance.cost)
export async function getOperationalCost(req, res) {
  const { vehicle_id } = req.params;

  try {
    const fuelResult = await pool.query(
      'SELECT COALESCE(SUM(cost), 0) as total_fuel FROM fuel_logs WHERE vehicle_id = $1',
      [vehicle_id]
    );
    const maintResult = await pool.query(
      'SELECT COALESCE(SUM(cost), 0) as total_maintenance FROM maintenance_logs WHERE vehicle_id = $1',
      [vehicle_id]
    );

    const totalFuel = parseFloat(fuelResult.rows[0].total_fuel);
    const totalMaintenance = parseFloat(maintResult.rows[0].total_maintenance);

    res.json({
      vehicle_id,
      total_fuel: totalFuel,
      total_maintenance: totalMaintenance,
      total_operational_cost: totalFuel + totalMaintenance,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute operational cost' });
  }
}

import { pool } from '../db/pool.js';

export async function createVehicle(req, res) {
  const { registration_no, name_model, type, max_capacity_kg, odometer, acquisition_cost, region } = req.body;

  if (!registration_no || !name_model || !type || !max_capacity_kg || !acquisition_cost) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await pool.query('SELECT id FROM vehicles WHERE registration_no = $1', [registration_no]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Registration number must be unique' });
    }

    const result = await pool.query(
      `INSERT INTO vehicles (registration_no, name_model, type, max_capacity_kg, odometer, acquisition_cost, region)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [registration_no, name_model, type, max_capacity_kg, odometer || 0, acquisition_cost, region || null]
    );

    res.status(201).json({ vehicle: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vehicle', details: err.message });
  }
}

export async function getVehicles(req, res) {
  const { type, status, region } = req.query;

  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];

  if (type) {
    params.push(type);
    query += ` AND type = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (region) {
    params.push(region);
    query += ` AND region = $${params.length}`;
  }

  query += ' ORDER BY created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json({ vehicles: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
}

// Only vehicles eligible for dispatch (excludes Retired / In Shop)
export async function getAvailableVehicles(req, res) {
  try {
    const result = await pool.query(
      `SELECT * FROM vehicles WHERE status = 'Available' ORDER BY name_model`
    );
    res.json({ vehicles: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available vehicles' });
  }
}

export async function getVehicleById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
}

export async function updateVehicle(req, res) {
  const { name_model, type, max_capacity_kg, odometer, acquisition_cost, status, region } = req.body;

  try {
    const result = await pool.query(
      `UPDATE vehicles SET
        name_model = COALESCE($1, name_model),
        type = COALESCE($2, type),
        max_capacity_kg = COALESCE($3, max_capacity_kg),
        odometer = COALESCE($4, odometer),
        acquisition_cost = COALESCE($5, acquisition_cost),
        status = COALESCE($6, status),
        region = COALESCE($7, region),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name_model, type, max_capacity_kg, odometer, acquisition_cost, status, region, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update vehicle', details: err.message });
  }
}

export async function deleteVehicle(req, res) {
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
}
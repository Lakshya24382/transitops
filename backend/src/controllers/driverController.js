import { pool } from '../db/pool.js';

export async function createDriver(req, res) {
  const { name, license_no, license_category, license_expiry, contact_no, safety_score } = req.body;

  if (!name || !license_no || !license_category || !license_expiry || !contact_no) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await pool.query('SELECT id FROM drivers WHERE license_no = $1', [license_no]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'License number must be unique' });
    }

    const result = await pool.query(
      `INSERT INTO drivers (name, license_no, license_category, license_expiry, contact_no, safety_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, license_no, license_category, license_expiry, contact_no, safety_score || 100]
    );

    res.status(201).json({ driver: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create driver', details: err.message });
  }
}

export async function getDrivers(req, res) {
  const { status } = req.query;
  let query = 'SELECT * FROM drivers WHERE 1=1';
  const params = [];

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  query += ' ORDER BY created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json({ drivers: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
}

// Only drivers eligible for dispatch: Available + license not expired + not Suspended
export async function getAvailableDrivers(req, res) {
  try {
    const result = await pool.query(
      `SELECT * FROM drivers
       WHERE status = 'Available' AND license_expiry >= CURRENT_DATE
       ORDER BY name`
    );
    res.json({ drivers: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
}

export async function getDriverById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ driver: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
}

export async function updateDriver(req, res) {
  const { name, license_category, license_expiry, contact_no, safety_score, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE drivers SET
        name = COALESCE($1, name),
        license_category = COALESCE($2, license_category),
        license_expiry = COALESCE($3, license_expiry),
        contact_no = COALESCE($4, contact_no),
        safety_score = COALESCE($5, safety_score),
        status = COALESCE($6, status),
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, license_category, license_expiry, contact_no, safety_score, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update driver', details: err.message });
  }
}

export async function deleteDriver(req, res) {
  try {
    const result = await pool.query('DELETE FROM drivers WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete driver' });
  }
}

import { pool } from '../db/pool.js';

export async function createMaintenance(req, res) {
  const { vehicle_id, service_type, cost, service_date } = req.body;

  if (!vehicle_id || !service_type || !cost || !service_date) {
    return res.status(400).json({ error: 'vehicle_id, service_type, cost, service_date are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vResult = await client.query('SELECT * FROM vehicles WHERE id = $1 FOR UPDATE', [vehicle_id]);
    if (vResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const vehicle = vResult.rows[0];

    if (vehicle.status === 'On Trip') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot log maintenance while vehicle is On Trip' });
    }

    const logResult = await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, service_type, cost, service_date, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [vehicle_id, service_type, cost, service_date]
    );

    // Auto status transition: vehicle -> In Shop (unless already Retired)
    if (vehicle.status !== 'Retired') {
      await client.query(`UPDATE vehicles SET status = 'In Shop', updated_at = NOW() WHERE id = $1`, [vehicle_id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ maintenance: logResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create maintenance record', details: err.message });
  } finally {
    client.release();
  }
}

// Close a maintenance record -> vehicle back to Available (unless Retired)
export async function closeMaintenance(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const logResult = await client.query('SELECT * FROM maintenance_logs WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (logResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Maintenance record not found' });
    }
    const log = logResult.rows[0];

    if (log.status === 'Completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Maintenance record already Completed' });
    }

    await client.query(`UPDATE maintenance_logs SET status = 'Completed' WHERE id = $1`, [log.id]);

    const vResult = await client.query('SELECT * FROM vehicles WHERE id = $1 FOR UPDATE', [log.vehicle_id]);
    const vehicle = vResult.rows[0];

    // Only restore to Available if no other active maintenance logs remain, and not Retired
    const otherActive = await client.query(
      `SELECT id FROM maintenance_logs WHERE vehicle_id = $1 AND status = 'active' AND id != $2`,
      [log.vehicle_id, log.id]
    );

    if (vehicle.status !== 'Retired' && otherActive.rows.length === 0) {
      await client.query(`UPDATE vehicles SET status = 'Available', updated_at = NOW() WHERE id = $1`, [log.vehicle_id]);
    }

    await client.query('COMMIT');

    const updated = await pool.query('SELECT * FROM maintenance_logs WHERE id = $1', [log.id]);
    res.json({ maintenance: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to close maintenance record', details: err.message });
  } finally {
    client.release();
  }
}

export async function getMaintenanceLogs(req, res) {
  const { vehicle_id, status } = req.query;
  let query = `
    SELECT m.*, v.name_model, v.registration_no
    FROM maintenance_logs m
    JOIN vehicles v ON m.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];
  if (vehicle_id) {
    params.push(vehicle_id);
    query += ` AND m.vehicle_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND m.status = $${params.length}`;
  }
  query += ' ORDER BY m.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json({ maintenance: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
}

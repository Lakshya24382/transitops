import { pool } from '../db/pool.js';

function generateTripCode() {
  const rand = Math.floor(100 + Math.random() * 900);
  return `TR${rand}`;
}

// CREATE (Draft) trip
export async function createTrip(req, res) {
  const { source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km } = req.body;

  if (!source || !destination || !cargo_weight_kg || !planned_distance_km) {
    return res.status(400).json({ error: 'source, destination, cargo_weight_kg, planned_distance_km are required' });
  }

  try {
    // If vehicle provided, validate capacity + availability
    if (vehicle_id) {
      const vResult = await pool.query('SELECT * FROM vehicles WHERE id = $1', [vehicle_id]);
      if (vResult.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      const vehicle = vResult.rows[0];

      if (vehicle.status !== 'Available') {
        return res.status(400).json({ error: `Vehicle is ${vehicle.status}, must be Available to assign` });
      }
      if (parseFloat(cargo_weight_kg) > parseFloat(vehicle.max_capacity_kg)) {
        return res.status(400).json({
          error: `Cargo weight exceeded: capacity ${vehicle.max_capacity_kg}kg, cargo ${cargo_weight_kg}kg`
        });
      }
    }

    // If driver provided, validate status + license
    if (driver_id) {
      const dResult = await pool.query('SELECT * FROM drivers WHERE id = $1', [driver_id]);
      if (dResult.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      const driver = dResult.rows[0];

      if (driver.status === 'Suspended') {
        return res.status(400).json({ error: 'Driver is Suspended, cannot assign to trip' });
      }
      if (driver.status !== 'Available') {
        return res.status(400).json({ error: `Driver is ${driver.status}, must be Available to assign` });
      }
      if (new Date(driver.license_expiry) < new Date()) {
        return res.status(400).json({ error: 'Driver license has expired, cannot assign to trip' });
      }
    }

    const trip_code = generateTripCode();

    const result = await pool.query(
      `INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Draft', $8)
       RETURNING *`,
      [trip_code, source, destination, vehicle_id || null, driver_id || null, cargo_weight_kg, planned_distance_km, req.user.id]
    );

    res.status(201).json({ trip: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create trip', details: err.message });
  }
}

// DISPATCH: Draft -> Dispatched, vehicle & driver -> On Trip
export async function dispatchTrip(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tripResult = await client.query('SELECT * FROM trips WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found' });
    }
    const trip = tripResult.rows[0];

    if (trip.status !== 'Draft') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Trip must be Draft to dispatch (currently ${trip.status})` });
    }
    if (!trip.vehicle_id || !trip.driver_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Trip must have both vehicle and driver assigned before dispatch' });
    }

    // Re-validate vehicle & driver are still available (race condition safety)
    const vResult = await client.query('SELECT * FROM vehicles WHERE id = $1 FOR UPDATE', [trip.vehicle_id]);
    const dResult = await client.query('SELECT * FROM drivers WHERE id = $1 FOR UPDATE', [trip.driver_id]);
    const vehicle = vResult.rows[0];
    const driver = dResult.rows[0];

    if (vehicle.status !== 'Available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Vehicle no longer Available' });
    }
    if (driver.status !== 'Available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Driver no longer Available' });
    }

    await client.query(`UPDATE trips SET status = 'Dispatched', updated_at = NOW() WHERE id = $1`, [trip.id]);
    await client.query(`UPDATE vehicles SET status = 'On Trip', updated_at = NOW() WHERE id = $1`, [trip.vehicle_id]);
    await client.query(`UPDATE drivers SET status = 'On Trip', updated_at = NOW() WHERE id = $1`, [trip.driver_id]);

    await client.query('COMMIT');

    const updated = await pool.query('SELECT * FROM trips WHERE id = $1', [trip.id]);
    res.json({ trip: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to dispatch trip', details: err.message });
  } finally {
    client.release();
  }
}

// COMPLETE: Dispatched -> Completed, vehicle & driver -> Available
export async function completeTrip(req, res) {
  const { final_odometer, fuel_consumed_l } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tripResult = await client.query('SELECT * FROM trips WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found' });
    }
    const trip = tripResult.rows[0];

    if (trip.status !== 'Dispatched') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Trip must be Dispatched to complete (currently ${trip.status})` });
    }

    await client.query(
      `UPDATE trips SET status = 'Completed', final_odometer = $1, fuel_consumed_l = $2, updated_at = NOW() WHERE id = $3`,
      [final_odometer || null, fuel_consumed_l || null, trip.id]
    );

    if (trip.vehicle_id) {
      await client.query(`UPDATE vehicles SET status = 'Available', updated_at = NOW() WHERE id = $1`, [trip.vehicle_id]);
      if (final_odometer) {
        await client.query(`UPDATE vehicles SET odometer = $1 WHERE id = $2`, [final_odometer, trip.vehicle_id]);
      }
    }
    if (trip.driver_id) {
      await client.query(`UPDATE drivers SET status = 'Available', updated_at = NOW() WHERE id = $1`, [trip.driver_id]);
    }

    await client.query('COMMIT');

    const updated = await pool.query('SELECT * FROM trips WHERE id = $1', [trip.id]);
    res.json({ trip: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to complete trip', details: err.message });
  } finally {
    client.release();
  }
}

// CANCEL: Dispatched -> Cancelled, vehicle & driver -> Available (also allow cancel from Draft)
export async function cancelTrip(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tripResult = await client.query('SELECT * FROM trips WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found' });
    }
    const trip = tripResult.rows[0];

    if (!['Draft', 'Dispatched'].includes(trip.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Cannot cancel a trip that is ${trip.status}` });
    }

    const wasDispatched = trip.status === 'Dispatched';

    await client.query(`UPDATE trips SET status = 'Cancelled', updated_at = NOW() WHERE id = $1`, [trip.id]);

    if (wasDispatched) {
      if (trip.vehicle_id) {
        await client.query(`UPDATE vehicles SET status = 'Available', updated_at = NOW() WHERE id = $1`, [trip.vehicle_id]);
      }
      if (trip.driver_id) {
        await client.query(`UPDATE drivers SET status = 'Available', updated_at = NOW() WHERE id = $1`, [trip.driver_id]);
      }
    }

    await client.query('COMMIT');

    const updated = await pool.query('SELECT * FROM trips WHERE id = $1', [trip.id]);
    res.json({ trip: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel trip', details: err.message });
  } finally {
    client.release();
  }
}

export async function getTrips(req, res) {
  const { status } = req.query;
  let query = `
    SELECT t.*, v.name_model as vehicle_name, v.registration_no, d.name as driver_name
    FROM trips t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN drivers d ON t.driver_id = d.id
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    params.push(status);
    query += ` AND t.status = $${params.length}`;
  }
  query += ' ORDER BY t.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json({ trips: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
}

export async function getTripById(req, res) {
  try {
    const result = await pool.query(
      `SELECT t.*, v.name_model as vehicle_name, v.registration_no, d.name as driver_name
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({ trip: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
}

// Assign/update vehicle & driver while trip is still Draft
export async function updateTrip(req, res) {
  const { source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km } = req.body;

  try {
    const tripResult = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const trip = tripResult.rows[0];

    if (trip.status !== 'Draft') {
      return res.status(400).json({ error: 'Can only edit trips in Draft status' });
    }

    const finalCargo = cargo_weight_kg ?? trip.cargo_weight_kg;

    if (vehicle_id) {
      const vResult = await pool.query('SELECT * FROM vehicles WHERE id = $1', [vehicle_id]);
      if (vResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
      const vehicle = vResult.rows[0];
      if (vehicle.status !== 'Available') {
        return res.status(400).json({ error: `Vehicle is ${vehicle.status}, must be Available` });
      }
      if (parseFloat(finalCargo) > parseFloat(vehicle.max_capacity_kg)) {
        return res.status(400).json({
          error: `Cargo weight exceeded: capacity ${vehicle.max_capacity_kg}kg, cargo ${finalCargo}kg`
        });
      }
    }

    if (driver_id) {
      const dResult = await pool.query('SELECT * FROM drivers WHERE id = $1', [driver_id]);
      if (dResult.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
      const driver = dResult.rows[0];
      if (driver.status === 'Suspended') {
        return res.status(400).json({ error: 'Driver is Suspended' });
      }
      if (driver.status !== 'Available') {
        return res.status(400).json({ error: `Driver is ${driver.status}, must be Available` });
      }
      if (new Date(driver.license_expiry) < new Date()) {
        return res.status(400).json({ error: 'Driver license expired' });
      }
    }

    const result = await pool.query(
      `UPDATE trips SET
        source = COALESCE($1, source),
        destination = COALESCE($2, destination),
        vehicle_id = COALESCE($3, vehicle_id),
        driver_id = COALESCE($4, driver_id),
        cargo_weight_kg = COALESCE($5, cargo_weight_kg),
        planned_distance_km = COALESCE($6, planned_distance_km),
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, req.params.id]
    );

    res.json({ trip: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update trip', details: err.message });
  }
}
import { pool } from '../db/pool.js';
import { convertToCSV, sendCSV } from '../utils/csv.js';

export async function exportVehicles(req, res) {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
    const fields = [
      'registration_no', 'name_model', 'type', 'max_capacity_kg',
      'odometer', 'acquisition_cost', 'status', 'region', 'created_at'
    ];
    const csv = convertToCSV(result.rows, fields);
    sendCSV(res, `vehicles_${Date.now()}.csv`, csv);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to export vehicles' });
  }
}

export async function exportDrivers(req, res) {
  try {
    const result = await pool.query('SELECT * FROM drivers ORDER BY created_at DESC');
    const fields = [
      'name', 'license_no', 'license_category', 'license_expiry',
      'contact_no', 'safety_score', 'status', 'created_at'
    ];
    const csv = convertToCSV(result.rows, fields);
    sendCSV(res, `drivers_${Date.now()}.csv`, csv);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to export drivers' });
  }
}

export async function exportTrips(req, res) {
  try {
    const result = await pool.query(`
      SELECT t.trip_code, t.source, t.destination, v.registration_no as vehicle,
             d.name as driver, t.cargo_weight_kg, t.planned_distance_km,
             t.final_odometer, t.fuel_consumed_l, t.status, t.created_at
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC
    `);
    const fields = [
      'trip_code', 'source', 'destination', 'vehicle', 'driver',
      'cargo_weight_kg', 'planned_distance_km', 'final_odometer',
      'fuel_consumed_l', 'status', 'created_at'
    ];
    const csv = convertToCSV(result.rows, fields);
    sendCSV(res, `trips_${Date.now()}.csv`, csv);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to export trips' });
  }
}

// Combined fuel + maintenance + expenses per vehicle — matches "operational cost" report
export async function exportOperationalReport(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        v.registration_no, v.name_model,
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) as total_fuel_cost,
        COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = v.id), 0) as total_maintenance_cost,
        COALESCE((SELECT SUM(total) FROM expenses WHERE vehicle_id = v.id), 0) as total_other_expenses
      FROM vehicles v
      ORDER BY v.registration_no
    `);

    const rows = result.rows.map(r => ({
      ...r,
      total_operational_cost:
        parseFloat(r.total_fuel_cost) + parseFloat(r.total_maintenance_cost) + parseFloat(r.total_other_expenses)
    }));

    const fields = [
      'registration_no', 'name_model', 'total_fuel_cost',
      'total_maintenance_cost', 'total_other_expenses', 'total_operational_cost'
    ];
    const csv = convertToCSV(rows, fields);
    sendCSV(res, `operational_report_${Date.now()}.csv`, csv);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to export operational report' });
  }
}

import { createPDF, drawHeader, drawTable } from '../utils/pdf.js';

export async function exportVehiclesPDF(req, res) {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
    const doc = createPDF(res, `vehicles_${Date.now()}.pdf`);
    const y = drawHeader(doc, 'Vehicle Registry Report');

    const headers = ['Reg. No', 'Model', 'Type', 'Capacity (kg)', 'Odometer', 'Status'];
    const colWidths = [90, 110, 60, 80, 80, 95];
    const rows = result.rows.map(v => [
      v.registration_no, v.name_model, v.type, v.max_capacity_kg, v.odometer, v.status
    ]);

    drawTable(doc, y, headers, rows, colWidths);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to export vehicles PDF' });
  }
}

export async function exportDriversPDF(req, res) {
  try {
    const result = await pool.query('SELECT * FROM drivers ORDER BY created_at DESC');
    const doc = createPDF(res, `drivers_${Date.now()}.pdf`);
    const y = drawHeader(doc, 'Drivers & Safety Profiles Report');

    const headers = ['Name', 'License No', 'Category', 'Expiry', 'Safety Score', 'Status'];
    const colWidths = [100, 90, 60, 80, 80, 105];
    const rows = result.rows.map(d => [
      d.name, d.license_no, d.license_category,
      new Date(d.license_expiry).toLocaleDateString(), `${d.safety_score}%`, d.status
    ]);

    drawTable(doc, y, headers, rows, colWidths);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to export drivers PDF' });
  }
}

export async function exportTripsPDF(req, res) {
  try {
    const result = await pool.query(`
      SELECT t.trip_code, t.source, t.destination, v.registration_no as vehicle,
             d.name as driver, t.status
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC
    `);
    const doc = createPDF(res, `trips_${Date.now()}.pdf`);
    const y = drawHeader(doc, 'Trips Report');

    const headers = ['Trip', 'Source', 'Destination', 'Vehicle', 'Driver', 'Status'];
    const colWidths = [60, 100, 100, 75, 75, 105];
    const rows = result.rows.map(t => [
      t.trip_code, t.source, t.destination, t.vehicle || '--', t.driver || '--', t.status
    ]);

    drawTable(doc, y, headers, rows, colWidths);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to export trips PDF' });
  }
}

export async function exportOperationalReportPDF(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        v.registration_no, v.name_model,
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) as total_fuel_cost,
        COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = v.id), 0) as total_maintenance_cost,
        COALESCE((SELECT SUM(total) FROM expenses WHERE vehicle_id = v.id), 0) as total_other_expenses
      FROM vehicles v
      ORDER BY v.registration_no
    `);

    const doc = createPDF(res, `operational_report_${Date.now()}.pdf`);
    const y = drawHeader(doc, 'Operational Cost Report');

    const headers = ['Reg. No', 'Model', 'Fuel Cost', 'Maintenance', 'Other Exp.', 'Total'];
    const colWidths = [80, 100, 75, 85, 80, 95];
    const rows = result.rows.map(r => {
      const total = parseFloat(r.total_fuel_cost) + parseFloat(r.total_maintenance_cost) + parseFloat(r.total_other_expenses);
      return [
        r.registration_no, r.name_model,
        `₹${Number(r.total_fuel_cost).toLocaleString()}`,
        `₹${Number(r.total_maintenance_cost).toLocaleString()}`,
        `₹${Number(r.total_other_expenses).toLocaleString()}`,
        `₹${total.toLocaleString()}`
      ];
    });

    drawTable(doc, y, headers, rows, colWidths);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to export operational report PDF' });
  }
}

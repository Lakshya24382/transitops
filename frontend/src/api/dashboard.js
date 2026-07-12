import client from './client';

export const getKPIs = () =>
  client.get('/dashboard/kpis').then(r => r.data);

export const getVehicleStatusBreakdown = () =>
  client.get('/dashboard/vehicle-status').then(r => r.data.breakdown);

export const getRecentTrips = () =>
  client.get('/dashboard/recent-trips').then(r => r.data.trips);

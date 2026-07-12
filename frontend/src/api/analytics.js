import client from './client';

export const getFuelEfficiency = () =>
  client.get('/analytics/fuel-efficiency').then(r => r.data);

export const getFleetUtilization = () =>
  client.get('/analytics/fleet-utilization').then(r => r.data);

export const getOperationalCostSummary = () =>
  client.get('/analytics/operational-cost').then(r => r.data);

export const getVehicleROI = () =>
  client.get('/analytics/vehicle-roi').then(r => r.data.vehicles);

export const getTopCostliest = () =>
  client.get('/analytics/top-costliest').then(r => r.data.vehicles);

export const getMonthlyRevenue = () =>
  client.get('/analytics/monthly-revenue').then(r => r.data.monthly);

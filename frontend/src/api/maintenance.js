import client from './client';

export const getMaintenanceLogs = (params = {}) =>
  client.get('/maintenance', { params }).then(r => r.data.maintenance);

export const createMaintenance = (data) =>
  client.post('/maintenance', data).then(r => r.data.maintenance);

export const closeMaintenance = (id) =>
  client.patch(`/maintenance/${id}/close`).then(r => r.data.maintenance);

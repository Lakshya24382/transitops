import client from './client';

export const getVehicles = (params = {}) =>
  client.get('/vehicles', { params }).then(r => r.data.vehicles);

export const getAvailableVehicles = () =>
  client.get('/vehicles/available').then(r => r.data.vehicles);

export const createVehicle = (data) =>
  client.post('/vehicles', data).then(r => r.data.vehicle);

export const updateVehicle = (id, data) =>
  client.put(`/vehicles/${id}`, data).then(r => r.data.vehicle);

export const deleteVehicle = (id) =>
  client.delete(`/vehicles/${id}`).then(r => r.data);

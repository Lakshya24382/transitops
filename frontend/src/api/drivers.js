import client from './client';

export const getDrivers = (params = {}) =>
  client.get('/drivers', { params }).then(r => r.data.drivers);

export const getAvailableDrivers = () =>
  client.get('/drivers/available').then(r => r.data.drivers);

export const createDriver = (data) =>
  client.post('/drivers', data).then(r => r.data.driver);

export const updateDriver = (id, data) =>
  client.put(`/drivers/${id}`, data).then(r => r.data.driver);

export const deleteDriver = (id) =>
  client.delete(`/drivers/${id}`).then(r => r.data);

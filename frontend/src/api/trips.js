import client from './client';

export const getTrips = (params = {}) =>
  client.get('/trips', { params }).then(r => r.data.trips);

export const createTrip = (data) =>
  client.post('/trips', data).then(r => r.data.trip);

export const updateTrip = (id, data) =>
  client.put(`/trips/${id}`, data).then(r => r.data.trip);

export const dispatchTrip = (id) =>
  client.patch(`/trips/${id}/dispatch`).then(r => r.data.trip);

export const completeTrip = (id, data) =>
  client.patch(`/trips/${id}/complete`, data).then(r => r.data.trip);

export const cancelTrip = (id) =>
  client.patch(`/trips/${id}/cancel`).then(r => r.data.trip);

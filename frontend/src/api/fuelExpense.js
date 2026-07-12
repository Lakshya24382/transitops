import client from './client';

export const getFuelLogs = (params = {}) =>
  client.get('/fuel', { params }).then(r => r.data.fuelLogs);

export const logFuel = (data) =>
  client.post('/fuel', data).then(r => r.data.fuelLog);

export const getExpenses = (params = {}) =>
  client.get('/expenses', { params }).then(r => r.data.expenses);

export const addExpense = (data) =>
  client.post('/expenses', data).then(r => r.data.expense);

export const getOperationalCost = (vehicleId) =>
  client.get(`/operational-cost/${vehicleId}`).then(r => r.data);

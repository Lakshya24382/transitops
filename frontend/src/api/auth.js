import client from './client';

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then(r => r.data);

export const signup = (data) =>
  client.post('/auth/signup', data).then(r => r.data);

export const getMe = () =>
  client.get('/auth/me').then(r => r.data);

export const changePassword = (currentPassword, newPassword) =>
  client.post('/auth/change-password', { currentPassword, newPassword }).then(r => r.data);

export const updateProfile = (name) =>
  client.put('/auth/profile', { name }).then(r => r.data);

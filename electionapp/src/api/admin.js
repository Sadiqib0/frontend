import { api } from './client';

const adminHeaders = (token) => ({ 'X-Admin-Token': token });

export const registerAdmin = (data) => api.post('/admin/register', data);
export const loginAdmin = (data) => api.post('/admin/login', data);
export const logoutAdmin = (token) => api.patch('/admin/logout', null, adminHeaders(token));

export const createElection = (name, positions, token) =>
  api.post('/election', { name, positions }, adminHeaders(token));

export const startElection = (token) =>
  api.post('/election/start', null, adminHeaders(token));

export const endElection = (token) =>
  api.post('/election/end', null, adminHeaders(token));

export const nominateCandidate = (data, token) =>
  api.post('/admin/candidate', data, adminHeaders(token));

export const getAuditLog = (page = 0, size = 20, token) =>
  api.get(`/audit?page=${page}&size=${size}`, adminHeaders(token));

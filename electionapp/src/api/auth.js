import { api } from './client';

export const registerVoter = (data) => api.post('/voter', data);

export const loginVoter = (data) => api.post('/voter/login', data);

export const logoutVoter = (email) => api.patch(`/voter/logout/${encodeURIComponent(email)}`);

export const getVoter = (id) => api.get(`/voter/${id}`);

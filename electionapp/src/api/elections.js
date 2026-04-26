import { api } from './client';

export const getElectionStatus = () => api.get('/election/status');
export const getElectionPositions = () => api.get('/election/positions');
export const getElectionStats = () => api.get('/election/stats');

export const getCandidates = (position) => api.get(`/candidates/${position}`);
export const registerCandidate = (data) => api.post('/candidate', data);

export const castVote = (data) => api.post('/vote', data);
export const verifyVote = (receipt) => api.get(`/vote/verify/${receipt}`);

export const getResults = (position) => api.get(`/results/${position}`);

export const positionLabel = (pos) =>
  pos.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

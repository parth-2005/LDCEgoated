import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = {
  runAnalysis: () => axios.post(`${BASE}/api/run-analysis`, { run_id: 'demo-001' }),
  getFlags: () => axios.get(`${BASE}/api/flags`),
  getFlag: (id) => axios.get(`${BASE}/api/flag/${id}`),
  updateFlagStatus: (id, status) => axios.patch(`${BASE}/api/flag/${id}/status`, { status }),
  getStats: () => axios.get(`${BASE}/api/stats`),
  getReport: () => axios.get(`${BASE}/api/report`),
  generateEvidence: (id) => axios.post(`${BASE}/api/flag/${id}/evidence`),
}

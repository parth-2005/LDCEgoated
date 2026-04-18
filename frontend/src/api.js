import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = {
  // --- Existing (Person 2 backend) ---
  runAnalysis: () => axios.post(`${BASE}/api/run-analysis`, { run_id: 'demo-001' }),
  getFlags: () => axios.get(`${BASE}/api/flags`),
  getFlag: (id) => axios.get(`${BASE}/api/flag/${id}`),
  updateFlagStatus: (id, status) => axios.patch(`${BASE}/api/flag/${id}/status`, { status }),
  getStats: () => axios.get(`${BASE}/api/stats`),
  getReport: () => axios.get(`${BASE}/api/report`),

  // --- New stubs (will be live once MongoDB APIs exist) ---
  getInstitutions: () => axios.get(`${BASE}/api/institutions`),
  getInvestigations: () => axios.get(`${BASE}/api/investigations`),
  assignCase: (caseId, verifierId) =>
    axios.patch(`${BASE}/api/investigations/${caseId}/assign`, { verifier_id: verifierId }),
  getSchemes: () => axios.get(`${BASE}/api/schemes`),
  updateScheme: (schemeId, rules) =>
    axios.patch(`${BASE}/api/schemes/${schemeId}`, rules),
  getDistrictStats: () => axios.get(`${BASE}/api/stats/districts`),
}

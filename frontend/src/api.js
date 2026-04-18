import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = {
  // ── Core analysis (DFO / Audit Officer) ─────────────────────────────
  runAnalysis:      ()           => axios.post(`${BASE}/api/run-analysis`, { run_id: 'demo-001' }),
  getFlags:         ()           => axios.get(`${BASE}/api/flags`),
  getFlag:          (id)         => axios.get(`${BASE}/api/flag/${id}`),
  updateFlagStatus: (id, status) => axios.patch(`${BASE}/api/flag/${id}/status`, { status }),
  getStats:         ()           => axios.get(`${BASE}/api/stats`),
  getReport:        ()           => axios.get(`${BASE}/api/report`),

  // ── Institutions / Investigations (DFO) ──────────────────────────────
  getInstitutions:  ()                  => axios.get(`${BASE}/api/institutions`),
  getInvestigations:()                  => axios.get(`${BASE}/api/investigations`),
  assignCase:       (caseId, verifierId)=> axios.patch(`${BASE}/api/investigations/${caseId}/assign`, { verifier_id: verifierId }),

  // ── Schemes / Rules (State Admin) ────────────────────────────────────
  getSchemes:       ()               => axios.get(`${BASE}/api/schemes`),
  updateScheme:     (schemeId, rules)=> axios.patch(`${BASE}/api/schemes/${schemeId}`, rules),

  // ── District stats (State Admin heatmap) ─────────────────────────────
  getDistrictStats: () => axios.get(`${BASE}/api/stats/districts`),
}

/**
 * src/api.js — EduGuard DBT API Client
 *
 * Every function tries the real API first.
 * On network error or non-2xx response it returns the mock fallback
 * so the UI always has data to display.
 */
import axios from 'axios'
import { mockInvestigations, mockInstitutions, mockVerifiers } from './mock/dfoMock'
import { mockDistrictStats, mockSchemes }                       from './mock/adminMock'
import { mockData as mockUserData }                             from './mock/mockData'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const http = axios.create({ baseURL: BASE, timeout: 10000 })

// ── Generic safe-fetch wrapper ─────────────────────────────────────────────
async function safe(apiFn, fallback) {
  try {
    const res = await apiFn()
    return res.data
  } catch (err) {
    console.warn('[api] fallback used →', err?.message || err)
    return typeof fallback === 'function' ? fallback() : fallback
  }
}

// =============================================================================
// ANALYSIS
// =============================================================================
export const runAnalysis = (runId = 'demo-001') =>
  http.post('/api/run-analysis', { run_id: runId })

// =============================================================================
// FLAGS (DFO / Audit)
// =============================================================================
export const getFlags = () =>
  safe(() => http.get('/api/flags'), [])

export const getFlag = (flagId) =>
  safe(() => http.get(`/api/flag/${flagId}`), null)

export const updateFlagStatus = (flagId, status) =>
  safe(() => http.patch(`/api/flag/${flagId}/status`, { status }), { flag_id: flagId, status })

// =============================================================================
// STATS
// =============================================================================
export const getStats = () =>
  safe(() => http.get('/api/stats'), {
    by_leakage_type: { DECEASED: 12, DUPLICATE: 8, UNDRAWN: 18, CROSS_SCHEME: 5 },
    by_district: {},
    by_scheme: {},
    total_amount_at_risk: 1450000,
  })

// =============================================================================
// DISTRICT STATS (State Admin Heatmap)
// =============================================================================
export const getDistrictStats = () =>
  safe(() => http.get('/api/district-stats'), mockDistrictStats)

// =============================================================================
// INVESTIGATIONS (DFO)
// =============================================================================
export const getInvestigations = (params = {}) =>
  safe(() => http.get('/api/investigations', { params }), mockInvestigations)

export const getInvestigation = (caseId) =>
  safe(
    () => http.get(`/api/investigations/${caseId}`),
    () => mockInvestigations.find(i => i.case_id === caseId) || null,
  )

export const assignInvestigation = (caseId, verifierId) =>
  safe(
    () => http.patch(`/api/investigations/${caseId}/assign`, { verifier_id: verifierId }),
    { case_id: caseId, status: 'ASSIGNED_TO_VERIFIER', verifier_id: verifierId },
  )

// =============================================================================
// EVIDENCE (Scheme Verifier)
// =============================================================================
export const submitEvidence = (caseId, payload) =>
  safe(
    () => http.post(`/api/evidence/${caseId}`, payload),
    { success: true, case_id: caseId },
  )

// =============================================================================
// AUDIT OFFICER
// =============================================================================
export const getAuditPending = () =>
  safe(
    () => http.get('/api/audit/pending'),
    () => mockInvestigations.filter(i => i.status === 'VERIFICATION_SUBMITTED'),
  )

export const auditDecide = (caseId, decision, notes = '') =>
  safe(
    () => http.post(`/api/audit/${caseId}/decide`, { decision, notes }),
    { case_id: caseId, decision },
  )

// =============================================================================
// INSTITUTIONS / MIDDLEMEN (DFO)
// =============================================================================
export const getInstitutions = (params = {}) =>
  safe(() => http.get('/api/institutions', { params }), mockInstitutions)

// =============================================================================
// VERIFIERS (DFO)
// =============================================================================
export const getVerifiers = (district) =>
  safe(() => http.get('/api/verifiers', { params: district ? { district } : {} }), mockVerifiers)

// =============================================================================
// SCHEMES (State Admin)
// =============================================================================
export const getSchemes = () =>
  safe(() => http.get('/api/schemes'), mockSchemes)

export const updateScheme = (schemeId, payload) =>
  safe(
    () => http.patch(`/api/schemes/${schemeId}`, payload),
    () => mockSchemes.find(s => s.scheme_id === schemeId) || {},
  )

// =============================================================================
// USER / BENEFICIARY
// =============================================================================
export const getUser = (userId = 'USR-GJ-001') =>
  safe(() => http.get(`/api/user/${userId}`), mockUserData?.user || _fallbackUser())

export const renewKYC = (userId, validityDays = 90) =>
  safe(
    () => http.post(`/api/user/${userId}/kyc`, { validity_days: validityDays }),
    { success: true, days_remaining: validityDays },
  )

// =============================================================================
// STUDENTS
// =============================================================================
export const getStudents = (params = {}) =>
  safe(() => http.get('/api/students', { params }), [])

export const getStudent = (beneficiaryId) =>
  safe(() => http.get(`/api/student/${beneficiaryId}`), null)

// =============================================================================
// REPORT
// =============================================================================
export const getReport = () =>
  http.get('/api/report', { responseType: 'text' })

// =============================================================================
// HEALTH
// =============================================================================
export const checkHealth = () =>
  safe(() => http.get('/api/health'), { status: 'offline', mongodb: false })

// =============================================================================
// LEGACY compat (old api object used by Dashboard/AuditReport/etc.)
// =============================================================================
export const api = {
  runAnalysis:      () => http.post('/api/run-analysis', { run_id: 'demo-001' }),
  getFlags:         () => http.get('/api/flags'),
  getFlag:          (id) => http.get(`/api/flag/${id}`),
  updateFlagStatus: (id, status) => http.patch(`/api/flag/${id}/status`, { status }),
  getStats:         () => http.get('/api/stats'),
  getReport:        () => http.get('/api/report', { responseType: 'text' }),
  getInstitutions:  () => http.get('/api/institutions'),
  getInvestigations: () => http.get('/api/investigations'),
  assignCase:       (caseId, verifierId) => http.patch(`/api/investigations/${caseId}/assign`, { verifier_id: verifierId }),
  getSchemes:       () => http.get('/api/schemes'),
  updateScheme:     (schemeId, rules) => http.patch(`/api/schemes/${schemeId}`, rules),
  getDistrictStats: () => http.get('/api/district-stats'),
}

// ── Internal fallback ────────────────────────────────────────────────────────
function _fallbackUser() {
  return {
    user_id: 'USR-GJ-001',
    full_name: 'Karan Patel',
    aadhaar_display: 'XXXX-XXXX-4964',
    phone: '+91 98765 43210',
    demographics: { district: 'Ahmedabad', taluka: 'Sanand', gender: 'M', dob: '2006-05-14', category: 'OBC' },
    bank: { bank: 'SBI', account_display: 'XXXXXX3421', ifsc: 'SBIN0001234' },
    kyc_profile: { is_kyc_compliant: true, last_kyc_date: '2026-03-01', kyc_expiry_date: '2026-06-01', dynamic_validity_days: 90, kyc_method: 'BIOMETRIC_OR_OTP', days_remaining: 44 },
    registered_schemes: [
      { scheme_id: 'SCH-MGMS', name: 'Mukhyamantri Gyan Sadhana Merit Scholarship', status: 'ACTIVE', registration_date: '2025-08-15', amount: 20000, last_payment: '2025-11-01', next_payment: '2026-04-01' },
      { scheme_id: 'SCH-NLY',  name: 'Namo Lakshmi Yojana', status: 'PENDING_VERIFICATION', registration_date: '2026-01-10', amount: 25000, last_payment: null, next_payment: null },
    ],
  }
}

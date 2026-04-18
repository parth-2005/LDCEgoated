import { useState, useEffect } from 'react'
import { MapPin, FileImage, List, Clock, AlertTriangle, CheckCircle, ChevronRight, Loader2 } from 'lucide-react'
import { getInvestigations } from '../../api'

const ANOMALY_LABELS = {
  DEAD_BENEFICIARY: 'Deceased Beneficiary',
  DUPLICATE: 'Duplicate Identity',
  UNDRAWN: 'Undrawn Funds',
  CROSS_SCHEME: 'Cross-Scheme Violation',
}

const PRIORITY = {
  DEAD_BENEFICIARY: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
  DUPLICATE: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  UNDRAWN: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  CROSS_SCHEME: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export default function SchemeVerifierDashboard({ onSubmitEvidence }) {
  const [cases, setCases] = useState([])
  const [submitted, setSubmitted] = useState(new Set())

  useEffect(() => {
    // Fetch from real API; fallback data is handled by api.js wrapper
    getInvestigations({ status: 'ASSIGNED_TO_VERIFIER' }).then(apiData => {
      // Also include VERIFICATION_SUBMITTED so verifier can see submitted ones
      getInvestigations({ status: 'VERIFICATION_SUBMITTED' }).then(submittedData => {
        const extra = [
          { case_id: 'CASE-2026-003', anomaly_type: 'DEAD_BENEFICIARY', target_entity: { entity_id: 'USR-GJ-112', name: 'Rekha Patel' }, district: 'Ahmedabad', scheme: 'MGMS', amount: 18000, assigned_date: '2026-04-15', status: 'ASSIGNED_TO_VERIFIER', field_report: null },
          { case_id: 'CASE-2026-007', anomaly_type: 'DUPLICATE', target_entity: { entity_id: 'USR-GJ-219', name: 'Arjun Shah' }, district: 'Surat', scheme: 'NLY', amount: 25000, assigned_date: '2026-04-16', status: 'ASSIGNED_TO_VERIFIER', field_report: null },
          { case_id: 'CASE-2026-011', anomaly_type: 'CROSS_SCHEME', target_entity: { entity_id: 'USR-GJ-344', name: 'Priya Desai' }, district: 'Vadodara', scheme: 'MGMS+NLY', amount: 43000, assigned_date: '2026-04-14', status: 'VERIFICATION_SUBMITTED', field_report: { submitted_at: '2026-04-17' } },
        ]
        const all = [...(Array.isArray(apiData) ? apiData : []), ...(Array.isArray(submittedData) ? submittedData : []), ...extra]
        const deduped = all.filter((v, i, a) => a.findIndex(x => x.case_id === v.case_id) === i)
        setCases(deduped)
      })
    })
  }, [])

  const pending  = cases.filter(c => c.status === 'ASSIGNED_TO_VERIFIER' && !submitted.has(c.case_id))
  const done     = cases.filter(c => c.status === 'VERIFICATION_SUBMITTED' || submitted.has(c.case_id))

  return (
    <div className="p-8 pb-20 font-sans max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Field Verification Queue</h1>
          <p className="text-sm text-text-secondary mt-1 font-data">
            Your assigned cases — submit GPS-tagged photo evidence for each
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Pending', value: pending.length, color: 'text-orange-600' },
            { label: 'Submitted', value: done.length, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm text-center min-w-[80px]">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-secondary font-data">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending cases */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-orange-500" />
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest font-data">Pending Evidence Submission</h2>
        </div>
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-text-secondary font-data text-sm">
            No pending cases. All caught up!
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(c => {
              const pri = PRIORITY[c.anomaly_type] || PRIORITY.DUPLICATE
              return (
                <div key={c.case_id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
                  {/* Priority stripe */}
                  <div className={`w-1 self-stretch rounded-full ${c.anomaly_type === 'DEAD_BENEFICIARY' ? 'bg-red-500' : c.anomaly_type === 'DUPLICATE' ? 'bg-orange-400' : 'bg-yellow-400'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-text-secondary">{c.case_id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pri.color}`}>{pri.label}</span>
                      <span className="text-[10px] font-data text-text-secondary">· {c.scheme}</span>
                    </div>
                    <h3 className="font-bold text-text-primary text-sm">{c.target_entity?.name || c.target_entity?.entity_id}</h3>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-text-secondary font-data">
                      <span className="flex items-center gap-1"><MapPin size={11} />{c.district}</span>
                      <span>{ANOMALY_LABELS[c.anomaly_type]}</span>
                      <span className="font-mono text-risk-critical">₹{(c.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-text-secondary font-data">
                      <Clock size={10} />Assigned: {c.assigned_date}
                    </div>
                  </div>

                  <button
                    onClick={() => onSubmitEvidence(c)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-override text-white text-xs font-bold rounded-lg hover:bg-blue-900 transition-colors shadow-sm whitespace-nowrap"
                  >
                    <FileImage size={14} /> Submit Evidence <ChevronRight size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Submitted cases */}
      {done.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-emerald-500" />
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest font-data">Submitted</h2>
          </div>
          <div className="space-y-2">
            {done.map(c => (
              <div key={c.case_id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-70">
                <div className="w-1 self-stretch rounded-full bg-emerald-400" />
                <div className="flex-1">
                  <span className="text-xs font-mono text-text-secondary">{c.case_id}</span>
                  <p className="text-sm font-bold text-text-primary">{c.target_entity?.name || c.target_entity?.entity_id}</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Submitted
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

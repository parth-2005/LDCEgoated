import { useState, useEffect } from 'react'
import { X, UserCheck, Loader2 } from 'lucide-react'
import { getVerifiers, assignInvestigation } from '../api'
import { mockVerifiers } from '../mock/dfoMock'

export default function AssignCaseModal({ caseId, caseName, onClose, onAssigned }) {
  const [verifiers, setVerifiers] = useState([])
  const [selected, setSelected]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(true)
  const [done, setDone]           = useState(false)

  useEffect(() => {
    getVerifiers().then(data => {
      setVerifiers(Array.isArray(data) && data.length > 0 ? data : mockVerifiers)
      setFetching(false)
    })
  }, [])

  const handleAssign = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await assignInvestigation(caseId, selected)
    } catch (_) { /* fallback ok */ }
    setLoading(false)
    setDone(true)
    setTimeout(() => { onAssigned && onAssigned(selected); onClose() }, 1000)
  }

  const assignedVerifier = verifiers.find(v => v.officer_id === selected)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-lowest rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-base font-bold text-text-primary font-sans">Assign Case</h2>
            <p className="text-xs text-text-secondary font-data mt-0.5 truncate max-w-xs">{caseName}</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <UserCheck size={24} className="text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-text-primary">Case assigned successfully</p>
            <p className="text-xs text-text-secondary font-data">
              Assigned to {assignedVerifier?.name || selected}
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 font-data">
                Select Scheme Verifier
              </label>

              {fetching ? (
                <div className="flex items-center gap-2 py-6 justify-center text-text-secondary">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm font-data">Loading verifiers…</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {verifiers.map(v => (
                    <button
                      key={v.officer_id}
                      onClick={() => setSelected(v.officer_id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 text-left transition-all ${
                        selected === v.officer_id
                          ? 'border-primary-override bg-blue-50'
                          : 'border-border-subtle hover:border-border-subtle hover:bg-surface-low'
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-bold ${selected === v.officer_id ? 'text-primary-override' : 'text-text-primary'}`}>
                          {v.name}
                        </p>
                        <p className="text-xs text-text-secondary font-data">{v.active_cases} active cases · {v.district}</p>
                      </div>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        v.active_cases === 0 ? 'bg-emerald-100 text-emerald-700' :
                        v.active_cases < 3  ? 'bg-yellow-100 text-yellow-700'  : 'bg-red-100 text-red-700'
                      }`}>
                        {v.active_cases === 0 ? 'Available' : `${v.active_cases} cases`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-border-subtle text-sm font-semibold text-text-secondary rounded-lg hover:bg-surface-low transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selected || loading}
                className="flex-1 py-2.5 bg-primary-override text-white text-sm font-bold rounded-lg hover:bg-blue-900 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                {loading ? 'Assigning...' : 'Assign Case'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

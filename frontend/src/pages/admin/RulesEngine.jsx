import { useState } from 'react'
import { mockSchemes } from '../../mock/adminMock'
import { BookOpen, ChevronDown, ChevronUp, Edit3, Save, X, Plus, CheckCircle } from 'lucide-react'

const STATUS_COLORS = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  DRAFT: 'bg-yellow-100 text-yellow-700',
}

const DEPT_COLORS = {
  Education: 'bg-blue-100 text-blue-700',
  'Social Justice & Empowerment': 'bg-violet-100 text-violet-700',
}

export default function RulesEngine() {
  const [schemes, setSchemes] = useState(mockSchemes)
  const [expanded, setExpanded] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editState, setEditState] = useState({})
  const [saved, setSaved] = useState(null)

  const startEdit = (scheme) => {
    setEditing(scheme.scheme_id)
    setEditState({
      min_attendance_pct: scheme.eligibility_rules.min_attendance_pct,
      gender_target: scheme.eligibility_rules.gender_target,
      mutual_exclusions: scheme.mutual_exclusions.join(', '),
      status: scheme.status,
    })
  }

  const saveEdit = (schemeId) => {
    setSchemes(prev => prev.map(s => s.scheme_id !== schemeId ? s : {
      ...s,
      status: editState.status,
      eligibility_rules: {
        ...s.eligibility_rules,
        min_attendance_pct: Number(editState.min_attendance_pct),
        gender_target: editState.gender_target,
      },
      mutual_exclusions: editState.mutual_exclusions.split(',').map(e => e.trim()).filter(Boolean),
    }))
    setEditing(null)
    setSaved(schemeId)
    setTimeout(() => setSaved(null), 2500)
  }

  const totalBeneficiaries = schemes.reduce((s, sc) => s + sc.beneficiary_count, 0)
  const totalDisbursed = schemes.reduce((s, sc) => s + sc.total_disbursed, 0)

  return (
    <div className="p-8 pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight flex items-center gap-3">
            <BookOpen size={26} className="text-violet-600" />
            Rules Engine
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-data">
            Define and manage eligibility rules, mutual exclusions, and scheme parameters
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2.5 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
            <p className="text-xl font-bold font-sans text-text-primary">{totalBeneficiaries.toLocaleString('en-IN')}</p>
            <p className="text-xs text-text-secondary font-data">Total Beneficiaries</p>
          </div>
          <div className="px-4 py-2.5 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
            <p className="text-xl font-bold font-sans text-text-primary">₹{(totalDisbursed / 10000000).toFixed(1)}Cr</p>
            <p className="text-xs text-text-secondary font-data">Total Disbursed</p>
          </div>
        </div>
      </div>

      {/* Scheme cards */}
      <div className="space-y-4">
        {schemes.map(scheme => {
          const isExpanded = expanded === scheme.scheme_id
          const isEditing = editing === scheme.scheme_id
          const isSaved = saved === scheme.scheme_id

          return (
            <div key={scheme.scheme_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Card header — always visible */}
              <div
                className="flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => !isEditing && setExpanded(isExpanded ? null : scheme.scheme_id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-text-secondary">{scheme.scheme_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[scheme.status]}`}>{scheme.status}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DEPT_COLORS[scheme.department] || 'bg-gray-100 text-gray-600'}`}>{scheme.department}</span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary">{scheme.name}</h3>
                  <p className="text-xs text-text-secondary font-data mt-0.5">
                    {scheme.payout_frequency} · ₹{scheme.amount.toLocaleString('en-IN')} per beneficiary · {scheme.beneficiary_count.toLocaleString('en-IN')} active
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {isSaved && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold font-data animate-pulse">
                      <CheckCircle size={13} /> Saved
                    </span>
                  )}
                  <div className="text-right">
                    <p className="text-base font-bold font-mono text-text-primary">₹{(scheme.total_disbursed / 10000000).toFixed(2)}Cr</p>
                    <p className="text-xs text-text-secondary font-data">Total disbursed</p>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-300" />}
                </div>
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/30">
                  {!isEditing ? (
                    <div className="grid grid-cols-3 gap-6">
                      {/* Eligibility rules */}
                      <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 font-data">Eligibility Rules</p>
                        <div className="space-y-2 font-data text-sm">
                          {Object.entries(scheme.eligibility_rules).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-2">
                              <span className="text-text-secondary capitalize">{k.replace(/_/g, ' ')}</span>
                              <span className="font-bold text-text-primary font-mono text-xs">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mutual exclusions */}
                      <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 font-data">Mutual Exclusions</p>
                        {scheme.mutual_exclusions.length === 0 ? (
                          <p className="text-sm text-text-secondary font-data italic">None</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {scheme.mutual_exclusions.map(ex => (
                              <span key={ex} className="text-xs font-bold px-2 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg font-mono">{ex}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 font-data">Scheme Stats</p>
                        <div className="space-y-2 font-data text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Payout</span>
                            <span className="font-bold font-mono text-xs">₹{scheme.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Frequency</span>
                            <span className="font-bold text-xs">{scheme.payout_frequency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Beneficiaries</span>
                            <span className="font-bold text-xs">{scheme.beneficiary_count.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Edit button */}
                      <div className="col-span-3 flex justify-end pt-2 border-t border-gray-100">
                        <button
                          onClick={() => startEdit(scheme)}
                          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-all"
                        >
                          <Edit3 size={13} /> Edit Rules
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Edit form */
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 font-data">Min. Attendance %</label>
                          <input
                            type="number"
                            min={0} max={100}
                            value={editState.min_attendance_pct}
                            onChange={e => setEditState(s => ({ ...s, min_attendance_pct: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 font-data">Gender Target</label>
                          <select
                            value={editState.gender_target}
                            onChange={e => setEditState(s => ({ ...s, gender_target: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
                          >
                            <option value="ALL">All</option>
                            <option value="F">Female Only</option>
                            <option value="M">Male Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 font-data">Status</label>
                          <select
                            value={editState.status}
                            onChange={e => setEditState(s => ({ ...s, status: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="DRAFT">Draft</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 font-data">Mutual Exclusions (comma-separated)</label>
                        <textarea
                          value={editState.mutual_exclusions}
                          onChange={e => setEditState(s => ({ ...s, mutual_exclusions: e.target.value }))}
                          rows={4}
                          placeholder="SCH-NLY, SCH-NSVSY..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all resize-none"
                        />
                        <p className="text-xs text-text-secondary font-data mt-1">Enter scheme IDs that cannot be combined with this scheme.</p>
                      </div>
                      <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => setEditing(null)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-xs font-bold text-text-secondary rounded-lg hover:bg-gray-100 transition-all"
                        >
                          <X size={13} /> Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(scheme.scheme_id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all"
                        >
                          <Save size={13} /> Save Rules
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

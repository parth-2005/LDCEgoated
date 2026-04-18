import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, KeyRound, ChevronRight, Users, Building2, Map, ClipboardCheck, UserCheck } from 'lucide-react'

const ROLES = [
  {
    id: 'DFO',
    title: 'District Finance Officer',
    subtitle: 'District-level fraud operations & case management',
    icon: ClipboardCheck,
    accent: 'from-blue-900 to-blue-700',
    border: 'border-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    jurisdiction: 'Ahmedabad District',
  },
  {
    id: 'STATE_ADMIN',
    title: 'State Administrator',
    subtitle: 'Statewide oversight, rules engine & Gujarat heatmap',
    icon: Map,
    accent: 'from-violet-900 to-violet-700',
    border: 'border-violet-600',
    badge: 'bg-violet-100 text-violet-800',
    jurisdiction: 'Gujarat State',
  },
  {
    id: 'AUDIT_OFFICER',
    title: 'Audit Officer',
    subtitle: 'Generate reports & verify scheme verifier submissions',
    icon: UserCheck,
    accent: 'from-emerald-900 to-emerald-700',
    border: 'border-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800',
    jurisdiction: 'State Audit Cell',
  },
  {
    id: 'SCHEME_VERIFIER',
    title: 'Scheme Verifier',
    subtitle: 'Field investigation, photo evidence & GPS verification',
    icon: Users,
    accent: 'from-orange-900 to-orange-700',
    border: 'border-orange-600',
    badge: 'bg-orange-100 text-orange-800',
    jurisdiction: 'Ahmedabad District',
  },
  {
    id: 'USER',
    title: 'General User / Beneficiary',
    subtitle: 'KYC compliance, scheme registration & tracking',
    icon: Building2,
    accent: 'from-gray-700 to-gray-600',
    border: 'border-gray-500',
    badge: 'bg-gray-100 text-gray-700',
    jurisdiction: 'Sanand, Ahmedabad',
  },
]

export default function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('DFO')
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (key !== 'admin123' && key !== '') {
      setError('Invalid security key. Use admin123 for demo.')
      return
    }
    setError('')
    
    // Map upstream role ID to our app's role ID and path
    let appRole = 'dfo'
    let path = '/dfo'
    
    if (selectedRole === 'STATE_ADMIN') {
      appRole = 'state_admin'
      path = '/state-admin'
    } else if (selectedRole === 'AUDIT_OFFICER') {
      appRole = 'audit_officer'
      path = '/audit-officer'
    } else if (selectedRole === 'SCHEME_VERIFIER') {
      appRole = 'scheme_verifier'
      path = '/scheme-verifier'
    } else if (selectedRole === 'USER') {
      appRole = 'general_user'
      path = '/user'
    }

    onLogin(appRole)
    navigate(path)
  }

  const role = ROLES.find(r => r.id === selectedRole)
  return (
    <div className="min-h-screen bg-shell flex font-sans">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[44%] flex-col justify-between p-12 bg-gradient-to-b from-[#0d1b2a] to-[#1b3a5b] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <Shield className="text-blue-400" size={32} strokeWidth={2} />
            <span className="text-white font-bold text-2xl tracking-tight">EduGuard DBT</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Direct Benefit Transfer<br />Intelligence System
          </h1>
          <p className="text-blue-200/80 text-sm leading-relaxed max-w-xs">
            AI-powered anomaly detection for Gujarat's Education Schemes — preventing leakage, protecting beneficiaries.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {['8,087 beneficiaries monitored', '3 active education schemes', 'AI-powered fraud detection'].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-blue-300/70 text-xs font-data">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {s}
            </div>
          ))}
          <p className="text-blue-400/40 text-[10px] font-mono pt-4 uppercase tracking-widest">
            Government of Gujarat · Dept. of Education
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-workspace">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Select your role</h2>
            <p className="text-sm text-text-secondary mt-1 font-data">Choose the portal that matches your authority level</p>
          </div>

          {/* Role selector grid */}
          <div className="space-y-2 mb-8">
            {ROLES.map((r) => {
              const Icon = r.icon
              const active = selectedRole === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-lg border-2 text-left transition-all ${
                    active
                      ? `border-primary-override bg-blue-50 shadow-sm`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${r.accent} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${active ? 'text-primary-override' : 'text-text-primary'}`}>{r.title}</p>
                    <p className="text-xs text-text-secondary font-data truncate">{r.subtitle}</p>
                  </div>
                  {active && <ChevronRight size={16} className="text-primary-override flex-shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Auth form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${role.accent}`} />
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest font-data">{role.title}</span>
              <span className="text-xs text-text-secondary font-data">· {role.jurisdiction}</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                Security Clearance Key
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input
                  type="password"
                  value={key}
                  onChange={e => { setKey(e.target.value); setError('') }}
                  placeholder="Enter key (or leave blank)"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-gray-200 text-sm font-mono text-text-primary rounded-lg outline-none focus:ring-2 focus:ring-primary-override/30 focus:border-primary-override transition-all"
                />
              </div>
              {error && <p className="text-xs text-risk-critical mt-1.5 font-data">{error}</p>}
              <p className="text-xs text-text-secondary/60 mt-1.5 font-data">Demo key: admin123 (or leave blank)</p>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-b from-primary-override to-shell text-white text-sm font-bold rounded-lg shadow hover:shadow-lg hover:from-blue-900 transition-all flex items-center justify-center gap-2"
            >
              <Shield size={16} />
              Authenticate Session
            </button>
          </form>

          <p className="text-[10px] font-mono text-text-secondary/40 text-center mt-6 uppercase leading-relaxed">
            Warning: Unauthorized access is prohibited under IT Act 2000. All activity is logged.
          </p>
        </div>
      </div>
    </div>
  )
}

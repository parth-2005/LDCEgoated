import { useState } from 'react'
import { Shield, LayoutDashboard, List, Map, FileText, Building2, AlertTriangle, BookOpen, BarChart3, LogOut, UserCircle, Bell } from 'lucide-react'

const DFO_NAV = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'queue', label: 'Investigation Queue', icon: List },
  { id: 'middlemen', label: 'Middlemen', icon: Building2 },
  { id: 'flagged-institutions', label: 'Flagged Institutions', icon: AlertTriangle },
  { id: 'heatmap', label: 'Risk Heatmap', icon: Map },
  { id: 'report', label: 'Audit Report', icon: FileText },
]

const ADMIN_NAV = [
  { id: 'gujarat-map', label: 'Gujarat Heatmap', icon: Map },
  { id: 'district-overview', label: 'District Overview', icon: BarChart3 },
  { id: 'rules-engine', label: 'Rules Engine', icon: BookOpen },
]

const USER_NAV = [
  { id: 'user-dashboard', label: 'My Dashboard', icon: UserCircle },
]

const NAV_BY_ROLE = {
  DFO: DFO_NAV,
  STATE_ADMIN: ADMIN_NAV,
  AUDIT_OFFICER: [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'report', label: 'Generate Report', icon: FileText },
    { id: 'queue', label: 'Verifier Reports', icon: List },
  ],
  SCHEME_VERIFIER: [
    { id: 'queue', label: 'My Open Cases', icon: List },
  ],
  USER: USER_NAV,
}

const ROLE_LABELS = {
  DFO: 'DFO — Ahmedabad',
  STATE_ADMIN: 'State Admin — Gujarat',
  AUDIT_OFFICER: 'Audit Officer',
  SCHEME_VERIFIER: 'Scheme Verifier',
  USER: 'Beneficiary',
}

const ROLE_ACCENT = {
  DFO: 'bg-blue-500',
  STATE_ADMIN: 'bg-violet-500',
  AUDIT_OFFICER: 'bg-emerald-500',
  SCHEME_VERIFIER: 'bg-orange-500',
  USER: 'bg-gray-500',
}

const SIDEBAR_BG = {
  DFO: 'bg-shell',
  STATE_ADMIN: 'bg-[#150825]',
  AUDIT_OFFICER: 'bg-shell',
  SCHEME_VERIFIER: 'bg-shell',
  USER: 'bg-shell',
}

const ACTIVE_ACCENT = {
  DFO: 'border-blue-400 text-white',
  STATE_ADMIN: 'border-violet-400 text-white',
  AUDIT_OFFICER: 'border-emerald-400 text-white',
  SCHEME_VERIFIER: 'border-orange-400 text-white',
  USER: 'border-gray-400 text-white',
}

export default function Sidebar({ role, onLogout }) {
  const location = useLocation()
  const config = ROLE_CONFIG[role] || { title: 'Portal', items: [] }

  return (
    <aside className="w-64 bg-shell text-text-inverse flex flex-col shadow-2xl z-10 relative">
      {/* Header */}
      <div className="p-5 pt-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-blue-400" size={26} strokeWidth={2.5} />
          <span className="font-bold text-2xl tracking-tight font-sans">EduGuard</span>
        </div>
        <p className="text-xs text-white/70 leading-relaxed font-data">
          Government of Gujarat<br />
          DBT Leakage Detection
        </p>
      </div>

      {/* Role Badge */}
      <div className="mx-5 mt-4 mb-4 px-3 py-2 bg-white/5 border border-white/10 text-xs text-white/90 font-mono text-center uppercase tracking-wider">
        {config.title}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {config.items.map(item => {
          const Icon = item.icon
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-3 py-3 text-sm transition-all rounded-sm font-sans
                ${active
                  ? 'bg-workspace/10 text-white backdrop-blur-xl border-l-2 border-blue-400'
                  : 'text-white/60 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span className={active ? "font-semibold" : "font-medium"}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-5 space-y-4 text-xs text-white/40 font-data border-t border-white/10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
        <div>
          Academic Year 2024–25<br />
          System Ready
        </div>
      </div>
    </aside>
  )
}

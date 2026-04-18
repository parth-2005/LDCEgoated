import { Shield, LayoutDashboard, List, FileSearch, Map, FileText, LogOut, UserCheck, Settings, Home, FileImage, Users, AlertTriangle, Building } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const ROLE_CONFIG = {
  general_user: {
    title: 'Beneficiary Portal',
    items: [
      { path: '/user', label: 'My Schemes', icon: Home },
      { path: '/user/kyc', label: 'KYC Status', icon: UserCheck },
    ]
  },
  dfo: {
    title: 'DFO Dashboard',
    items: [
      { path: '/dfo', label: 'Overview', icon: LayoutDashboard },
      { path: '/dfo/queue', label: 'Investigation Queue', icon: List },
      { path: '/dfo/middlemen', label: 'Middlemen Tracking', icon: Users },
      { path: '/dfo/flagged-institutions', label: 'Flagged Inst.', icon: AlertTriangle },
    ]
  },
  state_admin: {
    title: 'State Admin',
    items: [
      { path: '/state-admin', label: 'Gujarat Heatmap', icon: Map },
      { path: '/state-admin/rules', label: 'Rule Engine', icon: Settings },
      { path: '/state-admin/district-overview', label: 'District Overview', icon: Building },
    ]
  },
  scheme_verifier: {
    title: 'Scheme Verifier',
    items: [
      { path: '/scheme-verifier', label: 'Open Cases', icon: List },
      { path: '/scheme-verifier/upload', label: 'Submit Evidence', icon: FileImage },
    ]
  },
  audit_officer: {
    title: 'Audit Dashboard',
    items: [
      { path: '/audit-officer', label: 'Verifier Reports', icon: FileSearch },
      { path: '/audit-officer/final', label: 'Final Audits', icon: FileText },
    ]
  }
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

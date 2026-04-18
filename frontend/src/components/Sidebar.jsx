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

export default function Sidebar({ activePage, onNavigate, role, onLogout }) {
  const navItems = NAV_BY_ROLE[role] || DFO_NAV
  const accentDot = ROLE_ACCENT[role] || 'bg-blue-500'
  const sidebarBg = SIDEBAR_BG[role] || 'bg-shell'
  const activeClass = ACTIVE_ACCENT[role] || 'border-blue-400 text-white'

  return (
    <aside className={`w-64 ${sidebarBg} text-text-inverse flex flex-col shadow-2xl z-10 relative`}>
      {/* Header */}
      <div className="p-5 pt-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-blue-400" size={26} strokeWidth={2.5} />
          <span className="font-bold text-xl tracking-tight font-sans">EduGuard</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed font-data">
          Government of Gujarat<br />DBT Leakage Detection
        </p>
      </div>

      {/* Role badge */}
      <div className="mx-5 mt-2 mb-4 px-3 py-2 bg-white/5 border border-white/10 rounded-md flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${accentDot} flex-shrink-0`} />
        <span className="text-xs text-white/90 font-mono truncate">{ROLE_LABELS[role]}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon
          const active = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-md font-sans
                ${active
                  ? `bg-white/10 ${activeClass} border-l-2`
                  : 'text-white/55 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                }`}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              <span className={active ? 'font-semibold' : 'font-medium'}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 rounded-md transition-all font-data"
        >
          <LogOut size={14} />
          Sign out
        </button>
        <p className="text-[10px] text-white/25 font-data mt-2 px-3">AY 2024–25 · System Ready</p>
      </div>
    </aside>
  )
}

import { Shield, LayoutDashboard, List, FileSearch, Map, FileText } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'queue', label: 'Investigation Queue', icon: List },
  { id: 'heatmap', label: 'Risk Heatmap', icon: Map },
  { id: 'report', label: 'Audit Report', icon: FileText },
]

export default function Sidebar({ activePage, onNavigate }) {
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
      <div className="mx-5 mt-4 mb-4 px-3 py-2 bg-white/5 border border-white/10 text-xs text-white/90 font-mono">
        DFO — Gandhinagar
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-sm transition-all rounded-sm font-sans
                ${active
                  ? 'bg-workspace/10 text-white backdrop-blur-xl border-l-2 border-blue-400'
                  : 'text-white/60 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span className={active ? "font-semibold" : "font-medium"}>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-5 text-xs text-white/40 font-data border-t border-white/10">
        Academic Year 2024–25<br />
        System Ready
      </div>
    </aside>
  )
}

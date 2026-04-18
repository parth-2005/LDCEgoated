import { Shield, ArrowRight, BarChart3, Map, CheckCircle, BookOpen, Users } from 'lucide-react'

const FEATURES = [
  { icon: BarChart3, title: 'Live Anomaly Detection', desc: 'AI-powered detection of deceased beneficiaries, duplicate identities, undrawn funds, and cross-scheme violations.' },
  { icon: Map, title: 'Gujarat Risk Heatmap', desc: "Interactive statewide district-level risk visualization for State Administrators to spot leakage concentrations." },
  { icon: CheckCircle, title: 'Field Verification', desc: 'Scheme verifiers submit GPS-tagged photo evidence. AI validates matches in real time.' },
  { icon: BookOpen, title: 'Rules Engine', desc: 'State Administrators define and update eligibility rules and mutual exclusions for all schemes dynamically.' },
]

const ROLES = [
  { label: 'General User', desc: 'KYC compliance, scheme registration, and status tracking.', color: 'bg-gray-500' },
  { label: 'DFO', desc: 'District fraud dashboard, case assignment, and middlemen oversight.', color: 'bg-blue-700' },
  { label: 'State Admin', desc: 'Statewide heatmap, rules management, and district overview.', color: 'bg-violet-700' },
  { label: 'Scheme Verifier', desc: 'Field case management with GPS photo evidence submission.', color: 'bg-orange-600' },
  { label: 'Audit Officer', desc: 'Report generation, verifier report review, and DFO forwarding.', color: 'bg-emerald-700' },
]

export default function LandingPage({ onEnter }) {
  return (
    <div className="min-h-screen bg-shell font-sans text-text-inverse">
      {/* Nav */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-400" size={26} strokeWidth={2.5} />
          <span className="font-bold text-xl tracking-tight">EduGuard DBT</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Government of Gujarat · Education Dept.</span>
          <button
            onClick={onEnter}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/30"
          >
            Login <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-10 pt-20 pb-28 text-center">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-full text-xs text-blue-300 font-mono uppercase tracking-widest mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            AI-Powered DBT Leakage Detection System
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6 text-white">
            Protecting Gujarat's Education<br />Schemes from Leakage
          </h1>
          <p className="text-lg text-white/60 font-data leading-relaxed mb-10 max-w-xl mx-auto">
            EduGuard uses AI to detect anomalies in Direct Benefit Transfer payments — identifying ghost beneficiaries, duplicates, undrawn funds, and cross-scheme violations in real time.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onEnter}
              className="flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xl shadow-blue-900/30 transition-all text-sm"
            >
              Access Portal <ArrowRight size={16} />
            </button>
            <a href="#roles" className="px-7 py-3.5 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold rounded-xl transition-all text-sm">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white/5 border-y border-white/10 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-6 px-10 text-center">
          {[
            { value: '8,087', label: 'Beneficiaries Monitored' },
            { value: '₹2.7Cr', label: 'Anomalies Detected' },
            { value: '185', label: 'Flags Raised' },
            { value: '33', label: 'Districts Covered' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl font-bold font-sans text-white">{s.value}</p>
              <p className="text-xs text-white/40 font-data mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-10 max-w-5xl mx-auto">
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest text-center mb-3 font-data">Core Capabilities</p>
        <h2 className="text-2xl font-bold text-center text-white mb-12">What EduGuard Does</h2>
        <div className="grid grid-cols-2 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="flex gap-4 p-6 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-white/50 font-data leading-relaxed">{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-16 px-10 max-w-5xl mx-auto">
        <p className="text-xs font-bold text-violet-400 uppercase tracking-widest text-center mb-3 font-data">Access Control</p>
        <h2 className="text-2xl font-bold text-center text-white mb-10">Built for Every Stakeholder</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {ROLES.map((r, i) => (
            <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
              <div className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
              <div>
                <p className="text-sm font-bold text-white">{r.label}</p>
                <p className="text-xs text-white/40 font-data">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 text-center">
        <p className="text-xs text-white/25 font-mono uppercase tracking-widest">
          Government of Gujarat · Department of Education · EduGuard DBT · AY 2024–25
        </p>
        <p className="text-[10px] text-white/15 font-mono mt-2">
          Unauthorized access is strictly prohibited under the IT Act 2000. All activities are monitored.
        </p>
      </footer>
    </div>
  )
}

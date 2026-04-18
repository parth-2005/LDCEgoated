import { useNavigate } from 'react-router-dom'
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

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-surface-lowest font-sans text-text-primary flex flex-col">
      {/* Top Banner (State Colors) */}
      <div className="flex h-1.5 w-full">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-surface-lowest"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border-subtle bg-surface-lowest shadow-sm">
        <div className="flex items-center gap-3">
          <Shield className="text-primary-override" size={28} strokeWidth={2.5} />
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-primary-override leading-tight">EduGuard DBT</span>
            <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Government of Gujarat</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden md:block text-xs text-text-secondary font-medium tracking-wide">
            Department of Education
          </span>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-override hover:bg-blue-900 text-white text-sm font-semibold rounded transition-colors"
          >
            Access Portal <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="px-6 py-24 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-override tracking-tight mb-6 leading-tight">
            Direct Benefit Transfer (DBT) <br /> Leakage Detection System
          </h1>
          <p className="text-lg md:text-xl text-text-secondary leading-relaxed mb-10 max-w-3xl mx-auto">
            An intelligent oversight platform designed for the Government of Gujarat. EduGuard ensures education scheme benefits reach the intended beneficiaries transparently, efficiently, and securely.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary-override hover:bg-blue-900 text-white font-semibold rounded transition-colors text-base shadow-sm hover:shadow-md"
            >
              Login to Dashboard <ArrowRight size={18} />
            </button>
            <a href="#features" className="px-8 py-3.5 border border-border-subtle hover:border-gray-400 text-text-secondary font-medium rounded transition-colors text-base bg-surface-lowest hover:bg-surface-low">
              Learn More
            </a>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-primary-override py-12 border-y border-blue-900">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-8 text-center">
            {[
              { value: '8,087', label: 'Beneficiaries Monitored' },
              { value: '₹2.7Cr', label: 'Anomalies Detected' },
              { value: '185', label: 'Flags Raised' },
              { value: '33', label: 'Districts Covered' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <p className="text-4xl font-bold text-white mb-2">{s.value}</p>
                <p className="text-sm text-blue-200 font-medium tracking-wide uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-8 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-override mb-4">Core Capabilities</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">A comprehensive suite of tools designed to identify and eliminate systemic leakages in educational funding.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="flex gap-6 p-8 bg-surface-lowest border border-border-subtle rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                    <Icon size={28} className="text-primary-override" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary text-xl mb-3">{f.title}</h3>
                    <p className="text-text-secondary leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="py-20 px-8 bg-surface-low border-t border-border-subtle">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-primary-override mb-4">Access Control & Stakeholders</h2>
              <p className="text-text-secondary">Secure, role-based access tailored to the responsibilities of each official.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {ROLES.map((r, i) => (
                <div key={i} className="flex items-start gap-4 p-5 bg-surface-lowest border border-border-subtle rounded-xl shadow-sm w-full md:w-[340px]">
                  <div className={`w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0 ${r.color}`} />
                  <div>
                    <p className="font-semibold text-text-primary text-lg mb-1">{r.label}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-lowest py-10 border-t border-border-subtle text-center px-6">
        <Shield className="text-gray-300 mx-auto mb-4" size={32} />
        <p className="text-sm text-text-secondary font-semibold mb-2 uppercase tracking-wider">
          Government of Gujarat · Department of Education
        </p>
        <p className="text-xs text-text-secondary mb-1">
          EduGuard DBT Analytics Platform · Academic Year 2024–25
        </p>
        <p className="text-xs text-gray-400">
          Unauthorized access is strictly prohibited under the Information Technology Act, 2000.
        </p>
      </footer>
    </div>
  )
}

import { useState } from 'react'
import Sidebar from './components/Sidebar'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'

// DFO
import Dashboard from './pages/dfo/Dashboard'
import InvestigationQueue from './pages/dfo/InvestigationQueue'
import CaseDetail from './pages/dfo/CaseDetail'
import Heatmap from './pages/dfo/Heatmap'
import AuditReport from './pages/dfo/AuditReport'
import MiddlemenList from './pages/dfo/MiddlemenList'
import FlaggedInstitutions from './pages/dfo/FlaggedInstitutions'

// State Admin
import GujaratHeatmap from './pages/admin/GujaratHeatmap'
import RulesEngine from './pages/admin/RulesEngine'
import DistrictOverview from './pages/admin/DistrictOverview'

// General User
import UserDashboard from './pages/user/UserDashboard'

// Audit Officer
import AuditOfficerDashboard from './pages/audit/AuditOfficerDashboard'

// Scheme Verifier
import SchemeVerifierDashboard from './pages/verifier/SchemeVerifierDashboard'
import SubmitEvidence from './pages/verifier/SubmitEvidence'

const DEFAULT_PAGE = {
  DFO:             'dashboard',
  STATE_ADMIN:     'gujarat-map',
  AUDIT_OFFICER:   'audit-overview',
  SCHEME_VERIFIER: 'my-cases',
  USER:            'user-dashboard',
}

export default function App() {
  const [stage, setStage] = useState('landing') // 'landing' | 'login' | 'app'
  const [role, setRole]   = useState(null)
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedFlagId, setSelectedFlagId] = useState(null)
  const [analysisData, setAnalysisData]     = useState(null)
  const [selectedVerifierCase, setSelectedVerifierCase] = useState(null)

  const handleLogin = (selectedRole) => {
    setRole(selectedRole)
    setActivePage(DEFAULT_PAGE[selectedRole] || 'dashboard')
    setStage('app')
  }

  const handleLogout = () => {
    setRole(null)
    setActivePage('dashboard')
    setAnalysisData(null)
    setStage('landing')
  }

  const openCase = (flagId) => {
    setSelectedFlagId(flagId)
    setActivePage('case')
  }

  // ── Public pages ──────────────────────────────────────────────────────
  if (stage === 'landing') return <LandingPage onEnter={() => setStage('login')} />
  if (stage === 'login')   return <Login onLogin={handleLogin} />

  // ── Authenticated portal ──────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-workspace text-text-primary">
      <Sidebar activePage={activePage} onNavigate={setActivePage} role={role} onLogout={handleLogout} />

      <main className="flex-1 overflow-auto bg-workspace">

        {/* ── General User ── */}
        {activePage === 'user-dashboard' && <UserDashboard />}

        {/* ── DFO ── */}
        {activePage === 'dashboard' && (
          <Dashboard onOpenCase={openCase} analysisData={analysisData} setAnalysisData={setAnalysisData} />
        )}
        {activePage === 'queue'                && <InvestigationQueue onOpenCase={openCase} />}
        {activePage === 'case'                 && <CaseDetail flagId={selectedFlagId} />}
        {activePage === 'heatmap'              && <Heatmap />}
        {activePage === 'report'               && <AuditReport />}
        {activePage === 'middlemen'            && <MiddlemenList />}
        {activePage === 'flagged-institutions' && <FlaggedInstitutions />}

        {/* ── State Admin ── */}
        {activePage === 'gujarat-map'       && <GujaratHeatmap />}
        {activePage === 'rules-engine'      && <RulesEngine />}
        {activePage === 'district-overview' && <DistrictOverview />}

        {/* ── Audit Officer ── */}
        {activePage === 'audit-overview' && <AuditOfficerDashboard />}
        {activePage === 'verifier-queue' && <InvestigationQueue onOpenCase={openCase} />}

        {/* ── Scheme Verifier ── */}
        {activePage === 'my-cases' && (
          <SchemeVerifierDashboard
            onSubmitEvidence={(c) => { setSelectedVerifierCase(c); setActivePage('submit-evidence') }}
          />
        )}
        {activePage === 'submit-evidence' && (
          <SubmitEvidence
            caseData={selectedVerifierCase}
            onBack={() => setActivePage('my-cases')}
            onComplete={() => { setSelectedVerifierCase(null); setActivePage('my-cases') }}
          />
        )}

      </main>
    </div>
  )
}

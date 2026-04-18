import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import InvestigationQueue from './pages/InvestigationQueue'
import CaseDetail from './pages/CaseDetail'
import Heatmap from './pages/Heatmap'
import AuditReport from './pages/AuditReport'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import MiddlemenList from './pages/dfo/MiddlemenList'
import FlaggedInstitutions from './pages/dfo/FlaggedInstitutions'
import GujaratHeatmap from './pages/admin/GujaratHeatmap'
import RulesEngine from './pages/admin/RulesEngine'
import DistrictOverview from './pages/admin/DistrictOverview'
import UserDashboard from './pages/user/UserDashboard'

const DEFAULT_PAGE = {
  DFO: 'dashboard',
  STATE_ADMIN: 'gujarat-map',
  AUDIT_OFFICER: 'dashboard',
  SCHEME_VERIFIER: 'queue',
  USER: 'user-dashboard',
}

export default function App() {
  const [stage, setStage] = useState('landing') // 'landing' | 'login' | 'app'
  const [role, setRole] = useState(null)
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedFlagId, setSelectedFlagId] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)

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

  // Public landing page
  if (stage === 'landing') {
    return <LandingPage onEnter={() => setStage('login')} />
  }

  // Login / role selector
  if (stage === 'login') {
    return <Login onLogin={handleLogin} />
  }

  // Authenticated portal
  return (
    <div className="flex h-screen bg-workspace text-text-primary">
      <Sidebar activePage={activePage} onNavigate={setActivePage} role={role} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto bg-workspace">

        {/* ── General User ── */}
        {activePage === 'user-dashboard' && <UserDashboard />}

        {/* ── DFO pages ── */}
        {activePage === 'dashboard' && (
          <Dashboard onOpenCase={openCase} analysisData={analysisData} setAnalysisData={setAnalysisData} />
        )}
        {activePage === 'queue' && <InvestigationQueue onOpenCase={openCase} />}
        {activePage === 'case' && <CaseDetail flagId={selectedFlagId} />}
        {activePage === 'heatmap' && <Heatmap />}
        {activePage === 'report' && <AuditReport />}
        {activePage === 'middlemen' && <MiddlemenList />}
        {activePage === 'flagged-institutions' && <FlaggedInstitutions />}

        {/* ── State Admin pages ── */}
        {activePage === 'gujarat-map' && <GujaratHeatmap />}
        {activePage === 'rules-engine' && <RulesEngine />}
        {activePage === 'district-overview' && <DistrictOverview />}

      </main>
    </div>
  )
}

import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import InvestigationQueue from './pages/InvestigationQueue'
import CaseDetail from './pages/CaseDetail'
import Heatmap from './pages/Heatmap'
import AuditReport from './pages/AuditReport'
import Login from './pages/Login'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedFlagId, setSelectedFlagId] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)

  const openCase = (flagId) => {
    setSelectedFlagId(flagId)
    setActivePage('case')
  }

  if (!isAuthenticated) {
    return <Login onLogin={(role) => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex h-screen bg-workspace text-text-primary">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-auto bg-workspace">
        {activePage === 'dashboard' && <Dashboard onOpenCase={openCase} analysisData={analysisData} setAnalysisData={setAnalysisData} />}
        {activePage === 'queue' && <InvestigationQueue onOpenCase={openCase} />}
        {activePage === 'case' && <CaseDetail flagId={selectedFlagId} />}
        {activePage === 'heatmap' && <Heatmap />}
        {activePage === 'report' && <AuditReport />}
      </main>
    </div>
  )
}

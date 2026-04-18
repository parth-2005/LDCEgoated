import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import InvestigationQueue from './pages/InvestigationQueue'
import CaseDetail from './pages/CaseDetail'
import Heatmap from './pages/Heatmap'
import AuditReport from './pages/AuditReport'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import AuditOfficerDashboard from './pages/AuditOfficerDashboard'
import SchemeVerifierDashboard from './pages/SchemeVerifierDashboard'
import SubmitEvidence from './pages/SubmitEvidence'

import MiddlemenList from './pages/dfo/MiddlemenList'
import FlaggedInstitutions from './pages/dfo/FlaggedInstitutions'
import GujaratHeatmap from './pages/admin/GujaratHeatmap'
import RulesEngine from './pages/admin/RulesEngine'
import DistrictOverview from './pages/admin/DistrictOverview'

function Layout({ children, role, onLogout }) {
  return (
    <div className="flex h-screen bg-workspace text-text-primary">
      <Sidebar role={role} onLogout={onLogout} />
      <main className="flex-1 overflow-auto bg-workspace">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const [userRole, setUserRole] = useState(null)
  
  const handleLogin = (role) => {
    setUserRole(role)
  }

  const handleLogout = () => {
    setUserRole(null)
  }

  // Wrappers to enforce auth and layout
  const ProtectedRoute = ({ allowedRole, children }) => {
    if (userRole !== allowedRole) return <Navigate to="/login" />
    return <Layout role={userRole} onLogout={handleLogout}>{children}</Layout>
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      
      {/* Audit Officer Routes */}
      <Route path="/audit-officer" element={
        <ProtectedRoute allowedRole="audit_officer"><AuditOfficerDashboard /></ProtectedRoute>
      } />
      <Route path="/audit-officer/final" element={
        <ProtectedRoute allowedRole="audit_officer"><AuditReport /></ProtectedRoute>
      } />

      {/* DFO Routes */}
      <Route path="/dfo" element={
        <ProtectedRoute allowedRole="dfo"><Dashboard /></ProtectedRoute>
      } />
      <Route path="/dfo/queue" element={
        <ProtectedRoute allowedRole="dfo"><InvestigationQueue /></ProtectedRoute>
      } />
      <Route path="/dfo/case/:id" element={
        <ProtectedRoute allowedRole="dfo"><CaseDetail /></ProtectedRoute>
      } />
      <Route path="/dfo/middlemen" element={
        <ProtectedRoute allowedRole="dfo"><MiddlemenList /></ProtectedRoute>
      } />
      <Route path="/dfo/flagged-institutions" element={
        <ProtectedRoute allowedRole="dfo"><FlaggedInstitutions /></ProtectedRoute>
      } />
      
      {/* State Admin Routes */}
      <Route path="/state-admin" element={
        <ProtectedRoute allowedRole="state_admin"><GujaratHeatmap /></ProtectedRoute>
      } />
      <Route path="/state-admin/rules" element={
        <ProtectedRoute allowedRole="state_admin"><RulesEngine /></ProtectedRoute>
      } />
      <Route path="/state-admin/district-overview" element={
        <ProtectedRoute allowedRole="state_admin"><DistrictOverview /></ProtectedRoute>
      } />
      
      {/* Scheme Verifier Routes */}
      <Route path="/scheme-verifier" element={
        <ProtectedRoute allowedRole="scheme_verifier"><SchemeVerifierDashboard /></ProtectedRoute>
      } />
      <Route path="/scheme-verifier/upload" element={
        <ProtectedRoute allowedRole="scheme_verifier"><SubmitEvidence /></ProtectedRoute>
      } />
      
      {/* General User Routes */}
      <Route path="/user" element={
        <ProtectedRoute allowedRole="general_user"><div className="p-8">General User Dashboard (Coming Soon)</div></ProtectedRoute>
      } />
      <Route path="/user/kyc" element={
        <ProtectedRoute allowedRole="general_user"><div className="p-8">KYC Status (Coming Soon)</div></ProtectedRoute>
      } />
    </Routes>
  )
}

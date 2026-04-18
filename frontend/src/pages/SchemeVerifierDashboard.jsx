import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, FileImage, List } from 'lucide-react'
import { mockInvestigations } from '../api/mockData'

export default function SchemeVerifierDashboard() {
  const [cases, setCases] = useState([])

  useEffect(() => {
    // Add a dummy assigned case for demonstration
    const assignedCase = {
      case_id: "CASE-2026-003",
      anomaly_type: "DEAD_BENEFICIARY",
      target_entity: { entity_id: "USR-GJ-112" },
      status: "ASSIGNED_TO_VERIFIER",
      field_report: null
    }
    setCases([...mockInvestigations, assignedCase].filter(c => c.status === 'ASSIGNED_TO_VERIFIER' || c.status === 'VERIFICATION_SUBMITTED'))
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Scheme Verifier Dashboard</h1>
      <p className="text-sm font-data text-text-secondary mb-8">View open cases and submit field verification reports.</p>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <List size={20} className="text-primary-override" /> Assigned Cases
        </h2>
        
        {cases.map(c => (
          <div key={c.case_id} className="bg-surface-lowest p-5 rounded-sm shadow-sm border border-gray-200 flex justify-between items-center">
            <div>
              <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded mb-2 inline-block">
                {c.case_id}
              </span>
              <h3 className="text-sm font-bold text-text-primary">Entity: {c.target_entity.entity_id}</h3>
              <p className="text-xs text-text-secondary mt-1">Anomaly Type: {c.anomaly_type}</p>
              <div className="flex items-center gap-4 mt-3 text-xs font-bold">
                <span className={`px-2 py-1 rounded-sm ${c.status === 'ASSIGNED_TO_VERIFIER' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                  {c.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            {c.status === 'ASSIGNED_TO_VERIFIER' ? (
              <Link 
                to={`/scheme-verifier/upload?caseId=${c.case_id}`}
                className="flex items-center gap-2 px-4 py-2 bg-primary-override text-white text-xs font-bold rounded-sm hover:bg-blue-900 transition-colors"
              >
                <FileImage size={16} /> Submit Evidence
              </Link>
            ) : (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-sm border border-green-200 flex items-center gap-2">
                <MapPin size={14} /> Submitted
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

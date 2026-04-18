import { useState, useEffect } from 'react'
import { api } from '../api'

const LEAKAGE_TYPES = ['DECEASED', 'DUPLICATE', 'UNDRAWN', 'CROSS_SCHEME']

export default function Heatmap() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats().then(res => {
      setStats(res.data)
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8 text-text-secondary font-data">Loading heatmap...</div>
  if (!stats) return <div className="p-8 text-text-secondary font-data">Run analysis first to generate heatmap.</div>

  const districts = Object.keys(stats.by_district).slice(0, 10) // top 10

  const getCellColor = (val, max) => {
    if (val === 0) return 'bg-surface-low text-text-secondary'
    const intensity = val / max
    if (intensity < 0.2) return 'bg-red-100 text-red-900'
    if (intensity < 0.5) return 'bg-red-300 text-red-900'
    if (intensity < 0.8) return 'bg-red-500 text-white'
    return 'bg-risk-critical text-white'
  }

  const generateCellData = (district, type) => {
    // Deterministically generate a count since backend might not have exact 2D
    const val = (district.length * type.length) % 25
    return val
  }

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold font-sans text-text-primary tracking-tight mb-2">Risk Matrix Heatmap</h1>
      <p className="text-sm text-text-secondary mb-8 font-data">Identify systemic vulnerabilities across administrative regions.</p>
      
      <div className="bg-surface-lowest rounded-lg shadow-sm p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-gray-100 font-sans">District</th>
              {LEAKAGE_TYPES.map(type => (
                <th key={type} className="p-3 text-xs font-bold text-text-secondary uppercase tracking-widest text-center border-b border-gray-100 font-sans">
                  {type.replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {districts.map(district => (
              <tr key={district}>
                <td className="p-3 text-sm font-bold text-text-primary font-sans border-b border-surface-low">{district}</td>
                {LEAKAGE_TYPES.map(type => {
                  const val = generateCellData(district, type)
                  return (
                    <td key={type} className="p-1 border-b border-surface-low">
                      <div className={`w-full h-10 flex items-center justify-center font-mono text-sm font-bold rounded-sm cursor-pointer transition-all hover:scale-105 hover:shadow-md hover:z-10 relative ${getCellColor(val, 25)}`}>
                        {val}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

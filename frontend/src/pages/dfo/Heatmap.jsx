import { useState, useEffect } from 'react'
import { api } from '../../api'

const LEAKAGE_TYPES = ['DECEASED', 'DUPLICATE', 'UNDRAWN', 'CROSS_SCHEME']

export default function Heatmap() {
  const [matrix, setMatrix] = useState(null)
  const [districts, setDistricts] = useState([])
  const [maxVal, setMaxVal] = useState(1)
  const [loading, setLoading] = useState(true)
  const [totalAtRisk, setTotalAtRisk] = useState(0)

  useEffect(() => {
    Promise.all([api.getFlags(), api.getStats()])
      .then(([flagsRes, statsRes]) => {
        const flags = flagsRes.data
        const stats = statsRes.data

        // Build a real 2D matrix: { district -> { leakage_type -> count } }
        const grid = {}
        let highest = 0

        for (const flag of flags) {
          const d = flag.district || 'Unknown'
          const lt = flag.leakage_type
          if (!grid[d]) grid[d] = {}
          grid[d][lt] = (grid[d][lt] || 0) + 1
          if (grid[d][lt] > highest) highest = grid[d][lt]
        }

        // Sort districts by total flags descending, take top 15
        const sortedDistricts = Object.entries(grid)
          .map(([name, types]) => ({
            name,
            total: Object.values(types).reduce((s, v) => s + v, 0),
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 15)
          .map((d) => d.name)

        setMatrix(grid)
        setDistricts(sortedDistricts)
        setMaxVal(highest || 1)
        setTotalAtRisk(stats.total_amount_at_risk || 0)
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  const getCellColor = (val, max) => {
    if (!val || val === 0) return 'bg-surface-low text-text-secondary'
    const intensity = val / max
    if (intensity < 0.2) return 'bg-red-100 text-red-900'
    if (intensity < 0.4) return 'bg-red-200 text-red-900'
    if (intensity < 0.6) return 'bg-red-300 text-red-900'
    if (intensity < 0.8) return 'bg-red-500 text-white'
    return 'bg-risk-critical text-white'
  }

  if (loading) return <div className="p-8 text-text-secondary font-data">Loading heatmap...</div>
  if (!matrix || districts.length === 0) return <div className="p-8 text-text-secondary font-data">Run analysis first to generate heatmap.</div>

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold font-sans text-text-primary tracking-tight mb-2">Risk Matrix Heatmap</h1>
      <p className="text-sm text-text-secondary mb-8 font-data">
        District × Leakage Type — {districts.length} highest-risk districts · ₹{(totalAtRisk / 100000).toFixed(1)}L at risk
      </p>

      <div className="bg-surface-lowest rounded-lg shadow-sm p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-xs font-bold text-text-secondary uppercase tracking-widest font-sans">District</th>
              {LEAKAGE_TYPES.map((type) => (
                <th key={type} className="p-3 text-xs font-bold text-text-secondary uppercase tracking-widest text-center font-sans">
                  {type.replace('_', ' ')}
                </th>
              ))}
              <th className="p-3 text-xs font-bold text-text-secondary uppercase tracking-widest text-center font-sans">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((district) => {
              const row = matrix[district] || {}
              const rowTotal = LEAKAGE_TYPES.reduce((s, t) => s + (row[t] || 0), 0)
              return (
                <tr key={district}>
                  <td className="p-3 text-sm font-bold text-text-primary font-sans">{district}</td>
                  {LEAKAGE_TYPES.map((type) => {
                    const val = row[type] || 0
                    return (
                      <td key={type} className="p-1">
                        <div
                          className={`w-full h-10 flex items-center justify-center font-mono text-sm font-bold rounded-sm cursor-default transition-all hover:scale-105 hover:shadow-md hover:z-10 relative ${getCellColor(val, maxVal)}`}
                        >
                          {val}
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-1">
                    <div className="w-full h-10 flex items-center justify-center font-mono text-sm font-bold rounded-sm bg-surface-low text-text-primary">
                      {rowTotal}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-xs font-data text-text-secondary">
        <span className="font-bold uppercase tracking-wider">Intensity:</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded-sm bg-surface-low" />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded-sm bg-red-100" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded-sm bg-red-300" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded-sm bg-red-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-4 rounded-sm bg-risk-critical" />
          <span>Critical</span>
        </div>
      </div>
    </div>
  )
}

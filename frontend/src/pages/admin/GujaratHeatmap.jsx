import { useState } from 'react'
import { mockDistrictStats } from '../../mock/adminMock'
import { X, TrendingUp } from 'lucide-react'

// SVG viewBox: 0 0 800 700
// Simplified but geographically representative paths for Gujarat's 33 districts
// Each path corresponds to one district polygon
const GUJARAT_DISTRICTS = [
  { id: 'Kutch',            label: 'Kutch',            path: 'M 30,30 L 200,30 L 230,80 L 210,130 L 170,150 L 120,140 L 70,110 L 30,80 Z' },
  { id: 'Banaskantha',      label: 'Banaskantha',      path: 'M 235,30 L 330,30 L 345,70 L 330,110 L 295,120 L 255,110 L 235,80 Z' },
  { id: 'Patan',            label: 'Patan',             path: 'M 235,80 L 295,80 L 300,120 L 270,145 L 240,130 L 230,110 Z' },
  { id: 'Mehsana',          label: 'Mehsana',           path: 'M 295,80 L 345,70 L 360,110 L 350,145 L 310,150 L 300,120 Z' },
  { id: 'Sabarkantha',      label: 'Sabarkantha',      path: 'M 345,30 L 430,40 L 430,100 L 400,120 L 360,110 L 345,70 Z' },
  { id: 'Aravalli',         label: 'Aravalli',          path: 'M 360,110 L 400,120 L 415,155 L 390,175 L 360,165 L 350,145 Z' },
  { id: 'Gandhinagar',      label: 'Gandhinagar',      path: 'M 310,150 L 350,145 L 360,165 L 345,185 L 315,185 L 305,170 Z' },
  { id: 'Ahmedabad',        label: 'Ahmedabad',        path: 'M 270,145 L 310,150 L 305,170 L 315,185 L 300,220 L 265,225 L 248,200 L 250,165 Z' },
  { id: 'Anand',            label: 'Anand',             path: 'M 315,185 L 345,185 L 360,165 L 390,175 L 395,210 L 370,225 L 340,220 L 315,205 Z' },
  { id: 'Kheda',            label: 'Kheda',             path: 'M 300,220 L 315,205 L 340,220 L 345,240 L 320,260 L 295,255 L 285,240 Z' },
  { id: 'Mahisagar',        label: 'Mahisagar',        path: 'M 370,225 L 395,210 L 415,230 L 410,260 L 385,270 L 360,255 L 345,240 L 360,225 Z' },
  { id: 'Panch Mahals',     label: 'Panch Mahals',     path: 'M 390,175 L 430,100 L 460,110 L 465,155 L 445,180 L 415,185 Z' },
  { id: 'Dahod',            label: 'Dahod',             path: 'M 430,100 L 490,90 L 500,130 L 480,165 L 460,170 L 445,155 L 465,135 Z' },
  { id: 'Vadodara',         label: 'Vadodara',         path: 'M 395,210 L 415,185 L 445,180 L 465,200 L 460,240 L 435,255 L 410,250 L 400,235 Z' },
  { id: 'Chhota Udaipur',  label: 'Chhota Udaipur',  path: 'M 445,180 L 465,155 L 480,165 L 500,175 L 495,215 L 475,225 L 455,215 Z' },
  { id: 'Narmada',          label: 'Narmada',           path: 'M 435,255 L 455,240 L 475,250 L 480,275 L 460,290 L 440,280 Z' },
  { id: 'Bharuch',          label: 'Bharuch',           path: 'M 385,270 L 410,260 L 435,255 L 440,280 L 430,310 L 405,310 L 385,295 Z' },
  { id: 'Surat',            label: 'Surat',             path: 'M 360,295 L 385,295 L 405,310 L 400,345 L 375,360 L 348,345 L 345,320 Z' },
  { id: 'Tapi',             label: 'Tapi',              path: 'M 430,310 L 480,310 L 490,340 L 470,360 L 445,355 L 420,340 L 410,320 Z' },
  { id: 'Navsari',          label: 'Navsari',           path: 'M 345,360 L 375,360 L 390,385 L 375,410 L 350,415 L 335,395 Z' },
  { id: 'Dang',             label: 'Dang',              path: 'M 470,360 L 495,350 L 510,375 L 495,400 L 470,395 L 455,375 Z' },
  { id: 'Valsad',           label: 'Valsad',            path: 'M 335,415 L 360,415 L 375,440 L 360,460 L 335,455 L 320,440 Z' },
  { id: 'Surendranagar',    label: 'Surendranagar',    path: 'M 170,150 L 235,155 L 240,190 L 215,210 L 180,205 L 160,185 L 155,165 Z' },
  { id: 'Morbi',            label: 'Morbi',             path: 'M 120,140 L 170,150 L 155,165 L 155,195 L 125,195 L 105,175 L 100,155 Z' },
  { id: 'Rajkot',           label: 'Rajkot',            path: 'M 100,195 L 155,195 L 165,225 L 150,260 L 115,260 L 95,240 Z' },
  { id: 'Devbhoomi Dwarka', label: 'Dwarka',            path: 'M 30,155 L 95,155 L 100,195 L 70,210 L 35,200 L 25,175 Z' },
  { id: 'Jamnagar',         label: 'Jamnagar',         path: 'M 30,80 L 70,110 L 120,140 L 100,155 L 30,155 Z' },
  { id: 'Porbandar',        label: 'Porbandar',        path: 'M 35,210 L 65,210 L 80,235 L 65,255 L 40,255 L 25,235 Z' },
  { id: 'Junagadh',         label: 'Junagadh',         path: 'M 80,255 L 115,260 L 120,290 L 105,315 L 75,315 L 60,295 L 65,270 Z' },
  { id: 'Gir Somnath',     label: 'Gir Somnath',     path: 'M 75,315 L 105,315 L 120,340 L 110,370 L 80,370 L 62,345 Z' },
  { id: 'Amreli',           label: 'Amreli',            path: 'M 120,260 L 160,255 L 175,280 L 165,315 L 135,325 L 115,310 L 120,285 Z' },
  { id: 'Bhavnagar',        label: 'Bhavnagar',        path: 'M 175,280 L 210,270 L 230,295 L 225,335 L 195,345 L 170,330 L 165,305 Z' },
  { id: 'Botad',            label: 'Botad',             path: 'M 150,260 L 180,260 L 195,280 L 185,305 L 155,305 L 140,285 Z' },
]

const statByDistrict = Object.fromEntries(mockDistrictStats.map(d => [d.district, d]))

function getColor(flags, max) {
  if (flags === 0) return '#e8f0e8'
  const ratio = flags / max
  if (ratio < 0.15) return '#bbf7d0'  // light green
  if (ratio < 0.30) return '#86efac'  // green
  if (ratio < 0.45) return '#fde68a'  // yellow
  if (ratio < 0.60) return '#fdba74'  // orange
  if (ratio < 0.75) return '#f87171'  // light red
  return '#dc2626'                      // deep red
}

export default function GujaratHeatmap() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  const maxFlags = Math.max(...mockDistrictStats.map(d => d.total_flags))
  const totalFlags = mockDistrictStats.reduce((s, d) => s + d.total_flags, 0)
  const totalRisk = mockDistrictStats.reduce((s, d) => s + d.amount_at_risk, 0)

  const selectedData = selected ? statByDistrict[selected] : null

  return (
    <div className="p-8 pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Gujarat Risk Heatmap</h1>
          <p className="text-sm text-text-secondary mt-1 font-data">
            Statewide DBT leakage distribution · Click a district for breakdown
          </p>
        </div>
        <div className="flex gap-4">
          {[
            { label: 'Total Flags', value: totalFlags, color: 'text-risk-critical' },
            { label: 'Amount at Risk', value: `₹${(totalRisk / 100000).toFixed(1)}L`, color: 'text-text-primary' },
            { label: 'Districts Affected', value: mockDistrictStats.filter(d => d.total_flags > 0).length, color: 'text-text-primary' },
          ].map((s, i) => (
            <div key={i} className="px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-center min-w-[110px]">
              <p className={`text-2xl font-bold font-sans ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-secondary font-data">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* SVG Map */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 relative">
          <svg viewBox="0 0 540 490" className="w-full h-auto max-h-[600px]">
            {GUJARAT_DISTRICTS.map(district => {
              const data = statByDistrict[district.id]
              const flags = data?.total_flags ?? 0
              const fill = getColor(flags, maxFlags)
              const isSelected = selected === district.id
              const isHovered = hovered === district.id

              return (
                <g key={district.id}>
                  <path
                    d={district.path}
                    fill={fill}
                    stroke={isSelected ? '#1B3A5B' : '#ffffff'}
                    strokeWidth={isSelected ? 2.5 : 1}
                    className="district-path"
                    style={{
                      opacity: isHovered ? 0.8 : 1,
                      filter: isSelected ? 'drop-shadow(0 2px 8px rgba(27,58,91,0.4))' : isHovered ? 'brightness(1.1)' : 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelected(selected === district.id ? null : district.id)}
                    onMouseEnter={() => setHovered(district.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  {/* District label */}
                  {(() => {
                    // Compute centroid of path for label positioning (simplified)
                    const nums = district.path.match(/[\d.]+/g)?.map(Number) || []
                    const xs = nums.filter((_, i) => i % 2 === 0)
                    const ys = nums.filter((_, i) => i % 2 === 1)
                    const cx = xs.reduce((a, b) => a + b, 0) / xs.length
                    const cy = ys.reduce((a, b) => a + b, 0) / ys.length
                    return (
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="7"
                        fontFamily="Inter, sans-serif"
                        fontWeight="600"
                        fill={flags >= maxFlags * 0.6 ? '#fff' : '#334155'}
                        pointerEvents="none"
                        style={{ userSelect: 'none' }}
                      >
                        {district.label.length > 10 ? district.label.slice(0, 9) + '…' : district.label}
                      </text>
                    )
                  })()}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-2 px-2">
            <span className="text-xs text-text-secondary font-data">Low risk</span>
            {['#bbf7d0', '#86efac', '#fde68a', '#fdba74', '#f87171', '#dc2626'].map(c => (
              <div key={c} className="w-7 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span className="text-xs text-text-secondary font-data">High risk</span>
          </div>
        </div>

        {/* Side panel */}
        <div className="w-80 flex-shrink-0">
          {selectedData ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 className="font-bold text-text-primary font-sans">{selectedData.district}</h3>
                  <p className="text-xs text-text-secondary font-data mt-0.5">{selectedData.beneficiaries.toLocaleString()} beneficiaries</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Total flags */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-text-secondary font-data">Total Flags</p>
                    <p className="text-4xl font-bold font-sans" style={{
                      color: selectedData.total_flags >= 18 ? '#dc2626' : selectedData.total_flags >= 10 ? '#f97316' : selectedData.total_flags >= 5 ? '#eab308' : '#16a34a'
                    }}>{selectedData.total_flags}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary font-data">Amount at Risk</p>
                    <p className="text-lg font-bold font-mono text-text-primary">₹{(selectedData.amount_at_risk / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="px-5 py-4 space-y-3">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest font-data">Leakage Breakdown</p>
                {[
                  { label: 'Deceased Beneficiary', value: selectedData.deceased, color: '#E63946', bg: '#fff1f2' },
                  { label: 'Duplicate Identity',   value: selectedData.duplicate, color: '#F5A623', bg: '#fffbeb' },
                  { label: 'Undrawn Funds',         value: selectedData.undrawn,  color: '#EAB308', bg: '#fefce8' },
                  { label: 'Cross-Scheme',          value: selectedData.cross_scheme, color: '#3B82F6', bg: '#eff6ff' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-secondary font-data">{item.label}</span>
                        <span className="text-xs font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${selectedData.total_flags > 0 ? (item.value / selectedData.total_flags) * 100 : 0}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary font-data">
                  <TrendingUp size={12} />
                  <span>Ranks #{mockDistrictStats.sort((a,b) => b.total_flags - a.total_flags).findIndex(d => d.district === selectedData.district) + 1} out of 33 districts by risk</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center h-64">
              <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                <svg viewBox="0 0 540 490" className="w-7 h-7"><path d="M 270 30 L 400 100 L 400 300 L 270 370 L 140 300 L 140 100 Z" fill="#7C3AED" opacity="0.3" /></svg>
              </div>
              <p className="text-sm font-bold text-text-primary mb-1">Click a district</p>
              <p className="text-xs text-text-secondary font-data">Select any district on the map to view its detailed leakage breakdown and risk analysis.</p>
            </div>
          )}

          {/* Top 5 districts table */}
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest font-data">Top 5 High-Risk Districts</p>
            </div>
            {[...mockDistrictStats]
              .sort((a, b) => b.total_flags - a.total_flags)
              .slice(0, 5)
              .map((d, i) => (
                <button
                  key={d.district}
                  onClick={() => setSelected(d.district)}
                  className={`w-full flex items-center gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${selected === d.district ? 'bg-violet-50' : ''}`}
                >
                  <span className="text-sm font-bold font-mono text-text-secondary w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary font-sans truncate">{d.district}</p>
                    <p className="text-xs text-text-secondary font-data">₹{(d.amount_at_risk / 1000).toFixed(0)}K at risk</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-risk-critical">{d.total_flags}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

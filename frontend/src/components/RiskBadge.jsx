export function RiskBadge({ label }) {
  const cfg = {
    CRITICAL: 'bg-risk-critical text-white',
    HIGH: 'bg-risk-high text-white',
    MEDIUM: 'bg-risk-medium text-black',
    LOW: 'bg-risk-low text-white',
  }[label] || 'bg-surface-low text-text-primary'

  return (
    <span className={`px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider rounded-full ${cfg}`}>
      {label}
    </span>
  )
}

export function LeakageBadge({ type }) {
  const cfg = {
    DECEASED: { label: 'Deceased Beneficiary', cls: 'bg-leakage-deceased text-white' },
    DUPLICATE: { label: 'Duplicate Identity', cls: 'bg-leakage-duplicate text-black' },
    UNDRAWN: { label: 'Undrawn Funds', cls: 'bg-leakage-undrawn text-black' },
    CROSS_SCHEME: { label: 'Cross-Scheme Stacking', cls: 'bg-leakage-cross text-black' },
  }[type] || { label: type, cls: 'bg-surface-low text-text-primary' }

  return (
    <span className={`px-3 py-1 text-xs font-sans font-semibold rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

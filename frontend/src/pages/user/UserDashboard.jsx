import { useState, useRef, useEffect } from 'react'
import { CheckCircle, Clock, AlertTriangle, FileCheck, ChevronRight, RefreshCw, Shield, Camera, User, Phone, MapPin, CreditCard, X, Loader2, Check } from 'lucide-react'
import { getUser, renewKYC } from '../../api'

const SCHEME_NEWS = [
  { id: 1, title: 'Namo Lakshmi Yojana — Extended Application Window', date: '2026-04-10', tag: 'NEW', body: 'The application deadline for NLY 2025-26 has been extended to 30 April 2026. Eligible girl students in classes 9–12 can now apply.' },
  { id: 2, title: 'MGMS Disbursement Date Announced', date: '2026-04-05', tag: 'UPDATE', body: 'Merit scholarship payments for AY 2025-26 will be credited on 1 May 2026. Ensure your bank details are confirmed.' },
  { id: 3, title: 'KYC Renewal Reminder', date: '2026-03-28', tag: 'REMINDER', body: 'Beneficiaries must renew their KYC before the expiry date to continue receiving benefits. OTP-based verification is now available.' },
  { id: 4, title: 'New Scheme — Namo Saraswati Vigyan Sadhana Yojana', date: '2026-03-15', tag: 'NEW', body: 'A new annual scholarship of ₹10,000 for girl students pursuing Science stream in std 11–12 is now open for registration.' },
]

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PENDING_VERIFICATION: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
}

const TAG_CONFIG = {
  NEW: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-violet-100 text-violet-700',
  REMINDER: 'bg-orange-100 text-orange-700',
}

// ─── KYC Modal ─────────────────────────────────────────────────────────────────
function KYCModal({ user, onClose, onComplete }) {
  const [step, setStep] = useState(1) // 1 = review info, 2 = face scan, 3 = done
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const intervalRef = useRef(null)

  const startScan = () => {
    setScanning(true)
    setScanProgress(0)
    intervalRef.current = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current)
          setScanning(false)
          setStep(3)
          return 100
        }
        return p + 3
      })
    }, 50)
  }

  const INFO_ROWS = [
    { icon: User, label: 'Full Name', value: user.full_name },
    { icon: CreditCard, label: 'Aadhaar', value: user.aadhaar_display },
    { icon: Phone, label: 'Mobile', value: user.phone },
    { icon: MapPin, label: 'Address', value: `${user.demographics.taluka}, ${user.demographics.district}` },
    { icon: Shield, label: 'Category', value: user.demographics.category },
    { icon: CreditCard, label: 'Bank Account', value: `${user.bank.bank} · ${user.bank.account_display}` },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-primary-override" />
            <div>
              <h2 className="font-bold text-text-primary font-sans text-sm">KYC Renewal</h2>
              <p className="text-xs text-text-secondary font-data">Step {step} of 3</p>
            </div>
          </div>
          {step !== 2 && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 pt-4 pb-1">
          {['Verify Info', 'Face Scan', 'Complete'].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-full flex flex-col items-center`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                  step > i + 1 ? 'bg-emerald-500 text-white' :
                  step === i + 1 ? 'bg-primary-override text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step > i + 1 ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[10px] font-data ${step === i + 1 ? 'text-primary-override font-bold' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-1 mb-5 ${step > i + 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Review info */}
        {step === 1 && (
          <div className="px-6 py-5">
            <p className="text-sm font-data text-text-secondary mb-4 leading-relaxed">
              Please review your registered information below. If anything is incorrect, contact your DFO office before proceeding.
            </p>
            <div className="space-y-3 mb-6">
              {INFO_ROWS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <Icon size={16} className="text-text-secondary flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span className="text-xs text-text-secondary font-data">{label}</span>
                    <span className="text-sm font-bold text-text-primary font-sans">{value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-sm font-semibold text-text-secondary rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-primary-override text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-all">
                Confirm & Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Face scan */}
        {step === 2 && (
          <div className="px-6 py-6 flex flex-col items-center">
            <p className="text-sm font-data text-text-secondary mb-6 text-center">
              Position your face within the frame and hold still. The system will verify your identity automatically.
            </p>

            {/* Camera simulation */}
            <div className="relative w-56 h-56 rounded-2xl overflow-hidden bg-gray-900 mb-6">
              {/* Simulated camera feed */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center">
                  <User size={48} className="text-gray-500" />
                </div>
              </div>

              {/* Scanning overlay */}
              {scanning && (
                <>
                  <div className="absolute inset-0 bg-emerald-500/10" />
                  {/* Scan line */}
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.8)]"
                    style={{ top: `${scanProgress}%`, transition: 'top 0.05s linear' }}
                  />
                </>
              )}

              {/* Corner brackets */}
              {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                <div key={i} className={`absolute w-6 h-6 ${pos} border-emerald-400`} style={{
                  borderTopWidth: i < 2 ? 2 : 0,
                  borderBottomWidth: i >= 2 ? 2 : 0,
                  borderLeftWidth: i % 2 === 0 ? 2 : 0,
                  borderRightWidth: i % 2 === 1 ? 2 : 0,
                }} />
              ))}

              {/* Progress */}
              {scanning && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <span className="text-xs font-mono text-emerald-300 bg-black/50 px-2 py-0.5 rounded-full">
                    {scanProgress}% scanned…
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {scanning && (
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${scanProgress}%` }} />
              </div>
            )}

            <button
              onClick={startScan}
              disabled={scanning}
              className="w-full py-3 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all text-sm"
            >
              {scanning ? (
                <><Loader2 size={16} className="animate-spin" /> Scanning face…</>
              ) : (
                <><Camera size={16} /> Start Face Verification</>
              )}
            </button>

            <button onClick={onClose} disabled={scanning} className="mt-2 text-xs text-text-secondary hover:text-text-primary font-data transition-colors">
              Cancel
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="px-6 py-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-text-primary font-sans mb-1">KYC Successfully Renewed!</h3>
            <p className="text-sm text-text-secondary font-data leading-relaxed mb-6">
              Your identity has been verified. Your KYC is now valid for the next 90 days.
              <span className="block mt-1 font-bold text-emerald-600">New expiry: {new Date(Date.now() + 90 * 86400000).toLocaleDateString('en-IN')}</span>
            </p>
            <button
              onClick={() => { onComplete(); onClose() }}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── KYC Card ──────────────────────────────────────────────────────────────────
function KYCCard({ kyc, onOpenModal }) {
  const { is_kyc_compliant, days_remaining, kyc_expiry_date, last_kyc_date } = kyc
  const isExpiringSoon = days_remaining <= 14
  const isExpired = days_remaining <= 0

  return (
    <div className={`rounded-xl p-5 border-2 ${isExpired ? 'border-risk-critical bg-red-50' : isExpiringSoon ? 'border-yellow-400 bg-yellow-50' : 'border-emerald-300 bg-emerald-50'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={20} className={isExpired ? 'text-risk-critical' : isExpiringSoon ? 'text-yellow-600' : 'text-emerald-600'} />
          <h3 className="font-bold text-text-primary font-sans text-sm">KYC Status</h3>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${is_kyc_compliant && !isExpired ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-risk-critical text-white border-risk-critical'}`}>
          {isExpired ? 'EXPIRED' : is_kyc_compliant ? 'VERIFIED' : 'NOT VERIFIED'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 font-data text-sm">
        <div><p className="text-xs text-text-secondary mb-0.5">Last Verified</p><p className="font-bold text-text-primary">{last_kyc_date}</p></div>
        <div><p className="text-xs text-text-secondary mb-0.5">Expires On</p><p className={`font-bold ${isExpiringSoon ? 'text-yellow-700' : 'text-text-primary'}`}>{kyc_expiry_date}</p></div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isExpiringSoon ? 'bg-yellow-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.max(0, (days_remaining / 90) * 100)}%` }} />
        </div>
        <p className="text-xs text-text-secondary font-data mt-1">
          {days_remaining} of 90 days remaining
          {isExpiringSoon && !isExpired && ' — Renewal recommended!'}
        </p>
      </div>

      <button
        onClick={onOpenModal}
        className={`w-full py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
          isExpired ? 'bg-risk-critical text-white hover:bg-red-700'
          : isExpiringSoon ? 'bg-yellow-600 text-white hover:bg-yellow-700'
          : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
        }`}
      >
        <RefreshCw size={14} />
        {isExpired ? 'Renew KYC Now (Required)' : isExpiringSoon ? 'Renew KYC Soon' : 'Update KYC'}
      </button>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showKYCModal, setShowKYCModal] = useState(false)
  const [kycDone, setKycDone] = useState(false)
  const [readNews, setReadNews] = useState(new Set())

  useEffect(() => {
    getUser('USR-GJ-001').then(data => {
      setUser(data)
      setLoading(false)
    })
  }, [])

  const handleKYCComplete = async () => {
    if (user) {
      const res = await renewKYC(user.user_id, user.kyc_profile?.dynamic_validity_days || 90)
      if (res?.success) {
        setUser(prev => ({
          ...prev,
          kyc_profile: { ...prev.kyc_profile, ...res, is_kyc_compliant: true },
        }))
      }
    }
    setKycDone(true)
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 size={28} className="animate-spin text-primary-override" />
          <p className="text-sm font-data">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 pb-20 font-sans max-w-6xl mx-auto">
      {/* KYC Modal */}
      {showKYCModal && (
        <KYCModal
          user={user}
          onClose={() => setShowKYCModal(false)}
          onComplete={handleKYCComplete}
        />
      )}

      {/* Greeting */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Welcome, {user.full_name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-data">
            {user.user_id} · {user.demographics.taluka}, {user.demographics.district} · DBT Beneficiary Portal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* LEFT: KYC + Scheme Tracker */}
        <div className="col-span-2 space-y-6">
          {/* KYC Card */}
          {kycDone ? (
            <div className="rounded-xl p-5 border-2 border-emerald-300 bg-emerald-50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-emerald-700">KYC Successfully Renewed</p>
                <p className="text-xs text-emerald-600 font-data">Valid for 90 days. You're fully verified.</p>
              </div>
            </div>
          ) : (
            <KYCCard kyc={user.kyc_profile} onOpenModal={() => setShowKYCModal(true)} />
          )}

          {/* Scheme Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-text-primary font-sans">My Scheme Applications</h2>
              <span className="text-xs text-text-secondary font-data">{user.registered_schemes.length} registered</span>
            </div>
            <div className="divide-y divide-gray-50">
              {user.registered_schemes.map(scheme => {
                const cfg = STATUS_CONFIG[scheme.status] || STATUS_CONFIG.ACTIVE
                return (
                  <div key={scheme.scheme_id} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          <span className="text-xs text-text-secondary font-mono">{scheme.scheme_id}</span>
                        </div>
                        <h3 className="font-bold text-text-primary text-sm leading-snug">{scheme.name}</h3>
                        <p className="text-xs text-text-secondary font-data mt-1">Registered: {scheme.registration_date}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-text-primary font-sans">₹{scheme.amount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-text-secondary font-data">Annual benefit</p>
                      </div>
                    </div>

                    {/* Status timeline */}
                    <div className="mt-4 flex items-center gap-1.5">
                      {[
                        { label: 'Applied', done: true },
                        { label: 'Verified', done: scheme.status !== 'PENDING_VERIFICATION' },
                        { label: 'Active', done: scheme.status === 'ACTIVE' },
                        { label: 'Payment', done: !!scheme.last_payment },
                      ].map((s, i, arr) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${s.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {s.done ? '✓' : i + 1}
                          </div>
                          <span className={`text-[10px] font-data ${s.done ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>{s.label}</span>
                          {i < arr.length - 1 && <div className={`h-px w-3 ${s.done && arr[i+1].done ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                        </div>
                      ))}
                    </div>

                    {scheme.next_payment && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-data bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                        <Clock size={11} /> Next payment expected: {scheme.next_payment}
                      </div>
                    )}
                    {scheme.status === 'PENDING_VERIFICATION' && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-yellow-700 font-data bg-yellow-50 px-3 py-1.5 rounded-lg w-fit">
                        <AlertTriangle size={11} /> Under review — A scheme verifier will contact you shortly.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Scheme News + Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-text-primary font-sans text-sm">Scheme News & Updates</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {SCHEME_NEWS.map(news => {
                const isRead = readNews.has(news.id)
                return (
                  <button key={news.id} onClick={() => setReadNews(s => new Set([...s, news.id]))}
                    className={`w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors ${isRead ? 'opacity-55' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TAG_CONFIG[news.tag] || 'bg-gray-100 text-gray-600'}`}>{news.tag}</span>
                      <span className="text-[10px] font-mono text-text-secondary">{news.date}</span>
                    </div>
                    <p className="text-sm font-bold font-sans text-text-primary leading-snug mb-1">{news.title}</p>
                    <p className="text-xs text-text-secondary font-data leading-relaxed line-clamp-2">{news.body}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest font-data">Quick Actions</p>
            </div>
            {[
              { label: 'Check Scheme Eligibility', icon: FileCheck },
              { label: 'Update Bank Details', icon: RefreshCw },
              { label: 'Contact DFO Office', icon: Phone },
            ].map((a, i) => {
              const Icon = a.icon
              return (
                <button key={i} className="w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-text-primary font-sans">
                    <Icon size={15} className="text-text-secondary" /> {a.label}
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

import { Shield, KeyRound, UserCircle } from 'lucide-react'

export default function Login({ onLogin }) {
  return (
    <div className="min-h-screen bg-shell flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full p-8 bg-surface-lowest rounded-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-override to-blue-400"></div>
        
        <div className="flex flex-col items-center mb-8">
          <Shield className="text-primary-override mb-4" size={56} strokeWidth={2} />
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">EduGuard Intelligence</h1>
          <p className="text-xs font-data text-text-secondary mt-1 uppercase tracking-widest">Government of Gujarat</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onLogin('dfo'); }} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Select Authority Role</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <select className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 text-sm font-bold text-text-primary rounded-sm appearance-none outline-none focus:ring-2 focus:ring-primary-override focus:border-transparent transition-all cursor-pointer">
                <option value="dfo">District Finance Officer (DFO)</option>
                <option value="state_auditor">State Auditor</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Security Clearance Key</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="password" 
                defaultValue="admin123"
                className="w-full pl-10 pr-4 py-3 bg-surface border border-gray-200 text-sm font-mono text-text-primary rounded-sm outline-none focus:ring-2 focus:ring-primary-override focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button type="submit" className="w-full mt-8 py-3.5 bg-gradient-to-b from-primary-override to-shell text-white text-sm font-bold uppercase tracking-widest rounded-sm shadow-md hover:shadow-xl hover:from-blue-900 transition-all flex justify-center items-center gap-2">
            Authenticate Session
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center text-[10px] font-mono text-text-secondary uppercase leading-relaxed">
          Warning: Unauthorized access is strictly prohibited under the IT Act 2000. All activities are monitored and logged.
        </div>
      </div>
    </div>
  )
}

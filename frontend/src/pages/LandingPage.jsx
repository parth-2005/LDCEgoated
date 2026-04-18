import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-shell flex flex-col font-sans">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-primary-override">
          <Shield size={32} />
          <span className="text-xl font-bold tracking-tight text-text-primary">EduGuard Intelligence</span>
        </div>
        <Link to="/login" className="px-6 py-2.5 bg-primary-override text-white text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-blue-900 transition-colors shadow-sm">
          Portal Login
        </Link>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 mt-[-80px]">
        <h1 className="text-5xl font-extrabold text-text-primary mb-6 tracking-tight max-w-3xl">
          Securing the Future of Education Funding
        </h1>
        <p className="text-lg text-text-secondary mb-10 max-w-2xl leading-relaxed">
          The Direct Benefit Transfer (DBT) verification and auditing platform for the Government of Gujarat. 
          Ensuring transparency, accountability, and proper disbursement of educational funds.
        </p>
        <Link to="/login" className="px-8 py-4 bg-gradient-to-b from-primary-override to-shell text-white text-base font-bold uppercase tracking-widest rounded-sm shadow-md hover:shadow-xl hover:from-blue-900 transition-all flex justify-center items-center gap-2">
          Access Authority Dashboard
        </Link>
      </main>
    </div>
  )
}

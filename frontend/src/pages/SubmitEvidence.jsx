import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, MapPin, UploadCloud } from 'lucide-react'

export default function SubmitEvidence() {
  const [searchParams] = useSearchParams()
  const caseId = searchParams.get('caseId') || "CASE-UNKNOWN"
  const navigate = useNavigate()
  
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      alert("Evidence submitted successfully. Awaiting AI Verification.")
      navigate('/scheme-verifier')
    }, 1500)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto font-sans">
      <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">Submit Field Evidence</h1>
      <p className="text-sm font-data text-text-secondary mb-8">Case ID: <span className="font-mono text-primary-override">{caseId}</span></p>

      <form onSubmit={handleSubmit} className="bg-surface-lowest p-6 rounded-sm shadow-sm border border-gray-200 space-y-6">
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">GPS Tagged Photo</label>
          <div className="border-2 border-dashed border-gray-300 rounded-sm p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
            <Camera size={32} className="text-gray-400 mb-3" />
            <p className="text-sm font-bold text-text-primary">Click to take a photo or upload</p>
            <p className="text-xs text-text-secondary mt-1">EXIF GPS data will be automatically extracted.</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm flex items-start gap-3">
          <MapPin className="text-blue-600 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-blue-900">Live GPS Lock Active</h4>
            <p className="text-xs text-blue-700 mt-1">Lat: 23.0225, Lng: 72.5714 (Accuracy: 4 meters)</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Verifier Notes</label>
          <textarea 
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-surface border border-gray-200 text-sm text-text-primary rounded-sm outline-none focus:ring-2 focus:ring-primary-override min-h-[100px]"
            placeholder="Enter observations from the field visit..."
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 bg-primary-override text-white text-sm font-bold uppercase tracking-widest rounded-sm shadow-md hover:bg-blue-900 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? 'Uploading & Analyzing...' : <><UploadCloud size={18} /> Submit for AI Verification</>}
        </button>
      </form>
    </div>
  )
}

import { X } from 'lucide-react'

export const ErrorComponent = ({ error }: { error: string | null }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-red-500/25 flex items-center justify-center text-red-400">
          <X className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-red-400 font-bold text-base">
            Data Loading Failed
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
            {error}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
        >
          Reload Application
        </button>
      </div>
    </div>
  )
}

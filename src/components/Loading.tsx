import { Loader2 } from 'lucide-react'

export const LoadingComponent = ({
  loadingStatus,
}: {
  loadingStatus: string
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        </div>
        <div>
          <h3 className="text-white font-bold text-base">
            Loading WebGIS Data
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {loadingStatus}
          </p>
        </div>
      </div>
    </div>
  )
}

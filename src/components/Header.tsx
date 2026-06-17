import { Compass, LogOut } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export const Header = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('access_token')
    navigate({ to: '/login' })
  }

  return (
    <div className="p-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Compass className="h-5 w-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            WebGIS Client
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Transmission Line Viewer
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Live
        </span>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

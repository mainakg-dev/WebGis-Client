import { useNavigate } from '@tanstack/react-router'
import {
  Compass,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        // Sign Up request
        const signupRes = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        })

        if (!signupRes.ok) {
          const errData = await signupRes.json().catch(() => ({}))
          throw new Error(errData.message || 'Registration failed.')
        }
      }

      // Sign In request
      const signinRes = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      if (!signinRes.ok) {
        const errData = await signinRes.json().catch(() => ({}))
        throw new Error(errData.message || 'Invalid username or password.')
      }

      if (rememberMe) {
        localStorage.setItem('rememberedUser', username)
      }
      navigate({ to: '/' })
    } catch (err: any) {
      setError(err.message || 'Authentication failed.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* 1. Futuristic Animated Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse duration-[10000ms]" />

      {/* 2. Abstract Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      {/* 3. Main Login Card (Glassmorphic) */}
      <div className="relative w-full max-w-md mx-4 z-10 transition-all duration-300">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Card Top Glow Border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-purple-500 opacity-60" />

          {/* Logo / Title Area */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4 ring-1 ring-white/10">
              <Compass className="h-7 w-7 text-white animate-spin duration-[20s]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              GridSpur <span className="text-cyan-400">WebGIS</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Smart Monitoring & Operations Centre (SMOC)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold text-center flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 tracking-wide block">
                Username / Email
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 tracking-wide">
                  Password
                </label>
                {!isSignUp && (
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault()
                      alert(
                        'Please contact the SMOC administrator to reset your credentials.',
                      )
                    }}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 bg-slate-950 border border-slate-800 rounded text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-slate-900 focus:ring-2 accent-cyan-500"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 text-xs text-slate-400 select-none cursor-pointer font-medium"
              >
                Remember this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>
                    {isSignUp ? 'Creating Account...' : 'Authenticating...'}
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4.5 w-4.5 text-white" />
                  <span>
                    {isSignUp ? 'Register & Sign In' : 'Secure Sign In'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="text-center mt-6 text-xs text-slate-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              className="text-cyan-400 font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="text-center mt-6 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
          Demo Access: <span className="text-slate-400">admin</span> /{' '}
          <span className="text-slate-400">admin</span>
        </div>
      </div>
    </div>
  )
}

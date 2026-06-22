import { Link, useNavigate } from '@tanstack/react-router'
import {
  Globe,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useApp } from './AppContext'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export function MainHeader() {
  const { theme, language, toggleTheme, setLanguage } = useApp()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
        })
        if (res.ok) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (err) {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  const handleSignOut = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        setIsAuthenticated(false)
        window.location.href = '/'
      }
    } catch (err) {
      console.error('Signout failed:', err)
    }
  }

  // Translation dictionaries
  const t = {
    en: {
      home: 'Home',
      gisPortal: 'GIS Portal',
      contact: 'Contact Us',
      signIn: 'Sign In / Register',
      signOut: 'Sign Out',
      deptName: 'State Power Transmission Corporation Limited',
      govtName: 'A Government Undertaking',
    },
    hi: {
      home: 'मुख्य पृष्ठ',
      gisPortal: 'जीआईएस पोर्टल',
      contact: 'संपर्क करें',
      signIn: 'लॉग इन / पंजीकरण',
      signOut: 'लॉग आउट',
      deptName: 'राज्य विद्युत पारेषण निगम लिमिटेड',
      govtName: 'एक सरकारी उपक्रम',
    },
  }[language]

  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const element = document.getElementById('contact-section')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate({ to: '/' }).then(() => {
        setTimeout(() => {
          document
            .getElementById('contact-section')
            ?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 shadow-sm">
      {/* Top micro-bar for gov sites */}
      <div className="bg-slate-100 dark:bg-slate-950 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold tracking-wide flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.govtName}
            </span>
          </div>
          <div className="flex items-center gap-3 font-medium">
            <a
              href="https://india.gov.in"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-500 transition-colors"
            >
              National Portal of India
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a
              href="https://powermin.gov.in"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-500 transition-colors"
            >
              Ministry of Power
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Left Area: Logos and Title */}
          <div className="flex items-center gap-3">
            {/* PTCL Logo SVG */}
            <Link to="/" className="flex items-center gap-3 group">
              <svg
                className="w-12 h-12 text-blue-600 dark:text-cyan-400 group-hover:scale-105 transition-transform duration-300"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="fill-blue-50/50 dark:fill-slate-800/40"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                {/* Transmission Tower Graphic */}
                <path
                  d="M50 20 L30 80 M50 20 L70 80 M30 80 L70 80"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M40 50 L60 50 M35 65 L65 65 M45 35 L55 35"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                {/* Top Spark Dot */}
                <circle
                  cx="50"
                  cy="20"
                  r="3.5"
                  fill="#f59e0b"
                  className="animate-ping"
                />
                <circle cx="50" cy="20" r="2.5" fill="#f59e0b" />
              </svg>
              <div className="hidden md:flex flex-col">
                <span className="font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight text-lg group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  PTCL
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold max-w-[200px] leading-tight">
                  {t.deptName}
                </span>
              </div>
            </Link>

            {/* Separator line between PTCL and Digital India */}
            <div className="h-10 w-[1.5px] bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

            {/* Digital India Logo SVG */}
            <div className="hidden sm:flex items-center gap-2 select-none">
              <svg
                className="w-10 h-10"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Outer tricolor circle/swirl */}
                <path
                  d="M20 50 A30 30 0 0 1 80 50"
                  stroke="#f97316"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M80 50 A30 30 0 0 1 20 50"
                  stroke="#22c55e"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Chakra in center */}
                <circle
                  cx="50"
                  cy="50"
                  r="14"
                  stroke="#1d4ed8"
                  strokeWidth="2"
                />
                <circle cx="50" cy="50" r="4" fill="#1d4ed8" />
                {/* Spokes */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2={50 + 14 * Math.cos((i * Math.PI) / 4)}
                    y2={50 + 14 * Math.sin((i * Math.PI) / 4)}
                    stroke="#1d4ed8"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
              <div className="flex flex-col justify-center">
                <span className="text-xs font-black tracking-wider text-slate-700 dark:text-slate-300 leading-none">
                  Digital India
                </span>
                <span className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">
                  Power To Empower
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors py-2"
            >
              {t.home}
            </Link>

            <Link
              to="/map"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors py-2 flex items-center gap-1.5"
            >
              <LayoutGrid className="w-4 h-4 text-blue-500 dark:text-cyan-400" />
              {t.gisPortal}
            </Link>

            <a
              href="#contact"
              onClick={scrollToContact}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors py-2"
            >
              {t.contact}
            </a>

            <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-slate-800" />

            {/* Language Change Trigger */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:scale-95 transition-all"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Theme Change Trigger */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:scale-95 transition-all"
              title={
                theme === 'light'
                  ? 'Switch to Dark Mode'
                  : 'Switch to Light Mode'
              }
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-blue-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Signin / Register or Signout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/map"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.97] transition-all"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Go to Map</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 px-3.5 py-2 rounded-xl text-xs font-bold active:scale-[0.97] transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.signOut}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-[0.97] transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.signIn}</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Theme Change Trigger Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition-all"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-blue-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Language Change Trigger Mobile */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold active:scale-95 transition-all"
            >
              {language === 'en' ? 'HI' : 'EN'}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400"
          >
            {t.home}
          </Link>
          <Link
            to="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1.5"
          >
            <LayoutGrid className="w-4 h-4 text-blue-500" />
            {t.gisPortal}
          </Link>
          <a
            href="#contact"
            onClick={scrollToContact}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400"
          >
            {t.contact}
          </a>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/map"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Go to Map</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="w-full flex items-center justify-center gap-1.5 border border-rose-500/20 text-rose-500 dark:text-rose-400 px-4 py-2.5 rounded-xl text-sm font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.signOut}</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold"
              >
                <User className="w-4 h-4" />
                <span>{t.signIn}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

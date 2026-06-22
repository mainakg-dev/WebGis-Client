import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type Language = 'en' | 'hi' // English / Hindi

interface AppContextProps {
  theme: Theme
  language: Language
  toggleTheme: (event?: any) => void
  setLanguage: (lang: Language) => void
}

const AppContext = createContext<AppContextProps | undefined>(undefined)

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('optcl-theme') as Theme
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
      // Default to dark since original app has a dark aesthetic, but let user toggle
      return 'dark'
    }
    return 'dark'
  })

  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('optcl-lang') as Language
      if (savedLang === 'en' || savedLang === 'hi') return savedLang
      return 'en'
    }
    return 'en'
  })

  // Apply theme class to document element
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
    localStorage.setItem('optcl-theme', theme)
  }, [theme])

  const toggleTheme = (event?: any) => {
    const doc = document as any
    const isAppearanceTransition = doc.startViewTransition
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!isAppearanceTransition) {
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
      return
    }

    const x = event && typeof event.clientX === 'number' ? event.clientX : window.innerWidth / 2
    const y = event && typeof event.clientY === 'number' ? event.clientY : window.innerHeight / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = doc.startViewTransition(() => {
      setTheme((prev) => {
        const nextTheme = prev === 'light' ? 'dark' : 'light'
        const root = window.document.documentElement
        if (nextTheme === 'dark') {
          root.classList.add('dark')
          root.style.colorScheme = 'dark'
        } else {
          root.classList.remove('dark')
          root.style.colorScheme = 'light'
        }
        return nextTheme
      })
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
  }

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('optcl-lang', lang)
  }

  return (
    <AppContext.Provider value={{ theme, language, toggleTheme, setLanguage }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider')
  }
  return context
}

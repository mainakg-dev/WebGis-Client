import { LoginPage } from '#/pages/Login'
import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      })
      if (res.ok) {
        throw redirect({
          to: '/',
        })
      }
    } catch (err) {
      if (isRedirect(err)) {
        throw err
      }
      // If auth check fails, proceed to login page
    }
  },
  component: LoginPage,
})

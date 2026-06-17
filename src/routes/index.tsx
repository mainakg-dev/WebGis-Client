import MapComponent from '#/pages/Home'
import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
      })
      if (!res.ok) {
        throw redirect({
          to: '/login',
        })
      }
    } catch (err) {
      if (isRedirect(err)) {
        throw err
      }
      throw redirect({
        to: '/login',
      })
    }
  },
  component: MapComponent,
})

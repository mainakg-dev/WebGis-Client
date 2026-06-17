import MapComponent from '#/pages/Home'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      console.log('first')
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      if (isLoggedIn !== 'true') {
        throw redirect({
          to: '/login',
        })
      }
    }
  },
  component: MapComponent,
})

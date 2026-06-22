import { LandingPage } from '#/pages/Landing'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  ssr: false,
  component: LandingPage,
})

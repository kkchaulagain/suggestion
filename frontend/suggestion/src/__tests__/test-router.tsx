import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'

/** Future flags matching App.tsx BrowserRouter so tests don't trigger React Router deprecation warnings. */
const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const

type MemoryRouterProps = ComponentProps<typeof MemoryRouter>

/** MemoryRouter with v7 future flags enabled. Use in tests instead of raw MemoryRouter. */
export function TestRouter(props: MemoryRouterProps) {
  return <MemoryRouter {...props} future={ROUTER_FUTURE} />
}

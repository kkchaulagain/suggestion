import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from './test-router'

import RoleGuard from '../component/RoleGuard'

const mockUseAuth = jest.fn()
jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('RoleGuard', () => {
  it('redirects to /dashboard when user does not have required role', () => {
    mockUseAuth.mockReturnValue({ user: { _id: '1', name: 'Test', email: 't@t.com', role: 'user' } })

    render(
      <TestRouter initialEntries={['/dashboard/users']}>
        <Routes>
          <Route path="/dashboard/users" element={<RoleGuard roles={['admin']}><div>Users Page</div></RoleGuard>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </TestRouter>,
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Users Page')).not.toBeInTheDocument()
  })

  it('redirects when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null })

    render(
      <TestRouter initialEntries={['/dashboard/users']}>
        <Routes>
          <Route path="/dashboard/users" element={<RoleGuard roles={['admin']}><div>Users Page</div></RoleGuard>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </TestRouter>,
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Users Page')).not.toBeInTheDocument()
  })

  it('renders children when user has required role', () => {
    mockUseAuth.mockReturnValue({ user: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } })

    render(
      <TestRouter initialEntries={['/dashboard/users']}>
        <Routes>
          <Route path="/dashboard/users" element={<RoleGuard roles={['admin']}><div>Users Page</div></RoleGuard>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </TestRouter>,
    )

    expect(screen.getByText('Users Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('redirects to /dashboard when business user accesses admin-only businesses route', () => {
    mockUseAuth.mockReturnValue({ user: { _id: '1', name: 'Biz', email: 'b@b.com', role: 'business' } })

    render(
      <TestRouter initialEntries={['/dashboard/businesses']}>
        <Routes>
          <Route path="/dashboard/businesses" element={<RoleGuard roles={['admin']}><div>Businesses Page</div></RoleGuard>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </TestRouter>,
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Businesses Page')).not.toBeInTheDocument()
  })

  it('renders businesses page when user has admin role', () => {
    mockUseAuth.mockReturnValue({ user: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } })

    render(
      <TestRouter initialEntries={['/dashboard/businesses']}>
        <Routes>
          <Route path="/dashboard/businesses" element={<RoleGuard roles={['admin']}><div>Businesses Page</div></RoleGuard>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </TestRouter>,
    )

    expect(screen.getByText('Businesses Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })
})

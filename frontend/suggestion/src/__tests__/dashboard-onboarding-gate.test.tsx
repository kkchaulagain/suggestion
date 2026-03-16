import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DashboardIndex } from '../component/DashboardRouter'
import { useAuth } from '../context/AuthContext'

jest.mock('../context/AuthContext')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

function renderDashboardIndex(initialEntry = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/dashboard" element={<DashboardIndex />} />
        <Route path="/dashboard/onboarding" element={<div>Onboarding Page</div>} />
        <Route path="/dashboard/forms" element={<div>Forms Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DashboardIndex onboarding gate', () => {
  it('redirects business user without onboarding completed to onboarding', () => {
    mockUseAuth.mockReturnValue({
      user: { _id: '1', name: 'Biz', email: 'b@b.com', role: 'business' },
      business: { _id: 'b1', owner: '1', businessname: 'Test', type: 'commercial', description: 'D', onboardingCompleted: false },
    } as ReturnType<typeof useAuth>)
    renderDashboardIndex()
    expect(screen.getByText('Onboarding Page')).toBeInTheDocument()
    expect(screen.queryByText('Forms Page')).not.toBeInTheDocument()
  })

  it('redirects business user with onboarding completed to forms', () => {
    mockUseAuth.mockReturnValue({
      user: { _id: '1', name: 'Biz', email: 'b@b.com', role: 'business' },
      business: { _id: 'b1', owner: '1', businessname: 'Test', type: 'commercial', description: 'D', onboardingCompleted: true },
    } as ReturnType<typeof useAuth>)
    renderDashboardIndex()
    expect(screen.getByText('Forms Page')).toBeInTheDocument()
    expect(screen.queryByText('Onboarding Page')).not.toBeInTheDocument()
  })

  it('redirects non-business user to forms', () => {
    mockUseAuth.mockReturnValue({
      user: { _id: '1', name: 'User', email: 'u@u.com', role: 'user' },
      business: null,
    } as ReturnType<typeof useAuth>)
    renderDashboardIndex()
    expect(screen.getByText('Forms Page')).toBeInTheDocument()
    expect(screen.queryByText('Onboarding Page')).not.toBeInTheDocument()
  })
})

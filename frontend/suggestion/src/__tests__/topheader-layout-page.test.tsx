import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import axios from 'axios'

import TopHeader from '../pages/business-dashboard/components/TopHeader'
import BusinessDashboardLayout from '../pages/business-dashboard/layout/BusinessDashboardLayout'
import FormsPage from '../pages/business-dashboard/pages/FormsPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

describe('TopHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
    mockNavigate.mockReset()
    localStorage.clear()
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('role', 'business')
    localStorage.setItem('isLoggedIn', 'true')
  })

  test('closes profile menu on outside click and logs out', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          businessname: 'Acme Traders',
          location: 'Kathmandu',
          pancardNumber: 12345678,
          description: 'Retail store',
        },
      },
    } as any)

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TopHeader title="Forms" onOpenSidebar={jest.fn()} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Profile/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Profile/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Logout/i }))

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('role')).toBeNull()
    expect(localStorage.getItem('isLoggedIn')).toBe('false')
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  test('keeps profile null when business profile fetch fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('request failed'))

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TopHeader title="Forms" onOpenSidebar={jest.fn()} />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole('button', { name: /Profile/i }))

    expect(screen.getByText(/Business name unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/Location: N\/A/i)).toBeInTheDocument()
  })
})

describe('BusinessDashboardLayout and page', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: { success: true, data: {} } } as any)
  })

  test('renders fallback title and opens sidebar from header menu button', async () => {
    render(
      <MemoryRouter initialEntries={['/business-dashboard/unknown']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/business-dashboard" element={<BusinessDashboardLayout />}>
            <Route path="unknown" element={<div>Unknown Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /Business Dashboard/i })).toBeInTheDocument()
    expect(screen.getByText(/Unknown Page/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Menu/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Close menu/i })).toBeInTheDocument()
    })
  })

  test('renders FormsPage static sections', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { feedbackForms: [] } } as any)

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <FormsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    expect(screen.getByRole('heading', { name: /Saved Forms/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Make Form/i })).toBeInTheDocument()
  })
})

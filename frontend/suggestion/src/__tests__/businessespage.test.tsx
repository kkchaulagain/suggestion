import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import BusinessesPage from '../pages/business-dashboard/pages/BusinessesPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake-token' }),
  }),
}))

function renderBusinessesPage() {
  return render(
    <MemoryRouter>
      <BusinessesPage />
    </MemoryRouter>,
  )
}

interface BusinessesApiResponse {
  data: { businesses: Array<{ id: string; businessname: string; location: string; description?: string; pancardNumber?: number; owner: string }> }
}

describe('BusinessesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
  })

  test('shows Registered Businesses title and Refresh button', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { businesses: [] } } as BusinessesApiResponse)

    renderBusinessesPage()

    expect(screen.getByText(/Registered Businesses/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/No registered businesses yet\./i)).toBeInTheDocument()
    })
  })

  test('shows load error when fetching businesses fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'))

    renderBusinessesPage()

    await waitFor(() => {
      expect(screen.getByText(/Unable to load businesses\. Please try again\./i)).toBeInTheDocument()
    })
  })

  test('shows empty state when no businesses', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { businesses: [] } } as BusinessesApiResponse)

    renderBusinessesPage()

    await waitFor(() => {
      expect(screen.getByText(/No registered businesses yet\./i)).toBeInTheDocument()
    })
  })

  test('shows business list when API returns businesses', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        businesses: [
          {
            id: 'b1',
            owner: 'u1',
            businessname: 'Acme Corp',
            location: 'City Center',
            pancardNumber: 123456789,
            description: 'Test business',
          },
        ],
      },
    } as BusinessesApiResponse)

    renderBusinessesPage()

    await waitFor(() => {
      expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument()
      expect(screen.getByText(/Location: City Center/i)).toBeInTheDocument()
      expect(screen.getByText(/Test business/i)).toBeInTheDocument()
    })
  })

  test('Refresh button re-fetches businesses', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { businesses: [] } } as BusinessesApiResponse)
      .mockResolvedValueOnce({ data: { businesses: [] } } as BusinessesApiResponse)

    renderBusinessesPage()

    await waitFor(() => {
      expect(screen.getByText(/No registered businesses yet\./i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }))

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })
  })
})

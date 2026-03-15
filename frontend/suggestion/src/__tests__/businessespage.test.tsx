import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TestRouter } from './test-router'
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
    <TestRouter>
      <BusinessesPage />
    </TestRouter>,
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

  test('View button opens details modal and Close closes it', async () => {
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
    })

    fireEvent.click(screen.getByRole('button', { name: /^View$/i }))

    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveTextContent('Business details')
      expect(dialog).toHaveTextContent('Acme Corp')
      expect(dialog).toHaveTextContent('City Center')
      expect(dialog).toHaveTextContent('Test business')
    })

    fireEvent.click(screen.getByRole('button', { name: /Close/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  test('Edit button opens edit form and Save updates business', async () => {
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

    const updatedBusiness = {
      id: 'b1',
      owner: 'u1',
      businessname: 'Acme Updated',
      location: 'New Location',
      pancardNumber: 999,
      description: 'Updated desc',
    }
    mockedAxios.put.mockResolvedValueOnce({ data: { business: updatedBusiness } })

    renderBusinessesPage()

    await waitFor(() => {
      expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Edit business/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Business name/i), { target: { value: 'Acme Updated' } })
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'New Location' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/b1'),
        expect.objectContaining({ businessname: 'Acme Updated', location: 'New Location' }),
        expect.any(Object),
      )
    })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByText(/Acme Updated/i)).toBeInTheDocument()
      expect(screen.getByText(/New Location/i)).toBeInTheDocument()
    })
  })

  test('Delete button confirms and removes business on success', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

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

    mockedAxios.delete.mockResolvedValueOnce({ data: { ok: true } })

    renderBusinessesPage()

    await waitFor(() => {
      expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }))

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Acme Corp'))
    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('/b1'), expect.any(Object))
    })

    await waitFor(() => {
      expect(screen.queryByText(/Acme Corp/i)).not.toBeInTheDocument()
    })

    confirmSpy.mockRestore()
  })
})

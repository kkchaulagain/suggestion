import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from './test-router'
import axios from 'axios'

import BusinessesPage from '../pages/business-dashboard/pages/BusinessesPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<Record<string, unknown>>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake-token' }),
  }),
}))

function renderBusinessesPage(initialPath = '/dashboard/businesses') {
  return render(
    <TestRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard/businesses" element={<BusinessesPage />} />
      </Routes>
    </TestRouter>,
  )
}

interface BusinessesApiResponse {
  data: {
    businesses: Array<{
      id: string
      businessname: string
      location: string
      description?: string
      pancardNumber?: number | string
      owner: string
    }>
  }
}

describe('BusinessesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    mockedAxios.put.mockReset()
    mockedAxios.delete.mockReset()
  })

  test('shows Add business and Refresh', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { businesses: [] } } as BusinessesApiResponse)

    renderBusinessesPage()

    expect(screen.getByText(/Registered Businesses/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add business/i })).toBeInTheDocument()
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

  test('Add business opens wizard; Cancel returns to list', async () => {
    mockedAxios.get.mockResolvedValue({ data: { businesses: [] } } as BusinessesApiResponse)

    renderBusinessesPage()

    await waitFor(() => {
      expect(screen.getByText(/No registered businesses yet\./i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Add business/i }))

    expect(screen.getByTestId('business-create-wizard')).toBeInTheDocument()
    expect(screen.getByText(/Business identity/i)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('wizard-cancel'))

    await waitFor(() => {
      expect(screen.queryByTestId('business-create-wizard')).not.toBeInTheDocument()
      expect(screen.getAllByText(/Registered Businesses/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  test('step validation blocks Next when business name empty', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { businesses: [] } } as BusinessesApiResponse)

    renderBusinessesPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add business/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Add business/i }))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    expect(await screen.findByText(/Business name is required/i)).toBeInTheDocument()
  })

  test('full wizard submit creates business and returns to list', async () => {
    const listState: BusinessesApiResponse['data']['businesses'] = []
    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({ data: { businesses: [...listState] } } as BusinessesApiResponse),
    )

    mockedAxios.post.mockImplementation(() => {
      listState.push({
        id: 'new1',
        owner: '',
        businessname: 'New Co',
        location: 'Ktm',
        pancardNumber: '111',
        description: 'About new co',
      })
      return Promise.resolve({ data: { ok: true, business: { id: 'new1' } } })
    })

    renderBusinessesPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add business/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Add business/i }))

    fireEvent.change(screen.getByLabelText(/Business name/i), { target: { value: 'New Co' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Ktm' } })
    fireEvent.change(screen.getByLabelText(/PAN/i), { target: { value: '111' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'About new co' } })
    fireEvent.click(screen.getByRole('button', { name: /Review/i }))

    fireEvent.click(screen.getByRole('button', { name: /Create business/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/v1\/business$/),
        expect.objectContaining({
          businessname: 'New Co',
          description: 'About new co',
          type: 'commercial',
          isPublicCompany: false,
          location: 'Ktm',
          pancardNumber: '111',
        }),
        expect.any(Object),
      )
    })

    await waitFor(() => {
      expect(screen.queryByTestId('business-create-wizard')).not.toBeInTheDocument()
      expect(screen.getAllByText(/New Co/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  test('View navigates to business detail', async () => {
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

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/businesses/b1')
  })

  test('Refresh re-fetches businesses', async () => {
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

  test('Edit opens modal and Save updates business', async () => {
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
    })

    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/Company listing/i), { target: { value: 'public' } })
    fireEvent.change(within(dialog).getByLabelText(/Business name/i), { target: { value: 'Acme Updated' } })
    fireEvent.change(within(dialog).getByLabelText(/^Location$/i), { target: { value: 'New Location' } })
    fireEvent.change(within(dialog).getByLabelText(/PAN number/i), { target: { value: '999' } })
    fireEvent.change(within(dialog).getByLabelText(/^Description$/i), { target: { value: 'Updated desc' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/b1'),
        expect.objectContaining({
          businessname: 'Acme Updated',
          location: 'New Location',
          pancardNumber: 999,
          description: 'Updated desc',
          isPublicCompany: true,
        }),
        expect.any(Object),
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByText(/Acme Updated/i)).toBeInTheDocument()
    })
  })

  test('Edit modal PAN input clears to 0 when empty', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        businesses: [
          {
            id: 'b1',
            owner: 'u1',
            businessname: 'Co',
            location: 'L',
            pancardNumber: 123,
            description: 'D',
          },
        ],
      },
    } as BusinessesApiResponse)
    mockedAxios.put.mockResolvedValueOnce({
      data: {
        business: {
          id: 'b1',
          owner: 'u1',
          businessname: 'Co',
          location: 'L',
          pancardNumber: 0,
          description: 'D',
        },
      },
    })

    renderBusinessesPage()
    await waitFor(() => expect(screen.getByText(/Co/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    const dialog = await screen.findByRole('dialog')
    const panInput = within(dialog).getByLabelText(/PAN number/i)
    fireEvent.change(panInput, { target: { value: '' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ pancardNumber: 0 }),
        expect.any(Object),
      )
    })
  })

  test('Delete confirms and removes business', async () => {
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

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalled()
      expect(screen.queryByText(/Acme Corp/i)).not.toBeInTheDocument()
    })

    confirmSpy.mockRestore()
  })
})

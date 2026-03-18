import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'
import BusinessOnboardingPage from '../pages/business-dashboard/pages/BusinessOnboardingPage'

jest.mock('axios')
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake' }),
    refetchBusiness: jest.fn().mockResolvedValue(undefined),
  }),
}))

const mockedAxios = axios as jest.Mocked<typeof axios>

function renderOnboarding() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <BusinessOnboardingPage />
    </MemoryRouter>
  )
}

describe('BusinessOnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue({
      data: { formsCount: 0, pagesCount: 0, submissionsCount: 0 },
    })
  })

  it('shows welcome step and Get started button', async () => {
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Business setup/i)).toBeInTheDocument()
  })

  it('navigates to site type step when Get started is clicked', async () => {
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    expect(screen.getByText(/What best describes your business/i)).toBeInTheDocument()
  })

  it('shows site archetypes and continues to preview when one is selected', async () => {
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    fireEvent.click(screen.getByText(/Service business/i))
    expect(screen.getByText(/What we.*create/i)).toBeInTheDocument()
  })

  it('shows destructive confirmation when existing data and requires typing RESET', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { formsCount: 2, pagesCount: 1, submissionsCount: 5 },
    })
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByText(/Warning: this will replace existing content/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    fireEvent.click(screen.getByText(/Service business/i))
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))
    expect(screen.getByPlaceholderText('RESET')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run setup/i })).toBeDisabled()
    fireEvent.change(screen.getByTestId('onboarding-confirm-input'), { target: { value: 'RESET' } })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Run setup/i })).not.toBeDisabled()
    })
  })

  it('calls onboarding API and navigates to success on completion', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { message: 'ok', forms: [], pages: [], onboardingCompleted: true },
    })
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    fireEvent.click(screen.getByText(/Start from scratch/i))
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /Run setup/i }))
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/onboarding/business-setup'),
        expect.objectContaining({
          resetExistingData: true,
          forms: expect.any(Array),
          pages: expect.any(Array),
        }),
        expect.any(Object)
      )
    })
    await waitFor(() => {
      expect(screen.getByText(/Setup complete/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Go to Forms/i })).toBeInTheDocument()
    })
  })

  it('opens add page picker and adds selected role page', async () => {
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    fireEvent.click(screen.getByText(/Start from scratch/i))

    fireEvent.click(screen.getByRole('button', { name: /^Add page$/i }))
    expect(screen.getByText(/Choose a page type/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Products page/i))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Products')).toBeInTheDocument()
      expect(screen.getByDisplayValue('products')).toBeInTheDocument()
    })
  })

  it('removes a page from site structure', async () => {
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    fireEvent.click(screen.getByText(/Start from scratch/i))

    expect(screen.getByDisplayValue('Contact us')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Remove Contact us/i }))

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Contact us')).not.toBeInTheDocument()
      expect(screen.getByText(/No pages yet/i)).toBeInTheDocument()
    })
  })

  it('sends showInNav=false when switch is turned off', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { message: 'ok', forms: [], pages: [], onboardingCompleted: true },
    })
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    fireEvent.click(screen.getByText(/Start from scratch/i))

    const navSwitch = screen.getByRole('switch', { name: /Show in navigation/i })
    fireEvent.click(navSwitch)

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /Run setup/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled()
    })
    const postPayload = mockedAxios.post.mock.calls[0]?.[1] as { pages?: Array<{ showInNav?: boolean }> }
    expect(postPayload.pages?.[0]?.showInNav).toBe(false)
  })

  it('updates page title and slug from inputs', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { message: 'ok', forms: [], pages: [], onboardingCompleted: true },
    })
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    fireEvent.click(screen.getByText(/Start from scratch/i))

    fireEvent.change(screen.getByLabelText(/Page title/i), { target: { value: 'My Contact Page' } })
    fireEvent.change(screen.getByLabelText(/URL slug/i), { target: { value: 'My Contact !!!' } })

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /Run setup/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled()
    })
    const postPayload = mockedAxios.post.mock.calls[0]?.[1] as { pages?: Array<{ title?: string; slug?: string }> }
    expect(postPayload.pages?.[0]?.title).toBe('My Contact Page')
    expect(postPayload.pages?.[0]?.slug).toBe('my-contact-')
  })

  it('opens add page picker from empty state add button', async () => {
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    fireEvent.click(screen.getByText(/Start from scratch/i))
    fireEvent.click(screen.getByRole('button', { name: /Remove Contact us/i }))

    await waitFor(() => {
      expect(screen.getByText(/No pages yet/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^Add page$/i }))
    expect(screen.getByText(/Choose a page type/i)).toBeInTheDocument()
  })

  it('closes add page picker when overlay is clicked and when Cancel is clicked', async () => {
    renderOnboarding()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Get started/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
    fireEvent.click(screen.getByText(/Start from scratch/i))

    fireEvent.click(screen.getByRole('button', { name: /^Add page$/i }))
    expect(screen.getByText(/Choose a page type/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Choose a page type/i).closest('div[class*="fixed"]') as HTMLElement)
    await waitFor(() => {
      expect(screen.queryByText(/Choose a page type/i)).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^Add page$/i }))
    expect(screen.getByText(/Choose a page type/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    await waitFor(() => {
      expect(screen.queryByText(/Choose a page type/i)).not.toBeInTheDocument()
    })
  })
})

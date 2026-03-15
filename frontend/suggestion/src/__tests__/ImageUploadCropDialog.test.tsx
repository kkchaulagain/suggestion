import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ImageUploadCropDialog from '../components/media/ImageUploadCropDialog'

jest.mock('react-easy-crop', () => ({
  __esModule: true,
  default: function MockCropper({ onCropComplete }: { onCropComplete: (area: unknown, areaPixels: { width: number; height: number; x: number; y: number }) => void }) {
    return (
      <div data-testid="cropper">
        <button
          type="button"
          onClick={() =>
            onCropComplete(null, { width: 100, height: 56, x: 0, y: 0 })
          }
        >
          Complete crop
        </button>
      </div>
    )
  },
}))

jest.mock('axios')

describe('ImageUploadCropDialog', () => {
  const onClose = jest.fn()
  const onUploaded = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders closed when isOpen is false', () => {
    render(
      <ImageUploadCropDialog
        isOpen={false}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('renders modal with title and file input when open', () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Upload and crop image')).toBeInTheDocument()
    expect(screen.getByLabelText(/Choose image/i)).toBeInTheDocument()
    expect(screen.getByText('Select an image to start cropping.')).toBeInTheDocument()
  })

  test('uses custom title when provided', () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
        title="Add hero image"
      />,
    )
    expect(screen.getByText('Add hero image')).toBeInTheDocument()
  })

  test('Cancel calls onClose', async () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  test('Upload cropped image button is disabled when no image', () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const uploadBtn = screen.getByRole('button', { name: /Upload cropped image/i })
    expect(uploadBtn).toBeDisabled()
  })
})

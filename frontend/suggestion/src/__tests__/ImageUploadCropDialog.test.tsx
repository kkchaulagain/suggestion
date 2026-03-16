import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import axios from 'axios'
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
const mockedAxios = axios as jest.Mocked<typeof axios>

const revokeObjectURL = jest.fn()
const createObjectURL = jest.fn(() => 'blob:mock-url')

const OriginalImage = global.Image

beforeAll(() => {
  global.URL.createObjectURL = createObjectURL
  global.URL.revokeObjectURL = revokeObjectURL
  ;(global as unknown as { Image: typeof Image }).Image = class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    _src = ''
    set src(value: string) {
      this._src = value
      queueMicrotask(() => this.onload?.())
    }
    get src() {
      return this._src
    }
  } as unknown as typeof Image
})

afterAll(() => {
  if (OriginalImage) (global as unknown as { Image: typeof Image }).Image = OriginalImage
})

describe('ImageUploadCropDialog', () => {
  const onClose = jest.fn()
  const onUploaded = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    createObjectURL.mockReturnValue('blob:mock')
    revokeObjectURL.mockClear()
    const ctx = { drawImage: jest.fn() }
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(ctx)
    HTMLCanvasElement.prototype.toBlob = jest.fn((cb: (b: Blob | null) => void) => {
      cb(new Blob(['x'], { type: 'image/jpeg' }))
    })
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

  test('onSelectFile does nothing when no file selected', async () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const input = screen.getByLabelText(/Choose image/i)
    fireEvent.change(input, { target: { files: [] } })
    expect(screen.getByText('Select an image to start cropping.')).toBeInTheDocument()
  })

  test('shows error when selecting non-image file', async () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const input = screen.getByLabelText(/Choose image/i) as HTMLInputElement
    const file = new File(['pdf content'], 'doc.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText('Please select an image file.')).toBeInTheDocument()
  })

  test('selecting image shows cropper and revokes previous URL when selecting again', async () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const input = screen.getByLabelText(/Choose image/i)
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
    await userEvent.upload(input, file)
    expect(createObjectURL).toHaveBeenCalledWith(file)
    expect(screen.getByTestId('cropper')).toBeInTheDocument()
    const file2 = new File(['image2'], 'photo2.png', { type: 'image/png' })
    await userEvent.upload(input, file2)
    expect(revokeObjectURL).toHaveBeenCalled()
  })

  test('upload without completing crop shows validation error', async () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const input = screen.getByLabelText(/Choose image/i)
    await userEvent.upload(input, new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    const uploadBtn = screen.getByRole('button', { name: /Upload cropped image/i })
    await userEvent.click(uploadBtn)
    expect(screen.getByText(/Select an image and adjust crop before uploading/)).toBeInTheDocument()
    expect(onUploaded).not.toHaveBeenCalled()
  })

  test('complete crop then upload succeeds and calls onUploaded and onClose', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { url: 'https://cdn.example/img.jpg' } })
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const input = screen.getByLabelText(/Choose image/i)
    await userEvent.upload(input, new File(['x'], 'my photo.jpg', { type: 'image/jpeg' }))
    await userEvent.click(screen.getByRole('button', { name: /Complete crop/i }))
    const uploadBtn = screen.getByRole('button', { name: /Upload cropped image/i })
    await userEvent.click(uploadBtn)

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('upload'),
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
      )
    })
    expect(onUploaded).toHaveBeenCalledWith('https://cdn.example/img.jpg')
    expect(onClose).toHaveBeenCalled()
  })

  test('upload failure shows API error message', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'File too large' } },
    })
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const input = screen.getByLabelText(/Choose image/i)
    await userEvent.upload(input, new File(['x'], 'big.jpg', { type: 'image/jpeg' }))
    await userEvent.click(screen.getByRole('button', { name: /Complete crop/i }))
    await userEvent.click(screen.getByRole('button', { name: /Upload cropped image/i }))

    await waitFor(() => {
      expect(screen.getByText('File too large')).toBeInTheDocument()
    })
    expect(onUploaded).not.toHaveBeenCalled()
  })

  test('upload failure without API error shows generic message', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'))
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const input = screen.getByLabelText(/Choose image/i)
    await userEvent.upload(input, new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    await userEvent.click(screen.getByRole('button', { name: /Complete crop/i }))
    await userEvent.click(screen.getByRole('button', { name: /Upload cropped image/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to upload image.')).toBeInTheDocument()
    })
  })

  test('Cancel is disabled while uploading', async () => {
    let resolveUpload: (v: unknown) => void
    mockedAxios.post.mockImplementationOnce(
      () => new Promise((resolve) => { resolveUpload = resolve }),
    )
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const input = screen.getByLabelText(/Choose image/i)
    await userEvent.upload(input, new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    await userEvent.click(screen.getByRole('button', { name: /Complete crop/i }))
    await userEvent.click(screen.getByRole('button', { name: /Upload cropped image/i }))
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Uploading/ })).toBeInTheDocument()
    resolveUpload!({ data: { url: 'https://done' } })
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  test('resets state when isOpen becomes false', async () => {
    const { rerender } = render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    const input = screen.getByLabelText(/Choose image/i)
    await userEvent.upload(input, new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    expect(screen.getByTestId('cropper')).toBeInTheDocument()
    rerender(
      <ImageUploadCropDialog
        isOpen={false}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    rerender(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    expect(screen.getByText('Select an image to start cropping.')).toBeInTheDocument()
  })

  test('passes elevated overlay z-index to modal', () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
        elevated={true}
      />,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveStyle({ zIndex: '60' })
  })

  test('zoom slider updates crop zoom', async () => {
    render(
      <ImageUploadCropDialog
        isOpen={true}
        onClose={onClose}
        onUploaded={onUploaded}
      />,
    )
    await userEvent.upload(
      screen.getByLabelText(/Choose image/i),
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
    )
    const zoomSlider = screen.getByLabelText(/Zoom/i)
    expect(zoomSlider).toHaveValue('1')
    fireEvent.change(zoomSlider, { target: { value: '2' } })
    expect(zoomSlider).toHaveValue('2')
  })
})

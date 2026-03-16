import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Upload } from 'lucide-react'
import { uploadApi } from '../../utils/apipath'
import { Button, ErrorMessage, Modal } from '../ui'

interface ImageUploadCropDialogProps {
  isOpen: boolean
  onClose: () => void
  onUploaded: (url: string) => void
  title?: string
  aspect?: number
  /** Use a higher z-index so this dialog appears above another open modal (e.g. when opened from block edit). */
  elevated?: boolean
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image for cropping'))
    image.src = url
  })
}

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to create crop canvas')
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to create cropped image'))
        else resolve(blob)
      },
      'image/jpeg',
      0.92,
    )
  })
}

function safeFileName(base: string): string {
  const cleaned = base.trim().replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-')
  return cleaned || `upload-${Date.now()}`
}

export default function ImageUploadCropDialog({
  isOpen,
  onClose,
  onUploaded,
  title = 'Upload and crop image',
  aspect = 16 / 9,
  elevated = false,
}: ImageUploadCropDialogProps) {
  const [fileName, setFileName] = useState('')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const hasImage = Boolean(imageSrc)
  const uploadLabel = useMemo(() => (uploading ? 'Uploading…' : 'Upload cropped image'), [uploading])

  useEffect(() => {
    if (!isOpen) {
      setFileName('')
      setImageSrc(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
      setUploading(false)
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc)
    }
  }, [imageSrc])

  const onSelectFile: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (imageSrc) URL.revokeObjectURL(imageSrc)
    setError('')
    setFileName(file.name)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setImageSrc(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError('Select an image and adjust crop before uploading.')
      return
    }
    try {
      setUploading(true)
      setError('')
      const croppedBlob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], `${safeFileName(fileName)}-cropped.jpg`, {
        type: 'image/jpeg',
      })
      const formData = new FormData()
      formData.append('file', croppedFile)
      const { data } = await axios.post<{ url: string }>(uploadApi, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onUploaded(data.url)
      onClose()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(message ?? 'Failed to upload image.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      overlayZIndex={elevated ? 60 : undefined}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300" htmlFor="cms-image-upload-input">
            Choose image
          </label>
          <input
            id="cms-image-upload-input"
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            className="block w-full cursor-pointer rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-stone-700 hover:file:bg-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:file:bg-stone-800 dark:file:text-stone-200"
          />
        </div>

        {hasImage ? (
          <div className="space-y-3">
            <div className="relative h-72 overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 dark:border-stone-700">
              <Cropper
                image={imageSrc ?? undefined}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
                showGrid={false}
                objectFit="contain"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="crop-zoom" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Zoom
              </label>
              <input
                id="crop-zoom"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
            Select an image to start cropping.
          </div>
        )}

        {error ? <ErrorMessage message={error} /> : null}

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleUpload()}
            disabled={uploading || !hasImage}
          >
            <Upload className="h-4 w-4" />
            {uploadLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}


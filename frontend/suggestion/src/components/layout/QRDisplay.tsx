export interface QRDisplayProps {
  imageDataUrl: string
  formUrl: string
  title?: string
}

export default function QRDisplay({ imageDataUrl, formUrl, title }: QRDisplayProps) {
  return (
    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <img
        src={imageDataUrl}
        alt={title ? `QR for ${title}` : 'QR code'}
        className="h-36 w-36 rounded border border-white bg-white"
      />
      <a
        href={formUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block break-all text-xs text-emerald-700 underline hover:text-emerald-800"
      >
        {formUrl}
      </a>
    </div>
  )
}

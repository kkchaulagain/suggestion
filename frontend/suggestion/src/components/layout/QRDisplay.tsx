import { ExternalLink } from 'lucide-react'

export interface QRDisplayProps {
  imageDataUrl: string
  formUrl: string
  title?: string
}

export default function QRDisplay({ imageDataUrl, formUrl, title }: QRDisplayProps) {
  return (
    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/30">
      <img
        src={imageDataUrl}
        alt={title ? `QR for ${title}` : 'QR code'}
        className="h-36 w-36 rounded border border-white bg-white dark:border-slate-700"
      />
      <a
        href={formUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-1.5 break-all text-xs text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {formUrl}
      </a>
    </div>
  )
}

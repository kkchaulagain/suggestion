import type { BusinessListItem } from '../types/business'
import BusinessActionButtons from './BusinessActionButtons'

interface BusinessesTableProps {
  businesses: BusinessListItem[]
  onView: (business: BusinessListItem) => void
  onEdit: (business: BusinessListItem) => void
  onDelete: (business: BusinessListItem) => void
}

export default function BusinessesTable({
  businesses,
  onView,
  onEdit,
  onDelete,
}: BusinessesTableProps) {
  return (
    <div className="mt-4 space-y-4">
      {businesses.map((business) => (
        <div key={business.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-slate-900">{business.businessname}</p>
              <p className="mt-1 text-sm text-slate-600">Location: {business.location}</p>
              {business.description ? (
                <p className="mt-1 text-sm text-slate-600">{business.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                PAN: {business.pancardNumber ?? 'N/A'} · ID: {business.id}
              </p>
            </div>
            <BusinessActionButtons
              onView={() => onView(business)}
              onEdit={() => onEdit(business)}
              onDelete={() => onDelete(business)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

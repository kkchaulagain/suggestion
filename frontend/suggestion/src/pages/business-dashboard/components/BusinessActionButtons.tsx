import { Button } from '../../../components/ui'

interface BusinessActionButtonsProps {
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function BusinessActionButtons({
  onView,
  onEdit,
  onDelete,
}: BusinessActionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={onView}>
        View
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
        Edit
      </Button>
      <Button type="button" variant="danger" size="sm" onClick={onDelete}>
        Delete
      </Button>
    </div>
  )
}

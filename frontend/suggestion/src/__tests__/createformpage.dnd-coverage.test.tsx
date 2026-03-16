import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from './test-router'

import CreateFormPage from '../pages/business-dashboard/pages/CreateFormPage'

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake-token' }),
  }),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('@dnd-kit/core', () => {
  return {
    closestCenter: jest.fn(),
    KeyboardSensor: jest.fn(),
    PointerSensor: jest.fn(),
    useSensor: jest.fn(() => ({})),
    useSensors: jest.fn((...args: unknown[]) => args),
    useDroppable: jest.fn(() => ({ setNodeRef: jest.fn(), isOver: false })),
    DndContext: ({
      children,
      onDragStart,
      onDragOver,
      onDragMove,
      onDragCancel,
      onDragEnd,
    }: {
      children: ReactNode
      onDragStart?: (event: unknown) => void
      onDragOver?: (event: unknown) => void
      onDragMove?: (event: unknown) => void
      onDragCancel?: () => void
      onDragEnd?: (event: unknown) => void
    }) => (
      <div data-testid="dnd-context">
        <button
          type="button"
          data-testid="dnd-start"
          onClick={() => onDragStart?.({ active: { id: 'default-attachment' } })}
        />
        <button
          type="button"
          data-testid="dnd-over"
          onClick={() => onDragOver?.({ over: { id: 'default-description' } })}
        />
        <button
          type="button"
          data-testid="dnd-move-top"
          onClick={() => onDragMove?.({ activatorEvent: { clientY: 20 } })}
        />
        <button
          type="button"
          data-testid="dnd-move-bottom"
          onClick={() => onDragMove?.({ activatorEvent: { clientY: 2000 } })}
        />
        <button
          type="button"
          data-testid="dnd-move-touch"
          onClick={() => onDragMove?.({ activatorEvent: { touches: [{ clientY: 22 }] } })}
        />
        <button
          type="button"
          data-testid="dnd-cancel"
          onClick={() => onDragCancel?.()}
        />
        <button
          type="button"
          data-testid="dnd-end-reorder"
          onClick={() => onDragEnd?.({ active: { id: 'default-attachment' }, over: { id: 'default-description' } })}
        />
        <button
          type="button"
          data-testid="dnd-end-no-over"
          onClick={() => onDragEnd?.({ active: { id: 'default-attachment' }, over: null })}
        />
        <button
          type="button"
          data-testid="dnd-end-step-drop"
          onClick={() => {
            const overId = (window as Window & { __dndTestStepDropId__?: string }).__dndTestStepDropId__
            onDragEnd?.({
              active: { id: 'default-attachment' },
              over: overId ? { id: overId } : null,
            })
          }}
        />
        {children}
      </div>
    ),
  }
})

jest.mock('@dnd-kit/sortable', () => {
  return {
    SortableContext: ({ children }: { children: unknown }) => <>{children}</>,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
    arrayMove: (arr: unknown[], oldIndex: number, newIndex: number) => {
      const next = [...arr]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      return next
    },
    sortableKeyboardCoordinates: jest.fn(),
    verticalListSortingStrategy: jest.fn(),
  }
})

function renderCreateFormPage() {
  return render(
    <TestRouter initialEntries={['/dashboard/forms/create']}>
      <Routes>
        <Route path="/dashboard/forms/create" element={<CreateFormPage />} />
      </Routes>
    </TestRouter>,
  )
}

describe('CreateFormPage drag coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('covers drag move pointer/touch/cancel branches', async () => {
    const scrollSpy = jest.spyOn(window, 'scrollBy').mockImplementation(() => undefined)

    renderCreateFormPage()
    fireEvent.click(screen.getByRole('button', { name: /configure my own/i }))

    fireEvent.click(screen.getByTestId('dnd-start'))
    fireEvent.click(screen.getByTestId('dnd-over'))
    fireEvent.click(screen.getByTestId('dnd-move-top'))
    fireEvent.click(screen.getByTestId('dnd-move-bottom'))
    fireEvent.click(screen.getByTestId('dnd-move-touch'))
    fireEvent.click(screen.getByTestId('dnd-cancel'))
    fireEvent.click(screen.getByTestId('dnd-end-no-over'))

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalled()
    })

    scrollSpy.mockRestore()
  })

  test('reorders fields and resets to original order while preserving new fields', async () => {
    renderCreateFormPage()
    fireEvent.click(screen.getByRole('button', { name: /configure my own/i }))

    fireEvent.click(screen.getByRole('button', { name: /\+ add new field/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add new field/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^Text$/i }))

    fireEvent.click(screen.getByTestId('dnd-end-reorder'))

    const resetButton = screen.getByRole('button', { name: /reset to original order/i })
    expect(resetButton).toBeEnabled()

    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(resetButton).toBeDisabled()
    })

    expect(screen.getByText('Text field 4')).toBeInTheDocument()
  }, 15000)

  test('drag field onto step (step droppable) moves field to that step', async () => {
    const win = window as Window & { __dndTestStepDropId__?: string }
    renderCreateFormPage()
    fireEvent.click(screen.getByRole('button', { name: /configure my own/i }))

    fireEvent.click(screen.getByRole('button', { name: /add step/i }))
    fireEvent.click(screen.getByRole('button', { name: /add step/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Step 1$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Step 2$/i })).toBeInTheDocument()
    })

    const stepContainers = document.querySelectorAll('[data-stepid]')
    expect(stepContainers.length).toBe(2)
    const secondStepId = stepContainers[1].getAttribute('data-stepid')
    expect(secondStepId).toBeTruthy()
    win.__dndTestStepDropId__ = `step-drop:${secondStepId}`

    fireEvent.click(screen.getByTestId('dnd-start'))
    fireEvent.click(screen.getByTestId('dnd-end-step-drop'))

    await waitFor(() => {
      const containers = document.querySelectorAll('[data-stepid]')
      expect(containers.length).toBe(2)
      expect(within(containers[1] as HTMLElement).getByText('attachment')).toBeInTheDocument()
    })

    delete win.__dndTestStepDropId__
  })
})

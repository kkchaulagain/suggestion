import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import { FileText, Inbox } from 'lucide-react'

import BottomTabBar from '../pages/business-dashboard/components/BottomTabBar'
import Sidebar from '../pages/business-dashboard/components/Sidebar'

const items = [
  { label: 'Forms', path: '/dashboard/forms', icon: FileText },
  { label: 'Submissions', path: '/dashboard/submissions', icon: Inbox },
]

describe('BottomTabBar', () => {
  test('renders shortened labels and links', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/submissions']}>
        <BottomTabBar items={items} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.getByText('Forms')).toBeInTheDocument()
    expect(screen.getByText('Inbox')).toBeInTheDocument()
  })
})

describe('Sidebar', () => {
  test('renders brand text and nav links', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/forms']}>
        <Sidebar items={items} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Suggestion Suite')).toBeInTheDocument()
    expect(screen.getByText('QR Service Desk')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forms/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /submissions/i })).toBeInTheDocument()
  })
})

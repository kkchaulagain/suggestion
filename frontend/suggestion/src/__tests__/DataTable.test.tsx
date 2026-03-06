import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DataTable from '../components/layout/DataTable'

describe('DataTable', () => {
  test('shows loading message when loading', () => {
    render(
      <DataTable
        columns={[{ key: 'a', header: 'A' }]}
        rows={[]}
        loading
        loadingMessage="Loading..."
      />,
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('shows empty message when rows are empty and not loading', () => {
    render(
      <DataTable
        columns={[{ key: 'a', header: 'A' }]}
        rows={[]}
        emptyMessage="No items."
      />,
    )
    expect(screen.getByText('No items.')).toBeInTheDocument()
  })

  test('renders table with columns and rows', () => {
    render(
      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'id', header: 'ID' },
        ]}
        rows={[
          { name: 'Alice', id: '1' },
          { name: 'Bob', id: '2' },
        ]}
      />,
    )
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  test('uses render when provided', () => {
    render(
      <DataTable
        columns={[
          { key: 'x', header: 'X', render: (row: { x: number }) => `Value: ${row.x}` },
        ]}
        rows={[{ x: 42 }]}
      />,
    )
    expect(screen.getByText('Value: 42')).toBeInTheDocument()
  })
})

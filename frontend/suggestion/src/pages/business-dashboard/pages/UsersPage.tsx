import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Pencil, UserX, UserCheck } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { usersApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage, Input, Modal, Select, Tag } from '../../../components/ui'
import { DataTable, EmptyState, Pagination } from '../../../components/layout'

const ROLES = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'business', label: 'Business' },
  { value: 'user', label: 'User' },
  { value: 'governmentservices', label: 'Government' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

export interface UserRow {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt?: string
}

function EditUserModal({
  user,
  onClose,
  onSaved,
  getAuthHeaders,
}: {
  user: UserRow
  onClose: () => void
  onSaved: () => void
  getAuthHeaders: () => { Authorization?: string }
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState(user.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await axios.put(
        `${usersApi}/${user._id}`,
        { name: name.trim(), email: email.trim().toLowerCase(), role },
        { withCredentials: true, headers: getAuthHeaders() },
      )
      onSaved()
      onClose()
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? String(err.response.data.message)
        : 'Failed to update user.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Edit user" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-name"
          label="Name"
          value={name}
          onChange={setName}
          required
        />
        <Input
          id="edit-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />
        <Select
          id="edit-role"
          label="Role"
          value={role}
          onChange={setRole}
          options={ROLES.filter((r) => r.value).map((r) => ({ value: r.value, label: r.label }))}
        />
        {error ? <ErrorMessage message={error} /> : null}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ConfirmDeactivateModal({
  user,
  onClose,
  onConfirm,
  getAuthHeaders,
}: {
  user: UserRow
  onClose: () => void
  onConfirm: () => void
  getAuthHeaders: () => { Authorization?: string }
}) {
  const [loading, setLoading] = useState(false)

  const handleDeactivate = async () => {
    setLoading(true)
    try {
      await axios.patch(
        `${usersApi}/${user._id}/deactivate`,
        {},
        { withCredentials: true, headers: getAuthHeaders() },
      )
      onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Deactivate user" size="sm">
      <p className="text-slate-600 dark:text-slate-300">
        Deactivate <strong>{user.name}</strong> ({user.email})? They will not be able to log in.
      </p>
      <div className="mt-4 flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={handleDeactivate} disabled={loading}>
          {loading ? 'Deactivating...' : 'Deactivate'}
        </Button>
      </div>
    </Modal>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [roleApplied, setRoleApplied] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [statusApplied, setStatusApplied] = useState('')
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [deactivateUser, setDeactivateUser] = useState<UserRow | null>(null)
  const { user: currentUser, getAuthHeaders } = useAuth()

  const authHeaders = useMemo(
    () => ({ withCredentials: true as const, headers: getAuthHeaders() }),
    [getAuthHeaders],
  )
  const authRef = useRef(authHeaders)
  authRef.current = authHeaders

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (searchApplied) params.set('search', searchApplied)
      if (roleApplied) params.set('role', roleApplied)
      if (statusApplied) params.set('isActive', statusApplied)
      const res = await axios.get<{
        success: boolean
        data: { users: UserRow[]; pagination: { total: number } }
      }>(`${usersApi}?${params.toString()}`, authRef.current)
      setUsers(res.data.data?.users ?? [])
      setTotal(res.data.data?.pagination?.total ?? 0)
    } catch {
      setError('Failed to load users.')
      setUsers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchApplied, roleApplied, statusApplied])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleApplyFilters = useCallback(() => {
    setSearchApplied(search)
    setRoleApplied(roleFilter)
    setStatusApplied(statusFilter)
    setPage(1)
  }, [search, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleActivate = useCallback(
    async (u: UserRow) => {
      try {
        await axios.patch(
          `${usersApi}/${u._id}/activate`,
          {},
          { withCredentials: true, headers: getAuthHeaders() },
        )
        void loadUsers()
      } catch {
        setError('Failed to activate user.')
      }
    },
    [getAuthHeaders, loadUsers],
  )

  const tableColumns = useMemo(
    () => [
      {
        key: 'name' as const,
        header: 'Name',
        render: (row: UserRow) => row.name,
      },
      {
        key: 'email' as const,
        header: 'Email',
        render: (row: UserRow) => row.email,
      },
      {
        key: 'role' as const,
        header: 'Role',
        render: (row: UserRow) => (
          <Tag variant={row.role === 'admin' ? 'emerald' : 'default'}>{row.role}</Tag>
        ),
      },
      {
        key: 'isActive' as const,
        header: 'Status',
        render: (row: UserRow) => (
          <Tag variant={row.isActive ? 'emerald' : 'default'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </Tag>
        ),
      },
      {
        key: 'actions' as const,
        header: 'Actions',
        render: (row: UserRow) => (
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditUser(row)}
              aria-label={`Edit ${row.name}`}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            {row.isActive ? (
              row._id !== currentUser?._id ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeactivateUser(row)}
                  aria-label={`Deactivate ${row.name}`}
                >
                  <UserX className="h-4 w-4" />
                  Deactivate
                </Button>
              ) : null
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleActivate(row)}
                aria-label={`Activate ${row.name}`}
              >
                <UserCheck className="h-4 w-4" />
                Activate
              </Button>
            )}
          </div>
        ),
      },
    ],
    [currentUser?._id, handleActivate],
  )

  return (
    <Card>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Users</h3>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="min-w-0 flex-1">
          <Input
            id="users-search"
            label="Search"
            placeholder="Name or email"
            value={search}
            onChange={setSearch}
          />
        </div>
        <Select
          id="users-role"
          label="Role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={ROLES}
        />
        <Select
          id="users-status"
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
        <Button type="button" onClick={handleApplyFilters} className="shrink-0 min-h-[44px]">
          Apply
        </Button>
      </div>

      {error ? <ErrorMessage message={error} className="mt-3" /> : null}

      {loading ? (
        <EmptyState type="loading" message="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState type="empty" message="No users found." />
      ) : (
        <>
          <div className="md:hidden mt-4 space-y-3">
            {users.map((row) => (
              <div
                key={row._id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{row.email}</p>
                <div className="flex gap-2 flex-wrap">
                  <Tag variant={row.role === 'admin' ? 'emerald' : 'default'}>{row.role}</Tag>
                  <Tag variant={row.isActive ? 'emerald' : 'default'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="flex-1 min-h-[44px] justify-center"
                    onClick={() => setEditUser(row)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  {row.isActive && row._id !== currentUser?._id ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="flex-1 min-h-[44px] justify-center"
                      onClick={() => setDeactivateUser(row)}
                    >
                      <UserX className="h-4 w-4" />
                      Deactivate
                    </Button>
                  ) : null}
                  {!row.isActive ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="flex-1 min-h-[44px] justify-center"
                      onClick={() => handleActivate(row)}
                    >
                      <UserCheck className="h-4 w-4" />
                      Activate
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block">
            <DataTable<UserRow>
              columns={tableColumns}
              rows={users}
              emptyMessage="No users found."
              loading={false}
              page={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
            />
          </div>
          <div className="md:hidden mt-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {editUser ? (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={loadUsers}
          getAuthHeaders={getAuthHeaders}
        />
      ) : null}

      {deactivateUser ? (
        <ConfirmDeactivateModal
          user={deactivateUser}
          onClose={() => setDeactivateUser(null)}
          onConfirm={loadUsers}
          getAuthHeaders={getAuthHeaders}
        />
      ) : null}
    </Card>
  )
}

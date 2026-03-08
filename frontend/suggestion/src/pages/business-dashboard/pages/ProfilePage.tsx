import axios from 'axios'
import { useEffect, useState } from 'react'
import { Check, KeyRound, LogOut, Pencil, X, UserCircle } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Button, Card, Input, Modal } from '../../../components/ui'
import { changePasswordApi, meapi } from '../../../utils/apipath'
import { useNavigate } from 'react-router-dom'

interface ProfileData {
  name: string
  email: string
}

export default function ProfilePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const { user, getAuthHeaders, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    let cancelled = false

    const fetchProfile = async () => {
      setProfileError(null)
      try {
        const response = await axios.get(meapi, {
          withCredentials: true,
          headers: getAuthHeaders(),
        })
        if (!cancelled && response.data?.success && response.data?.data) {
          const data = response.data.data as { name?: string; email?: string }
          setProfile({
            name: data.name ?? 'N/A',
            email: data.email ?? 'N/A',
          })
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setProfile(null)
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            setProfileError('Session expired. Please login again.')
          } else {
            setProfileError('Unable to load profile from API.')
          }
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false)
      }
    }

    fetchProfile()
    return () => { cancelled = true }
  }, [getAuthHeaders])

  const handleOpenEdit = () => {
    setEditName(profile?.name ?? '')
    setSaveError(null)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editName.trim()) {
      setSaveError('Name cannot be empty')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    try {
      const response = await axios.put(meapi, { name: editName.trim() }, {
        withCredentials: true,
        headers: getAuthHeaders(),
      })
      if (response.data?.success && response.data?.data) {
        const data = response.data.data as { name?: string; email?: string }
        setProfile(prev => ({
          name: data.name ?? prev?.name ?? 'N/A',
          email: data.email ?? prev?.email ?? 'N/A',
        }))
        setIsDialogOpen(false)
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setSaveError(error.response?.data?.message ?? 'Failed to update profile.')
      } else {
        setSaveError('Failed to update profile.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const resetPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
  }

  const handleOpenPasswordModal = () => {
    resetPasswordForm()
    setPasswordSuccess(null)
    setIsPasswordDialogOpen(true)
  }

  const handleClosePasswordModal = () => {
    if (!isChangingPassword) {
      setIsPasswordDialogOpen(false)
      setPasswordError(null)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      const response = await axios.put(
        changePasswordApi,
        { currentPassword, newPassword, confirmPassword },
        {
          withCredentials: true,
          headers: getAuthHeaders(),
        }
      )

      if (response.data?.success) {
        setPasswordSuccess(response.data?.message ?? 'Password changed successfully')
        resetPasswordForm()
        setIsPasswordDialogOpen(false)
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setPasswordError(error.response?.data?.message ?? 'Failed to change password.')
      } else {
        setPasswordError('Failed to change password.')
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  const displayName = profile?.name ?? user?.name ?? 'N/A'
  const displayEmail = profile?.email ?? user?.email ?? 'N/A'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">

          <Card>
            
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-700">
             
              <div className="relative flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                  <UserCircle className="h-12 w-12 text-white" />
                </div>
              </div>

              
              <div className="flex-1 min-w-0">
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                  {isLoadingProfile ? 'Loading...' : displayName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {isLoadingProfile ? '' : displayEmail}
                </p>
              </div>

              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Edit Profile"
                onClick={handleOpenEdit}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex-shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

         
            <div className="space-y-5">
              {profileError ? (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{profileError}</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <Button type="button" variant="secondary" size="lg" className="w-full" onClick={handleOpenPasswordModal}>
                <KeyRound className="h-4 w-4" />
                Change Password
              </Button>
              <Button type="button" variant="danger" size="lg" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
            {passwordSuccess ? (
              <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">{passwordSuccess}</p>
            ) : null}
          </Card>

        </div>
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <Input
            id="edit-profile-name"
            label="Name"
            type="text"
            value={editName}
            onChange={setEditName}
            placeholder="Enter your name"
          />
          {saveError ? (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{saveError}</p>
          ) : null}
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setIsDialogOpen(false)}
            className="flex-1"
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSave}
            className="flex-1"
            disabled={isSaving}
          >
            <Check className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isPasswordDialogOpen}
        onClose={handleClosePasswordModal}
        title="Change Password"
      >
        <div className="space-y-4">
          <Input
            id="current-password"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter current password"
          />
          <Input
            id="new-password"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Enter new password"
          />
          <Input
            id="confirm-password"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
          />
          {passwordError ? (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{passwordError}</p>
          ) : null}
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleClosePasswordModal}
            className="flex-1"
            disabled={isChangingPassword}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleChangePassword}
            className="flex-1"
            disabled={isChangingPassword}
          >
            <Check className="h-4 w-4" />
            {isChangingPassword ? 'Changing...' : 'Update Password'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
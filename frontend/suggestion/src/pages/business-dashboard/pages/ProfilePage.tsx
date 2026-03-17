import axios from 'axios'
import { useEffect, useState } from 'react'
import { Check, KeyRound, LogOut, Pencil, Rocket, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { Avatar, Button, Input, Modal } from '../../../components/ui'
import { businessmeapi, changePasswordApi, meapi, verifyPasswordApi } from '../../../utils/apipath'
import { useNavigate } from 'react-router-dom'

interface ProfileData {
  name: string
  email: string
  avatarId?: string | null
}

interface BusinessData {
  id: string
  type: 'personal' | 'commercial'
  businessname: string
  location: string
  pancardNumber: string
  description: string
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isBusinessPasswordDialogOpen, setIsBusinessPasswordDialogOpen] = useState(false)
  const [isBusinessEditDialogOpen, setIsBusinessEditDialogOpen] = useState(false)
  const [businessConfirmPassword, setBusinessConfirmPassword] = useState('')
  const [businessPasswordError, setBusinessPasswordError] = useState<string | null>(null)
  const [isVerifyingBusinessPassword, setIsVerifyingBusinessPassword] = useState(false)
  const [businessForm, setBusinessForm] = useState<BusinessData | null>(null)
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false)
  const [isSavingBusiness, setIsSavingBusiness] = useState(false)
  const [businessEditError, setBusinessEditError] = useState<string | null>(null)
  const [businessEditSuccess, setBusinessEditSuccess] = useState<string | null>(null)
  const { user, getAuthHeaders, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogoutClick = () => setShowLogoutConfirm(true)

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false)
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
          const data = response.data.data as { name?: string; email?: string; avatarId?: string | null }
          setProfile({
            name: data.name ?? 'N/A',
            email: data.email ?? 'N/A',
            avatarId: data.avatarId ?? undefined,
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
  const handleOpenBusinessPasswordModal = () => {
    setBusinessConfirmPassword('')
    setBusinessPasswordError(null)
    setBusinessEditError(null)
    setBusinessEditSuccess(null)
    setIsBusinessPasswordDialogOpen(true)
  }

  const handleCloseBusinessPasswordModal = () => {
    if (!isVerifyingBusinessPassword) {
      setIsBusinessPasswordDialogOpen(false)
      setBusinessConfirmPassword('')
      setBusinessPasswordError(null)
    }
  }

  const handleCloseBusinessEditModal = () => {
    if (!isSavingBusiness) {
      setIsBusinessEditDialogOpen(false)
      setBusinessEditError(null)
    }
  }

  const loadBusinessData = async () => {
    setIsLoadingBusiness(true)
    setBusinessEditError(null)
    try {
      const response = await axios.get(businessmeapi, {
        withCredentials: true,
        headers: getAuthHeaders(),
      })

      const data = response.data?.data as {
        _id?: string
        type?: 'personal' | 'commercial'
        businessname?: string
        location?: string
        pancardNumber?: string | number
        description?: string
      } | undefined

      if (!response.data?.success || !data?._id) {
        setBusinessEditError('Unable to load business profile.')
        return
      }

      setBusinessForm({
        id: data._id,
        type: data.type ?? 'personal',
        businessname: data.businessname ?? '',
        location: data.location ?? '',
        pancardNumber: data.pancardNumber != null ? String(data.pancardNumber) : '',
        description: data.description ?? '',
      })
      setIsBusinessEditDialogOpen(true)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setBusinessEditError(error.response?.data?.message ?? 'Unable to load business profile.')
      } else {
        setBusinessEditError('Unable to load business profile.')
      }
    } finally {
      setIsLoadingBusiness(false)
    }
  }

  const checkPassword = async () => {
    if (!businessConfirmPassword.trim()) {
      setBusinessPasswordError('Password is required to confirm')
      return
    }

    setIsVerifyingBusinessPassword(true)
    setBusinessPasswordError(null)

    try {
      const response = await axios.post(
        verifyPasswordApi,
        { password: businessConfirmPassword },
        {
          withCredentials: true,
          headers: getAuthHeaders(),
        }
      )

      if (response.data?.success) {
        setIsBusinessPasswordDialogOpen(false)
        setBusinessConfirmPassword('')
        await loadBusinessData()
      } else {
        setBusinessPasswordError(response.data?.message ?? 'Password verification failed')
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setBusinessPasswordError(error.response?.data?.message ?? 'Incorrect password')
      } else {
        setBusinessPasswordError('Incorrect password')
      }
    } finally {
      setIsVerifyingBusinessPassword(false)
    }
  }

  const handleSaveBusiness = async () => {
    if (!businessForm) return

    if (!businessForm.businessname.trim()) {
      setBusinessEditError('Business name is required')
      return
    }

    if (!businessForm.description.trim()) {
      setBusinessEditError('Description is required')
      return
    }

    setIsSavingBusiness(true)
    setBusinessEditError(null)
    setBusinessEditSuccess(null)

    try {
      const response = await axios.put(
        businessmeapi,
        {
          type: businessForm.type,
          businessname: businessForm.businessname.trim(),
          location: businessForm.location.trim(),
          pancardNumber: businessForm.pancardNumber.trim(),
          description: businessForm.description.trim(),
        },
        {
          withCredentials: true,
          headers: getAuthHeaders(),
        }
      )

      if (response.data?.success) {
        setBusinessEditSuccess(response.data?.message ?? 'Business profile updated successfully')
        setIsBusinessEditDialogOpen(false)
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setBusinessEditError(error.response?.data?.message ?? 'Failed to update business profile.')
      } else {
        setBusinessEditError('Failed to update business profile.')
      }
    } finally {
      setIsSavingBusiness(false)
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
  const displayAvatarId = profile?.avatarId ?? user?.avatarId ?? undefined

  return (
    <section className="mx-auto max-w-4xl space-y-6" aria-label="Profile">
      <div className="border-b border-slate-200 py-5 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} avatarId={displayAvatarId} size="lg" alt="Profile" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
              {isLoadingProfile ? 'Loading...' : displayName}
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
              {isLoadingProfile ? '' : displayEmail}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Edit Profile"
            onClick={handleOpenEdit}
            className="flex-shrink-0 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        {profileError ? (
          <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">{profileError}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-0 rounded bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          onClick={() => navigate('/dashboard/onboarding')}
        >
          <Rocket className="h-3.5 w-3.5" />
          Start onboarding
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-0 rounded bg-slate-100 px-2.5 py-1.5 text-xs font-medium dark:bg-slate-700"
          onClick={handleOpenPasswordModal}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Change Password
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-0 rounded bg-slate-100 px-2.5 py-1.5 text-xs font-medium dark:bg-slate-700"
          onClick={handleOpenBusinessPasswordModal}
        >
           <Pencil className="h-4 w-4"/>
            Edit Business 
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          className="min-h-0 rounded px-2.5 py-1.5 text-xs font-medium"
          onClick={handleLogoutClick}
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
      {passwordSuccess ? (
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{passwordSuccess}</p>
      ) : null}
      {businessEditSuccess ? (
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{businessEditSuccess}</p>
      ) : null}

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Log out?"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to log out? You will need to sign in again to access your account.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setShowLogoutConfirm(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={handleLogoutConfirm}
            className="flex-1"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </Modal>

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

      <Modal
        isOpen={isBusinessPasswordDialogOpen}
        onClose={handleCloseBusinessPasswordModal}
        title="Confirm Password"
        >
         <p className='text-sm text-muted-foreground'>
           Enter password to confirm
          </p>
          <Input
            id='password-confirmation'
            label=''
            type='password'
            value={businessConfirmPassword}
            onChange={setBusinessConfirmPassword}
            placeholder='password'
          />
          {businessPasswordError ? (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{businessPasswordError}</p>
          ) : null}
          <div className='mt-6 flex gap-3'>
            <Button
            type='button'
            variant='secondary'
            size='lg'
            onClick={handleCloseBusinessPasswordModal}
            disabled={isVerifyingBusinessPassword}
            >
            <X className="h-4 w-4" />
            Cancel
            </Button>
            <Button
             type='button'
             variant='primary'
             size='lg'
             className='flex-1'
            onClick={checkPassword}
            disabled={isVerifyingBusinessPassword}
            >
              <Check className="h-4 w-4"/>
              {isVerifyingBusinessPassword ? 'Verifying...' : 'Confirm'}
            </Button>
            </div>
        </Modal>

      <Modal
        isOpen={isBusinessEditDialogOpen}
        onClose={handleCloseBusinessEditModal}
        title="Edit Business"
      >
        <div className="space-y-4">
          {isLoadingBusiness ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading business profile...</p>
          ) : (
            <>
              <Input
                id="edit-business-name"
                label="Business Name"
                type="text"
                value={businessForm?.businessname ?? ''}
                onChange={(value) => setBusinessForm(prev => (prev ? { ...prev, businessname: value } : prev))}
                placeholder="Enter business name"
              />
              <div className="space-y-1">
                <label htmlFor="edit-business-type" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Business Type
                </label>
                <select
                  id="edit-business-type"
                  value={businessForm?.type ?? 'personal'}
                  onChange={(event) => setBusinessForm(prev => (prev ? { ...prev, type: event.target.value as 'personal' | 'commercial' } : prev))}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="personal">Personal</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <Input
                id="edit-business-location"
                label="Location"
                type="text"
                value={businessForm?.location ?? ''}
                onChange={(value) => setBusinessForm(prev => (prev ? { ...prev, location: value } : prev))}
                placeholder="Enter location"
              />
              <Input
                id="edit-business-pancard"
                label="Pancard Number"
                type="text"
                value={businessForm?.pancardNumber ?? ''}
                onChange={(value) => setBusinessForm(prev => (prev ? { ...prev, pancardNumber: value } : prev))}
                placeholder="Enter pancard number"
              />
              <Input
                id="edit-business-description"
                label="Description"
                type="text"
                value={businessForm?.description ?? ''}
                onChange={(value) => setBusinessForm(prev => (prev ? { ...prev, description: value } : prev))}
                placeholder="Describe your business"
              />
            </>
          )}

          {businessEditError ? (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{businessEditError}</p>
          ) : null}
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleCloseBusinessEditModal}
            className="flex-1"
            disabled={isSavingBusiness}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSaveBusiness}
            className="flex-1"
            disabled={isSavingBusiness || isLoadingBusiness || !businessForm}
          >
            <Check className="h-4 w-4" />
            {isSavingBusiness ? 'Saving...' : 'Save Business'}
          </Button>
        </div>
      </Modal>

    
    </section>
  )
}
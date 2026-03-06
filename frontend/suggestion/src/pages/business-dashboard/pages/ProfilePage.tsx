import { useState } from 'react'
import { Check, KeyRound, LogOut, Pencil, X } from 'lucide-react'
import { Button, Card, Input, Modal } from '../../../components/ui'

export default function ProfilePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          
          <Card>
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Personal Details
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {"Need to Call API"} 
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {"(API pending)"}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="button" variant="secondary" size="lg" className="flex-1">
                <KeyRound className="h-4 w-4" />
                Change Password
              </Button>
              <Button type="button" variant="danger" size="lg" className="flex-1 !bg-red-50/30 !text-red-600 hover:!bg-red-50 dark:!bg-red-900/30 dark:!text-red-400 dark:hover:!bg-red-900/50 !border-red-100 dark:!border-red-800">
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
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
            value=""
            onChange={() => {}}
            placeholder="Enter the name"
          />
        </div>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="secondary" size="lg" onClick={() => setIsDialogOpen(false)} className="flex-1">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button type="button" variant="primary" size="lg" onClick={() => setIsDialogOpen(false)} className="flex-1">
            <Check className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
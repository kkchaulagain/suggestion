import { useState } from 'react'
import { Button, Label } from '../../../components/ui'

export default function ProfilePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Personal Details
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="text-emerald-600 hover:text-emerald-700"
              >
                Edit Profile
              </Button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <p className="text-sm font-semibold text-slate-800">
                  {"Need to Call API"} 
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                <p className="text-sm font-semibold text-slate-800">
                  {"(API pending)"}
                </p>
              </div>
            </div>
          </section>

        
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="button" variant="secondary" size="lg" className="flex-1">
                Change Password
              </Button>
              <Button type="button" variant="danger" size="lg" className="flex-1 !bg-red-50/30 !text-red-600 hover:!bg-red-50 !border-red-100">
                Log Out
              </Button>
            </div>
          </section>
        </div>
      </div>


      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-profile-name" size="md" className="mb-1 text-slate-700">
                  Name
                </Label>
                <input
                  id="edit-profile-name"
                  type="text"
                  placeholder="Enter the name"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="button" variant="primary" size="lg" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
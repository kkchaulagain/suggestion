import { useState } from 'react';

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
              <button 
                onClick={() => setIsDialogOpen(true)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
              >
                Edit Profile
              </button>
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
              <button className="flex-1 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-sm font-semibold text-slate-700 text-center">
                Change Password
              </button>
              <button className="flex-1 px-4 py-3 rounded-xl border border-red-100 bg-red-50/30 text-red-600 hover:bg-red-50 transition text-sm font-semibold text-center">
                Log Out
              </button>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  placeholder="Enter the name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Cancel
              </button>
              <button onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { Outlet } from 'react-router-dom'

/**
 * Minimal layout for the public form render route.
 * No dashboard sidebar or TopHeader — form is the main focus.
 */
export default function FormRenderLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}

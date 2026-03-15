import { Outlet } from 'react-router-dom'

/**
 * Minimal layout for the public form render route.
 * No dashboard sidebar or TopHeader — form is the main focus.
 */
export default function FormRenderLayout() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <main className="mx-auto w-full max-w-full px-3 py-6 sm:max-w-2xl sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}

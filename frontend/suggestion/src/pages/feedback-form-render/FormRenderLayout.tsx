import { Outlet } from 'react-router-dom'

/**
 * Minimal layout for the public form render route.
 * No dashboard sidebar or TopHeader — form is the main focus.
 */
export default function FormRenderLayout() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#fafaf9] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <main className="mx-auto w-full max-w-full px-4 py-10 sm:max-w-lg sm:px-6 sm:py-14">
        <Outlet />
      </main>
    </div>
  )
}

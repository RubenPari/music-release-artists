import { Outlet, Link } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/login" className="text-2xl font-semibold text-foreground">
            Music Release Artists
          </Link>
          <p className="mt-2 text-sm text-muted">Gestisci i tuoi artisti musicali</p>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

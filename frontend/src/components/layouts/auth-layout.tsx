import { Outlet, Link } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f3ec] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/login" className="text-2xl font-semibold text-[#08060d]">
            Music Release Artists
          </Link>
          <p className="mt-2 text-sm text-[#6b6375]">Gestisci i tuoi artisti musicali</p>
        </div>

        <div className="rounded-xl border border-[#e5e4e7] bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

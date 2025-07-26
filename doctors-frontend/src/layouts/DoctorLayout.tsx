import { Link, Outlet, useLocation } from 'react-router-dom'
import BaseLayout from './BaseLayout'
import clsx from 'classnames'

const menu = [
  { to: '/doctor/slots', label: 'My time slots' },
  { to: '/doctor/appointments', label: 'Appointments' },
]

export default function DoctorLayout() {
  const { pathname } = useLocation()

  return (
    <BaseLayout>
      <div className="flex">
        <aside className="w-56 bg-white shadow h-[calc(100vh-3.5rem)]">
          <nav className="p-4 space-y-2">
            {menu.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className={clsx(
                  'block px-3 py-2 rounded hover:bg-gray-100',
                  pathname.startsWith(m.to) && 'bg-gray-200 font-semibold'
                )}
              >
                {m.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="flex-1 p-6">
          <Outlet />
        </section>
      </div>
    </BaseLayout>
  )
}

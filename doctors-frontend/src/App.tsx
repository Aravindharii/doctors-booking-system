import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Protected from './components/Protected'
import RoleGuard from './components/RoleGuard'
import { Role } from './types'
import PatientLayout from './layouts/PatientLayout'
import DoctorLayout from './layouts/DoctorLayout'
import PatientBook from './pages/patient/BookAppointment'
import PatientMyAppointments from './pages/patient/MyAppointments'
import DoctorSlots from './pages/doctor/Slots'
import DoctorAppointments from './pages/doctor/Appointments'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PATIENT DASHBOARD */}
      <Route element={<Protected />}>
        <Route element={<RoleGuard allowed={[Role.PATIENT]} />}>
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<Navigate to="book" replace />} />
            <Route path="book" element={<PatientBook />} />
            <Route path="appointments" element={<PatientMyAppointments />} />
          </Route>
        </Route>

        {/* DOCTOR DASHBOARD */}
        <Route element={<RoleGuard allowed={[Role.DOCTOR]} />}>
          <Route path="/doctor" element={<DoctorLayout />}>
            <Route index element={<Navigate to="slots" replace />} />
            <Route path="slots" element={<DoctorSlots />} />
            <Route path="appointments" element={<DoctorAppointments />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

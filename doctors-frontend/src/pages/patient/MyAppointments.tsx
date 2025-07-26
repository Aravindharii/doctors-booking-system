import { useState, useEffect } from 'react'
import { useApi } from '../../contexts/ApiContext'

export default function PatientMyAppointments() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const { getPatientAppointments } = useApi()

  const fetchAppointments = async () => {
    setIsFetching(true)
    try {
      const data = await getPatientAppointments()
      setAppointments(data)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to load appointments')
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Appointments</h1>
      <button className="text-blue-600 text-sm" onClick={fetchAppointments}>
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </button>

      {!appointments.length && <p className="text-gray-600">No appointments.</p>}
      <div className="space-y-2">
        {appointments.map((a) => (
          <div key={a.id} className="bg-white rounded shadow p-3">
            <div><strong>#{a.id}</strong> • Status: {a.status}</div>
            <div>Doctor: {a.doctor?.name} (#{a.doctorId})</div>
            <div>Slot: {new Date(a.slot!.start).toLocaleString()} → {new Date(a.slot!.end).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

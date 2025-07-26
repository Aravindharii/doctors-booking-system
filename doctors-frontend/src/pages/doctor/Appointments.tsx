import { useState, useEffect } from 'react'
import { useApi } from '../../contexts/ApiContext'
import { AppointmentStatus } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const { getDoctorAppointments, updateAppointmentStatus, rescheduleAppointment } = useApi()

  const fetchAppointments = async () => {
    setIsFetching(true)
    try {
      const data = await getDoctorAppointments()
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
      <h1 className="text-xl font-semibold">Appointments</h1>
      <button className="text-blue-600 text-sm" onClick={fetchAppointments}>
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </button>

      {!appointments.length && <p className="text-gray-600">No appointments.</p>}
      <div className="space-y-2">
        {appointments.map((a) => (
          <div key={a.id} className="bg-white rounded shadow p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div><strong>#{a.id}</strong> • Status: <span className="font-semibold">{a.status}</span></div>
                <div>Patient: {a.patient?.name} (#{a.patientId})</div>
                <div>Slot: {new Date(a.slot!.start).toLocaleString()} → {new Date(a.slot!.end).toLocaleString()}</div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      await updateAppointmentStatus(a.id, 'CONFIRMED')
                      fetchAppointments()
                    } catch (e: any) {
                      alert(e?.response?.data?.message || 'Failed')
                    }
                  }}
                >
                  Confirm
                </Button>

                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    try {
                      await updateAppointmentStatus(a.id, 'CANCELLED')
                      fetchAppointments()
                    } catch (e: any) {
                      alert(e?.response?.data?.message || 'Failed')
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>

            <div className="border-t pt-2">
              <RescheduleForm
                id={a.id}
                onReschedule={async (slotId) => {
                  try {
                    await rescheduleAppointment(a.id, slotId)
                    fetchAppointments()
                  } catch (e: any) {
                    alert(e?.response?.data?.message || 'Failed')
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RescheduleForm({ id, onReschedule }: { id: number; onReschedule: (slotId: number) => Promise<void> }) {
  const [slotId, setSlotId] = useState<number>(0)

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Reschedule to slotId</span>
      <Input
        type="number"
        value={slotId}
        onChange={(e) => setSlotId(parseInt(e.target.value || '0'))}
        className="w-32"
      />
      <Button onClick={() => onReschedule(slotId)} disabled={!slotId}>
        Reschedule
      </Button>
    </div>
  )
}

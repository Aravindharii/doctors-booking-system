import { useState, useEffect } from 'react'
import { useApi } from '../../contexts/ApiContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function PatientBook() {
  const [doctorId, setDoctorId] = useState<number>(1)
  const [slots, setSlots] = useState<any[]>([])
  const [selected, setSelected] = useState<number>()
  const [isFetching, setIsFetching] = useState(false)
  const { getAvailableSlots, bookAppointment } = useApi()

  const fetchSlots = async () => {
    if (!doctorId) return
    setIsFetching(true)
    try {
      const data = await getAvailableSlots(doctorId)
      setSlots(data)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to load slots')
    } finally {
      setIsFetching(false)
    }
  }

  const handleBook = async () => {
    if (!selected) return
    try {
      await bookAppointment(doctorId, selected)
      alert('Booked!')
      fetchSlots()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Book an appointment</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm">Doctor ID</label>
        <Input
          type="number"
          value={doctorId}
          onChange={(e) => setDoctorId(parseInt(e.target.value || '0'))}
          className="w-32"
        />
        <Button onClick={fetchSlots} disabled={!doctorId || isFetching}>
          {isFetching ? 'Loading...' : 'Load slots'}
        </Button>
      </div>

      {slots.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-medium">Available slots for doctor #{doctorId}</h2>
          <select
            className="border rounded px-3 py-2"
            value={selected}
            onChange={(e) => setSelected(parseInt(e.target.value))}
          >
            <option value="">Select a slot</option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} — {new Date(s.start).toLocaleString()} → {new Date(s.end).toLocaleString()}
              </option>
            ))}
          </select>

          <div>
            <Button onClick={handleBook} disabled={!selected}>
              Book
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">No slots loaded / available</p>
      )}
    </div>
  )
}

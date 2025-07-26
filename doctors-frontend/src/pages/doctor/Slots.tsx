import { useState, useEffect } from 'react'
import { useApi } from '../../contexts/ApiContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function DoctorSlots() {
  const [slots, setSlots] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [start, setStart] = useState<string>(new Date(Date.now() + 3600_000).toISOString().slice(0, 16))
  const [end, setEnd] = useState<string>(new Date(Date.now() + 5400_000).toISOString().slice(0, 16))
  const { createSlot, getMySlots, updateSlot, deleteSlot } = useApi()

  const fetchSlots = async () => {
    setIsFetching(true)
    try {
      const data = await getMySlots()
      setSlots(data)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to load slots')
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [])

  const handleCreate = async () => {
    try {
      await createSlot(new Date(start).toISOString(), new Date(end).toISOString())
      setStart(new Date(Date.now() + 3600_000).toISOString().slice(0, 16))
      setEnd(new Date(Date.now() + 5400_000).toISOString().slice(0, 16))
      fetchSlots()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">My Time Slots</h1>

      <div className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="font-medium">Create a slot</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label>Start</label>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="w-60" />

          <label>End</label>
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="w-60" />

          <Button onClick={handleCreate}>
            Create
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="text-blue-600 text-sm" onClick={fetchSlots}>
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-2">
        {!slots.length && <p className="text-gray-600">No slots.</p>}
        {slots.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded shadow space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-sm text-gray-600">#{s.id}</div>
              <div className="flex items-center gap-2">
                <span>start</span>
                <Input
                  type="datetime-local"
                  defaultValue={new Date(s.start).toISOString().slice(0, 16)}
                  onChange={(e) => (s.start = new Date(e.target.value).toISOString())}
                  className="w-56"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>end</span>
                <Input
                  type="datetime-local"
                  defaultValue={new Date(s.end).toISOString().slice(0, 16)}
                  onChange={(e) => (s.end = new Date(e.target.value).toISOString())}
                  className="w-56"
                />
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  defaultChecked={s.isBooked}
                  onChange={(e) => (s.isBooked = e.target.checked)}
                />
                <span>booked</span>
              </div>

              <Button
                className="ml-auto"
                onClick={async () => {
                  try {
                    await updateSlot(s.id, s.start, s.end, s.isBooked)
                    fetchSlots()
                  } catch (e: any) {
                    alert(e?.response?.data?.message || 'Update failed')
                  }
                }}
              >
                Save
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  try {
                    await deleteSlot(s.id)
                    fetchSlots()
                  } catch (e: any) {
                    alert(e?.response?.data?.message || 'Delete failed')
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

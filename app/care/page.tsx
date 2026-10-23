'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CareEvent } from '@/lib/care-activity'

type Device = { id: string; name: string }
type Activity = { devices: Device[]; deviceId: string | null; events: CareEvent[]; fetchedAt: number; hasMore?: boolean }

const sample: Activity = {
  devices: [{ id: 'sample-doorbell', name: 'Sample front door' }],
  deviceId: 'sample-doorbell',
  events: [
    { id: 'sample-1', kind: 'ding', start: Date.now() - 12 * 60_000 },
    { id: 'sample-2', kind: 'motion', start: Date.now() - 75 * 60_000 },
    { id: 'sample-3', kind: 'motion', start: Date.now() - 4 * 60 * 60_000 },
  ],
  fetchedAt: Date.now(),
}

const eventLabels: Record<CareEvent['kind'], string> = {
  ding: 'Doorbell pressed',
  motion: 'Motion detected',
  on_demand: 'Live view started',
}

export default function CarePage() {
  const [mode, setMode] = useState<'ring' | 'sample'>('ring')
  const [activity, setActivity] = useState<Activity | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (deviceId?: string, signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const query = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''
      const response = await fetch(`/api/care/activity${query}`, { cache: 'no-store', signal })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load activity')
      setActivity(result)
      setSelectedId(result.deviceId || '')
    } catch (caught) {
      if (signal?.aborted) return
      setError(caught instanceof Error ? caught.message : 'Unable to load activity')
      setActivity(null)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'ring') return
    const controller = new AbortController()
    refresh(undefined, controller.signal)
    return () => controller.abort()
  }, [mode, refresh])

  const display = mode === 'sample' ? sample : activity
  const latest = display?.events[0]

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-slate-100">
      <nav className="mb-8 text-sm"><a href="/" className="text-cyan-300 underline">← Live video dashboard</a></nav>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-cyan-300">Ring · caretaking</p>
          <h1 className="text-3xl font-bold">Doorstep Care</h1>
          <p className="mt-2 max-w-xl text-slate-300">A quiet activity log for a shared front door. Review motion and doorbell events without opening a live camera feed.</p>
        </div>
        <span className="rounded-full border border-slate-600 px-3 py-1 text-sm">{mode === 'sample' ? 'SAMPLE DATA · NOT RING' : 'RING API'}</span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" aria-label="Data source">
        <button type="button" aria-pressed={mode === 'ring'} onClick={() => setMode('ring')}
          className={`rounded-lg px-4 py-2 ${mode === 'ring' ? 'bg-cyan-300 text-slate-950' : 'bg-slate-700'}`}>Ring activity</button>
        <button type="button" aria-pressed={mode === 'sample'} onClick={() => { setMode('sample'); setError('') }}
          className={`rounded-lg px-4 py-2 ${mode === 'sample' ? 'bg-cyan-300 text-slate-950' : 'bg-slate-700'}`}>Offline sample</button>
      </div>

      {mode === 'ring' && <div className="mb-6 flex flex-wrap items-end gap-3">
        {activity && activity.devices.length > 0 && <label className="flex flex-col gap-1 text-sm" htmlFor="care-device">
          Device
          <select id="care-device" value={selectedId} onChange={event => refresh(event.target.value)}
            className="rounded-lg bg-slate-700 px-3 py-2 text-white">
            {activity.devices.map(device => <option key={device.id} value={device.id}>{device.name}</option>)}
          </select>
        </label>}
        <button type="button" onClick={() => refresh(selectedId || undefined)} disabled={loading}
          className="rounded-lg border border-cyan-300 px-4 py-2 text-cyan-300 disabled:opacity-50">Refresh activity</button>
      </div>}

      {loading && mode === 'ring' && <p role="status" className="mb-4">Loading Ring activity…</p>}
      {error && mode === 'ring' && <p role="alert" className="mb-4 rounded-lg border border-rose-500 p-4 text-rose-200">{error}</p>}

      {display && <>
        <section aria-label="Latest recorded event" className="mb-6 rounded-xl border border-slate-600 bg-slate-800 p-6">
          <p className="text-sm uppercase tracking-wide text-slate-400">Last recorded door activity</p>
          <p className="mt-2 text-2xl font-semibold">{latest ? eventLabels[latest.kind] : 'No events returned'}</p>
          {latest && <p className="mt-2 text-slate-300">{new Date(latest.start).toLocaleString()}</p>}
          <p className="mt-3 text-sm text-slate-400">Checked {new Date(display.fetchedAt).toLocaleTimeString()} · Manual refresh · First history page only</p>
        </section>
        <section aria-label="Activity timeline">
          <h2 className="mb-3 text-xl font-semibold">Recent events</h2>
          {display.events.length === 0 ? <p className="rounded-lg border border-slate-700 p-4">Nothing returned yet. Ring only shares history after app consent; this does not mean no one visited.</p> :
            <ol className="space-y-2">{display.events.map(event => <li key={event.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800 p-4">
              <span>{eventLabels[event.kind]}</span><time dateTime={new Date(event.start).toISOString()} className="text-slate-300">{new Date(event.start).toLocaleString()}</time>
            </li>)}</ol>}
          {display.hasMore && <p className="mt-3 text-sm text-slate-400">Older events exist; this demo displays only the first page.</p>}
        </section>
      </>}
      <p className="mt-8 border-t border-slate-700 pt-4 text-sm text-slate-400">This is an activity aid, not a safety monitor or emergency service. Motion does not identify a person, and missing events do not prove an absence. No video or personal information is stored by this demo.</p>
    </main>
  )
}

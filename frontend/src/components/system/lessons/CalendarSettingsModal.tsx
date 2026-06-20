'use client'
import { useState } from 'react'
import { X as XIcon, Bell, Plus, Pencil, Trash2, Clock, User, GraduationCap, Settings2 } from 'lucide-react'

const BORDER   = 'rgb(var(--border-default,229 233 240))'
const NAVY     = 'rgb(11 31 58)'
const MUTED    = 'rgb(90 100 112)'
const TEAL_50  = '#F0FDFA'
const TEAL_100 = '#CCFBF1'
const TEAL_600 = '#0d9488'

/* Persisted client-side for now; scheduled sending is a follow-up (see plan). */
const STORAGE_KEY = 'system.calendar.reminders'

type Unit = 'minutes' | 'hours' | 'days'

interface Reminder {
  id: string
  offset: number
  unit: Unit
  template: string
  toStudent: boolean
  toTeacher: boolean
  enabled: boolean
}

function loadReminders(): Reminder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Reminder[]) : []
  } catch {
    return []
  }
}

function saveReminders(list: Reminder[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

function offsetLabel(r: Reminder): string {
  return `${r.offset} ${r.unit.replace(/s$/, '')}${r.offset === 1 ? '' : 's'} before`
}

const inp = 'px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white'

interface Props {
  open: boolean
  onClose: () => void
}

export function CalendarSettingsModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<'general' | 'reminders'>('reminders')
  // Seeded once on mount — the parent mounts this modal fresh each time it opens.
  const [reminders, setReminders] = useState<Reminder[]>(() => loadReminders())
  const [editing, setEditing] = useState<Reminder | null>(null)

  function persist(next: Reminder[]) {
    setReminders(next)
    saveReminders(next)
  }

  function blankReminder(): Reminder {
    // Avoid Date.now() — derive a stable-enough id from the current list.
    const id = `r${reminders.length + 1}_${reminders.reduce((a, r) => a + r.id.length, 0)}`
    return { id, offset: 1, unit: 'hours', template: 'Reminder: Lesson with {{teacherName}} — {{date}} at {{time}}', toStudent: true, toTeacher: false, enabled: true }
  }

  function upsert(r: Reminder) {
    const exists = reminders.some(x => x.id === r.id)
    persist(exists ? reminders.map(x => (x.id === r.id ? r : x)) : [...reminders, r])
    setEditing(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ background: 'rgba(11,31,58,0.35)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
        <div className="h-0.5" style={{ background: `linear-gradient(to right, ${TEAL_600}, #2DD4BF, transparent)` }} />
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: NAVY }}>📅 Calendar Settings</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5" aria-label="Close">
              <XIcon size={16} style={{ color: MUTED }} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl border overflow-hidden mb-5" style={{ borderColor: BORDER }}>
            <button
              onClick={() => setTab('general')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors"
              style={{ background: tab === 'general' ? TEAL_50 : '#fff', color: tab === 'general' ? TEAL_600 : MUTED }}
            >
              <Settings2 size={14} /> General
            </button>
            <button
              onClick={() => setTab('reminders')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors"
              style={{ background: tab === 'reminders' ? TEAL_50 : '#fff', color: tab === 'reminders' ? TEAL_600 : MUTED, borderLeft: `1px solid ${BORDER}` }}
            >
              <Bell size={14} /> Reminders
            </button>
          </div>

          {tab === 'general' && (
            <div className="rounded-xl border p-5 text-sm" style={{ borderColor: BORDER, color: MUTED }}>
              <p>General calendar preferences (default view, working hours) are managed from the toolbar. More options coming soon.</p>
            </div>
          )}

          {tab === 'reminders' && (
            <div>
              {!editing && (
                <button
                  onClick={() => setEditing(blankReminder())}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mb-4 transition-opacity hover:opacity-90"
                  style={{ background: TEAL_600 }}
                >
                  <Plus size={15} /> Add Reminder
                </button>
              )}

              {/* Editor */}
              {editing && (
                <div className="rounded-xl border p-4 mb-4 space-y-3" style={{ borderColor: TEAL_100, background: TEAL_50 }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: MUTED }}>Remind</span>
                    <input
                      type="number" min={1}
                      className={inp} style={{ borderColor: BORDER, width: 72 }}
                      value={editing.offset}
                      onChange={e => setEditing({ ...editing, offset: Math.max(1, Number(e.target.value)) })}
                    />
                    <select
                      className={inp} style={{ borderColor: BORDER }}
                      value={editing.unit}
                      onChange={e => setEditing({ ...editing, unit: e.target.value as Unit })}
                    >
                      <option value="minutes">minutes</option>
                      <option value="hours">hours</option>
                      <option value="days">days</option>
                    </select>
                    <span className="text-sm" style={{ color: MUTED }}>before</span>
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: MUTED }}>Message template</label>
                    <textarea
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
                      style={{ borderColor: BORDER }} rows={2}
                      value={editing.template}
                      onChange={e => setEditing({ ...editing, template: e.target.value })}
                    />
                    <p className="text-xs mt-1" style={{ color: MUTED }}>Placeholders: {'{{teacherName}}'}, {'{{studentName}}'}, {'{{date}}'}, {'{{time}}'}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: NAVY }}>
                      <input type="checkbox" checked={editing.toStudent} onChange={e => setEditing({ ...editing, toStudent: e.target.checked })} />
                      <User size={13} /> Student / Parent
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: NAVY }}>
                      <input type="checkbox" checked={editing.toTeacher} onChange={e => setEditing({ ...editing, toTeacher: e.target.checked })} />
                      <GraduationCap size={13} /> Teacher
                    </label>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditing(null)} className="px-4 py-1.5 rounded-lg text-sm font-medium border" style={{ borderColor: BORDER, color: NAVY }}>Cancel</button>
                    <button onClick={() => upsert(editing)} className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: TEAL_600 }}>Save Reminder</button>
                  </div>
                </div>
              )}

              {/* List */}
              {reminders.length === 0 && !editing ? (
                <p className="text-sm text-center py-6" style={{ color: MUTED }}>No reminders yet.</p>
              ) : (
                <div className="space-y-2">
                  {reminders.map(r => (
                    <div key={r.id} className="rounded-xl border p-3.5" style={{ borderColor: BORDER }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: TEAL_600 }}>
                          <Clock size={14} /> {offsetLabel(r)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => persist(reminders.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}
                            className="relative rounded-full transition-colors"
                            style={{ width: 32, height: 18, background: r.enabled ? TEAL_600 : 'rgb(209 213 219)' }}
                            aria-label="Toggle reminder"
                          >
                            <span className="absolute top-0.5 rounded-full bg-white shadow transition-transform" style={{ width: 14, height: 14, left: 2, transform: r.enabled ? 'translateX(14px)' : 'translateX(0)' }} />
                          </button>
                          <button onClick={() => setEditing(r)} className="p-1 rounded-lg hover:bg-black/5" aria-label="Edit"><Pencil size={14} style={{ color: MUTED }} /></button>
                          <button onClick={() => persist(reminders.filter(x => x.id !== r.id))} className="p-1 rounded-lg hover:bg-red-50" aria-label="Delete"><Trash2 size={14} style={{ color: '#DC2626' }} /></button>
                        </div>
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: MUTED }}>{r.template}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: MUTED }}>
                        {r.toStudent && <span className="inline-flex items-center gap-1"><User size={12} /> Student / Parent</span>}
                        {r.toTeacher && <span className="inline-flex items-center gap-1"><GraduationCap size={12} /> Teacher</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export interface AuditLogEntry {
  id:           number | string
  at:           string
  source:       'audit' | 'activity'
  actor:        string
  action:       string
  target_type:  string | null
  target_id:    number | string | null
  target_label: string | null
  diff:         unknown | null
}

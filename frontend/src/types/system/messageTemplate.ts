export interface MessageTemplate {
  id: number
  key: string
  channel: 'whatsapp' | 'email'
  label: string
  subject: string | null
  body: string
  available_variables: string[]
  example_values: Record<string, string> | null
  is_active: boolean
  updated_at: string
}

export interface SystemUser {
  id: number
  name: string
  email: string
  role: string
  roles: string[]
  permissions: string[]
  is_active: boolean
  last_login_at: string | null
  invite_pending: boolean
  teacher_id?: number | null
  phone?: string | null
  whatsapp?: string | null
  created_at: string
}

export interface RoleData {
  id: number
  name: string
  users_count: number
  permissions: string[]
}

export interface PermissionGroup {
  group: string
  actions: string[]
}

export interface RolesResponse {
  roles: RoleData[]
  permission_groups: PermissionGroup[]
}

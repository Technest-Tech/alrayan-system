export interface XPaySettings {
  enabled: boolean
  community_id: string
  variable_amount_id: string
  redirect_url: string
  webhook_url: string
}

export interface XPayInitiateResponse {
  iframe_url: string
  transaction_uuid: string | null
}

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

// Web3Forms access keys are designed to be used in browser-side submissions.
const WEB3FORMS_ACCESS_KEY = '25b8b327-044e-45c2-afd4-85fac94daac4'

type Web3FormsResponse = {
  success?: boolean
  message?: string
  body?: {
    message?: string
  }
}

export type Web3FormsFields = Record<string, string>

export async function sendWeb3FormsNotification(fields: Web3FormsFields): Promise<void> {
  const response = await fetch(WEB3FORMS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      from_name: 'Azhary Academy Website',
      ...fields,
    }),
  })

  const result = (await response.json().catch(() => null)) as Web3FormsResponse | null

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message ??
        result?.body?.message ??
        'The email notification could not be delivered.',
    )
  }
}

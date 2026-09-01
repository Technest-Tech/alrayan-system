import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendWeb3FormsNotification } from './web3forms'

describe('sendWeb3FormsNotification', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the access key and submitted fields to Web3Forms', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await sendWeb3FormsNotification({
      subject: 'New contact message',
      name: 'Fatima',
      email: 'fatima@example.com',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.web3forms.com/submit',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
    )

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(String(request.body))).toMatchObject({
      access_key: '25b8b327-044e-45c2-afd4-85fac94daac4',
      from_name: 'Azhary Academy Website',
      subject: 'New contact message',
      name: 'Fatima',
      email: 'fatima@example.com',
    })
  })

  it('throws when Web3Forms reports a failed delivery', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: false,
          message: 'Invalid access key',
        }),
      }),
    )

    await expect(
      sendWeb3FormsNotification({
        subject: 'New contact message',
        name: 'Fatima',
        email: 'fatima@example.com',
      }),
    ).rejects.toThrow('Invalid access key')
  })
})

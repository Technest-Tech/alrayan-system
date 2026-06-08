'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * XPay redirects to this page inside the payment iframe after the user
 * completes (or cancels) a card payment.
 *
 * It immediately fires a postMessage to the parent window so the
 * /pay/[token] page can close the overlay and refresh the invoice.
 */
export default function XPayReturnPage() {
  const params = useSearchParams()

  useEffect(() => {
    const status = params.get('transaction_status') ?? params.get('status') ?? 'UNKNOWN'

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'xpay_result', status }, '*')
    }
  }, [params])

  const status = params.get('transaction_status') ?? params.get('status') ?? ''
  const isSuccess = status === 'SUCCESSFUL'

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="text-center max-w-xs">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Payment successful</p>
            <p className="text-sm text-gray-400">Closing…</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Payment not completed</p>
            <p className="text-sm text-gray-400">You can try again or use another method.</p>
          </>
        )}
      </div>
    </div>
  )
}

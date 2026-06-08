'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MessageCircle, Download } from 'lucide-react'
import { siteConfig } from '@/config/site'

interface PaidInvoice {
  invoice_number: string
  student_name: string | null
  course_name: string | null
  total_minor: number
  currency: string
  paid_at: string | null
}

function formatMinor(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      minimumFractionDigits: (minor / 100) % 1 === 0 ? 0 : 2,
    }).format(minor / 100)
  } catch {
    return `${currency} ${(minor / 100).toLocaleString()}`
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function IslamicBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="bg" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <polygon
              points="50,20 54.8,37.5 67.2,27.9 59.3,43.4 77.5,43.4 63.4,52 72.1,67.2 55.7,60.7 50,80 44.3,60.7 27.9,67.2 36.6,52 22.5,43.4 40.7,43.4 32.8,27.9 45.2,37.5"
              fill="none" stroke="rgba(201,169,64,0.25)" strokeWidth="0.7"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)" />
      </svg>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-80 opacity-20 rounded-full"
        style={{ background: 'radial-gradient(ellipse, #c9a940 0%, transparent 70%)' }} />
    </div>
  )
}

export default function PaymentSuccessPage() {
  const params   = useParams()
  const token    = params?.token as string
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

  const [invoice,     setInvoice]     = useState<PaidInvoice | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/api/system/pay/${token}`, { headers: { Accept: 'application/json' } })
      .then(async r => {
        if (!r.ok) return
        const data = (await r.json()).data
        setInvoice({
          invoice_number: data.invoice_number,
          student_name:   data.student_name,
          course_name:    data.course_name,
          total_minor:    data.total_minor,
          currency:       data.currency,
          paid_at:        data.paid_at,
        })
      })
      .catch(() => {})
  }, [token, API_BASE])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const r = await fetch(`${API_BASE}/api/system/pay/${token}/pdf`, { headers: { Accept: 'application/pdf' } })
      if (!r.ok) throw new Error()
      const url = URL.createObjectURL(await r.blob())
      Object.assign(document.createElement('a'), {
        href: url,
        download: `${invoice?.invoice_number ?? 'invoice'}.pdf`,
      }).click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
    finally { setDownloading(false) }
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#0b3222' }}>
      <IslamicBackground />

      <div className="relative z-10 w-full max-w-sm">

        {/* Bismillah */}
        <p className="text-center text-lg mb-8 leading-relaxed"
          style={{
            color: '#e8c96a',
            fontFamily: '"Amiri", "Scheherazade New", Georgia, serif',
            textShadow: '0 0 24px rgba(201,169,64,0.45)',
            letterSpacing: '0.04em',
          }}>
          بسم الله الرحمن الرحيم
        </p>

        {/* Card */}
        <div className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: '#faf8f2', border: '1px solid rgba(201,169,64,0.25)' }}>

          {/* Green hero */}
          <div className="relative px-8 pt-10 pb-12 text-center"
            style={{ background: 'linear-gradient(155deg, #052e16 0%, #14532d 55%, #166534 100%)' }}>

            {/* Animated checkmark circle */}
            <div className="relative mx-auto mb-5 w-20 h-20">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: '#22c55e' }} />
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(134,239,172,0.4)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                  stroke="#86efac" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-black text-white mb-1">Payment Confirmed</h1>
            {invoice?.student_name && (
              <p className="text-sm font-medium mb-4" style={{ color: 'rgba(134,239,172,0.8)' }}>
                Jazak Allahu khairan, {invoice.student_name.split(' ')[0]}!
              </p>
            )}

            {invoice && (
              <div className="inline-flex flex-col items-center">
                <span className="text-[2.8rem] font-black tracking-tight leading-none"
                  style={{ color: '#86efac' }}>
                  {formatMinor(invoice.total_minor, invoice.currency)}
                </span>
                {invoice.paid_at && (
                  <span className="text-xs mt-2 font-medium" style={{ color: 'rgba(134,239,172,0.6)' }}>
                    Paid on {fmtDate(invoice.paid_at)}
                  </span>
                )}
              </div>
            )}

            <div className="absolute -bottom-px left-[-3%] right-[-3%] h-8 rounded-t-[50%]"
              style={{ background: '#faf8f2' }} />
          </div>

          {/* Details */}
          {invoice && (
            <div className="px-7 pt-6 pb-4 space-y-3">
              {invoice.invoice_number && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#a08c65' }}>Invoice</span>
                  <span className="font-semibold text-gray-800">{invoice.invoice_number}</span>
                </div>
              )}
              {invoice.course_name && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#a08c65' }}>Course</span>
                  <span className="font-semibold text-gray-800">{invoice.course_name}</span>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 px-7 py-1">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,64,0.4))' }} />
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <polygon points="9,1 10.4,6.6 16,8 10.4,9.4 9,16 7.6,9.4 2,8 7.6,6.6" fill="#c9a940" opacity="0.5" />
            </svg>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(201,169,64,0.4))' }} />
          </div>

          {/* Actions */}
          <div className="px-6 pt-3 pb-6 space-y-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-amber-50 disabled:opacity-50"
              style={{ border: '1px solid #e8d5a0', color: '#8a6a30' }}
            >
              {downloading
                ? <span className="w-4 h-4 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                : <Download size={14} />}
              {downloading ? 'Preparing…' : 'Download Receipt'}
            </button>

            <a
              href={`https://wa.me/${siteConfig.whatsapp}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#25D366' }}
            >
              <MessageCircle size={14} />
              Contact us on WhatsApp
            </a>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 text-center rounded-b-3xl"
            style={{ background: '#f5edd8', borderTop: '1px solid #e2ceaa' }}>
            <p className="text-[10px]" style={{ color: '#a08c65' }}>
              Your sessions will be confirmed shortly. May Allah bless your learning.
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] mt-5" style={{ color: 'rgba(255,255,255,0.18)' }}>
          © {new Date().getFullYear()} {siteConfig.name} · All rights reserved
        </p>
      </div>
    </div>
  )
}

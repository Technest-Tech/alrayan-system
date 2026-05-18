'use client'
import { useState, useCallback, useEffect } from 'react'
import { Menu, Search } from 'lucide-react'
import { Breadcrumbs } from './Breadcrumbs'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { CommandPalette } from './CommandPalette'

interface TopbarProps {
  onToggleSidebar: () => void
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const [cmdOpen, setCmdOpen] = useState(false)
  const closePalette = useCallback(() => setCmdOpen(false), [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <header
        className="sticky top-0 z-30 h-[60px] flex items-center gap-4 px-4 border-b"
        style={{
          background: 'rgb(var(--surface-topbar, 255 255 255))',
          borderColor: 'rgb(var(--border-default, 229 233 240))',
        }}
      >
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-black/5 transition-colors"
        >
          <Menu size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <Breadcrumbs />
        </div>

        <button
          onClick={() => setCmdOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm opacity-50 hover:opacity-70 transition-opacity"
          style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
        >
          <Search size={14} />
          <span>Search</span>
          <kbd
            className="ml-2 text-xs px-1.5 py-0.5 rounded border"
            style={{ borderColor: 'rgb(var(--border-default, 229 233 240))' }}
          >
            ⌘K
          </kbd>
        </button>

        <NotificationBell />
        <UserMenu />
      </header>

      <CommandPalette open={cmdOpen} onClose={closePalette} />
    </>
  )
}

// The Settings area is a single centralized page (settings/page.tsx) that owns
// its own hero header and in-page tabs. This layout just passes children through
// so legacy /settings/* sub-routes still render standalone if linked directly.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import { redirect } from 'next/navigation'

// General settings now live as a tab inside the centralized Settings page.
// Keep this route as a redirect so old links/bookmarks don't land on a dead page.
export default function AcademyRedirect() {
  redirect('/settings')
}

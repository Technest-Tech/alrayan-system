import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="flex-1 flex items-center justify-center section bg-cream">
        <Container>
          <div className="text-center max-w-lg mx-auto">
            <p className="font-arabic text-accent text-4xl mb-4" dir="rtl" lang="ar" aria-hidden="true">
              الريان
            </p>
            <h1 className="heading-xl font-display text-primary mb-4">Page Not Found</h1>
            <p className="text-muted-text text-lg mb-8">
              We couldn&apos;t find what you were looking for. Let us help you find the right course.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/">Back to Home</LinkButton>
              <LinkButton href="/courses" variant="outline">Browse Courses</LinkButton>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'
import { courses } from '@/content/courses'
import {
  BookOpen,
  Star,
  Mic,
  Brain,
  Award,
  Globe,
  Lightbulb,
  BookMarked,
  Layers,
  Heart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const metadata: Metadata = buildMetadata({
  title: 'Online Quran & Arabic Courses | Alrayan Academy',
  description:
    'Browse all Quran, Tajweed, Hifz, Arabic, and Islamic Studies courses. 1-on-1 online classes with certified teachers. Free trial available.',
  path: '/courses',
})

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Star,
  Mic,
  Brain,
  Award,
  Globe,
  Lightbulb,
  BookMarked,
  Layers,
  Heart,
}

const levelColors: Record<string, string> = {
  'Beginner': 'bg-green-100 text-green-800',
  'Intermediate': 'bg-amber-100 text-amber-800',
  'Advanced': 'bg-red-100 text-red-800',
  'All Levels': 'bg-blue-100 text-blue-800',
}

export default function CoursesPage() {
  const crumbs = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      {/* ── Hero ── */}
      <section
        className="relative bg-primary overflow-hidden pt-40 pb-20"
        aria-labelledby="courses-index-heading"
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">
            All Courses
          </p>
          <h1
            id="courses-index-heading"
            className="heading-display font-display text-white text-balance mb-6 max-w-4xl mx-auto"
          >
            Learn Quran, Arabic &amp; Islamic Studies Online
          </h1>
          <p className="text-white/70 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Every program is 1-on-1 with a certified teacher — scheduled around your life, at your pace.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <LinkButton href="/contact" size="lg" variant="gold">
              Book Free Trial Class
            </LinkButton>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white text-base font-medium hover:border-accent hover:text-accent transition-colors"
            >
              Chat on WhatsApp
            </a>
          </div>
        </Container>
      </section>

      {/* ── Courses Grid ── */}
      <Section bg="cream" aria-labelledby="all-courses-heading">
        <Container>
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              11 Programs
            </p>
            <h2 id="all-courses-heading" className="heading-xl font-heading text-primary mb-4">
              Find the Right Program for You
            </h2>
            <p className="text-muted-text text-lg max-w-xl mx-auto">
              From complete beginners to advanced students seeking Ijazah — every program is
              available 1-on-1 with a certified teacher.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
            {courses.map(({ slug, title, shortDescription, icon, level, ageGroup, durationMonths, features }) => {
              const Icon = iconMap[icon] ?? BookOpen
              const levelColor = levelColors[level] ?? levelColors['All Levels']
              return (
                <li key={slug}>
                  <a
                    href={`/courses/${slug}`}
                    className="group flex flex-col h-full bg-white rounded-2xl p-7 border border-border-soft shadow-soft hover:shadow-md hover:border-secondary/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                        <Icon className="size-5 text-secondary" aria-hidden="true" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${levelColor}`}>
                          {level}
                        </span>
                        {ageGroup && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                            {ageGroup}
                          </span>
                        )}
                        {durationMonths && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                            {durationMonths} mo
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-heading font-semibold text-primary text-lg mb-2">{title}</h3>
                    <p className="text-muted-text text-sm leading-relaxed mb-4 flex-1">{shortDescription}</p>

                    <ul className="space-y-1 mb-5" aria-label={`${title} features`}>
                      {features.slice(0, 2).map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-text">
                          <span className="size-1.5 rounded-full bg-secondary shrink-0" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <span className="flex items-center justify-between text-secondary text-sm font-semibold">
                      Learn more
                      <span
                        className="text-xl font-display group-hover:translate-x-1 transition-transform"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </Container>
      </Section>

      {/* ── CTA Banner ── */}
      <Section bg="primary" aria-labelledby="courses-cta-heading">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-arabic text-accent text-2xl mb-4" dir="rtl" lang="ar" aria-hidden="true">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <p className="text-white/60 text-sm italic mb-8">
              &ldquo;The best of you are those who learn the Quran and teach it.&rdquo; — Prophet Muhammad ﷺ
            </p>
            <h2 id="courses-cta-heading" className="heading-xl font-display text-white mb-4">
              Start With a Free Trial Class
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Pick any course and book your first class completely free — no credit card, no commitment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/contact" size="lg" variant="gold">
                Book Free Trial Class
              </LinkButton>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white font-medium hover:border-accent hover:text-accent transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { courseSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { StickyCourseCta } from '@/components/courses/StickyCourseCta'
import { whatsappLink } from '@/config/site'
import { courses } from '@/content/courses'
import { teachers, featuredTeachers } from '@/content/teachers'
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
  CheckCircle2,
  UserCheck,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const course = courses.find((c) => c.slug === slug)
  if (!course) return {}
  return buildMetadata({
    title: course.seoTitle,
    description: course.seoDescription,
    path: `/courses/${slug}`,
  })
}

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
  'Beginner': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Intermediate': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Advanced': 'bg-red-500/20 text-red-300 border-red-500/30',
  'All Levels': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params
  const course = courses.find((c) => c.slug === slug)
  if (!course) notFound()

  const courseTeachers = (() => {
    const filtered = teachers.filter((t) =>
      t.specialties.some((s) => course.specialtyTags.includes(s)),
    )
    return filtered.length > 0 ? filtered.slice(0, 4) : featuredTeachers.slice(0, 3)
  })()

  const relatedCourses = course.relatedSlugs
    .map((s) => courses.find((c) => c.slug === s))
    .filter(Boolean) as typeof courses

  const schemas = [
    courseSchema(course),
    breadcrumbSchema([
      { name: 'Home', href: '/' },
      { name: 'Courses', href: '/courses' },
      { name: course.title, href: `/courses/${course.slug}` },
    ]),
    faqSchema(course.faqs),
  ]

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* ── Hero ── */}
      <section
        className="relative bg-primary overflow-hidden pt-40 pb-20"
        aria-labelledby="course-heading"
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <Container className="relative">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-white/50 text-sm flex-wrap">
              <li><Link href="/" className="hover:text-white/80 transition-colors">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/courses" className="hover:text-white/80 transition-colors">Courses</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-white/80" aria-current="page">{course.title}</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <h1 id="course-heading" className="heading-display font-display text-white text-balance mb-6">
              {course.title}
            </h1>
            <p className="text-white/80 text-xl leading-relaxed mb-8">
              {course.longDescription}
            </p>

            {/* Meta bar */}
            <div className="flex flex-wrap gap-3 mb-10" role="list" aria-label="Course details">
              <span
                role="listitem"
                className={`border rounded-full px-4 py-1.5 text-sm font-medium ${levelColors[course.level] ?? levelColors['All Levels']}`}
              >
                {course.level}
              </span>
              {course.durationMonths && (
                <span role="listitem" className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm">
                  {course.durationMonths} months
                </span>
              )}
              {course.ageGroup && (
                <span role="listitem" className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm">
                  {course.ageGroup}
                </span>
              )}
              <span role="listitem" className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm">
                1-on-1 · Online
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <LinkButton href="/contact" size="lg" variant="gold">
                Book Free Trial Class
              </LinkButton>
              <a
                href={whatsappLink(`I'm interested in the ${course.title} course`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/30 text-white text-base font-medium hover:border-accent hover:text-accent transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>

            <p className="text-white/50 text-sm">
              ✓ Free first class · ✓ No credit card required · ✓ Cancel anytime
            </p>
          </div>
        </Container>
      </section>

      {/* ── What You'll Learn ── */}
      <Section bg="cream" aria-labelledby="outcomes-heading">
        <Container>
          <div className="mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              What You&apos;ll Learn
            </p>
            <h2 id="outcomes-heading" className="heading-xl font-heading text-primary">
              Course Outcomes
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list">
            {course.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-primary font-medium leading-snug">{outcome}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── Curriculum ── */}
      <Section aria-labelledby="curriculum-heading">
        <Container>
          <div className="mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Curriculum
            </p>
            <h2 id="curriculum-heading" className="heading-xl font-heading text-primary">
              What&apos;s Covered
            </h2>
          </div>
          <div className="border border-border-soft rounded-2xl overflow-hidden divide-y divide-border-soft max-w-3xl">
            <Accordion multiple>
              {course.curriculum.map((item, i) => (
                <AccordionItem key={item.module} value={String(i)}>
                  <AccordionTrigger className="px-6 py-4 text-base hover:no-underline">
                    <span className="flex items-center gap-3 text-left">
                      <span
                        className="size-7 rounded-full bg-secondary/10 text-secondary text-sm font-bold flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <span className="font-semibold text-primary">{item.module}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <ul className="pl-10 space-y-2 pb-4" role="list">
                      {item.topics.map((topic) => (
                        <li key={topic} className="flex items-center gap-2 text-muted-text text-sm">
                          <span className="size-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </Section>

      {/* ── Who This Is For ── */}
      <Section bg="cream" aria-labelledby="personas-heading">
        <Container>
          <div className="mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Is This Course Right for You?
            </p>
            <h2 id="personas-heading" className="heading-xl font-heading text-primary">
              Who This Is For
            </h2>
          </div>
          <ul
            className={`grid grid-cols-1 gap-6 ${course.personas.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}
            role="list"
          >
            {course.personas.map(({ title, description }) => (
              <li
                key={title}
                className="bg-white rounded-2xl p-6 border border-border-soft flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <UserCheck className="size-5 text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">{title}</h3>
                  <p className="text-muted-text text-sm leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── Teachers Strip ── */}
      <Section aria-labelledby="course-teachers-heading">
        <Container>
          <div className="text-center mb-12">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Your Teachers
            </p>
            <h2 id="course-teachers-heading" className="heading-xl font-heading text-primary mb-4">
              Who You&apos;ll Learn From
            </h2>
            <p className="text-muted-text text-lg max-w-xl mx-auto">
              Al-Azhar graduates and Ijazah-certified scholars — vetting takes months, trust takes years.
            </p>
          </div>

          <ul
            className={`grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 ${courseTeachers.length >= 4 ? 'lg:grid-cols-4' : courseTeachers.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}
            role="list"
          >
            {courseTeachers.map((teacher) => (
              <li key={teacher.id}>
                <div className="bg-cream rounded-2xl p-6 border border-border-soft text-center h-full">
                  <div
                    className="size-16 rounded-full bg-primary flex items-center justify-center text-accent font-display font-semibold text-2xl mx-auto mb-4"
                    aria-hidden="true"
                  >
                    {teacher.name.charAt(0)}
                  </div>
                  <p className="font-heading font-semibold text-primary text-sm">{teacher.name}</p>
                  <p className="text-secondary text-xs font-medium mt-1 mb-3">{teacher.role}</p>
                  <div className="flex flex-wrap justify-center gap-1 mb-3">
                    {teacher.specialties.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-white text-muted-text px-2.5 py-0.5 rounded-full border border-border-soft"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-muted-text text-xs">
                    {teacher.yearsExperience} years · {teacher.studentsCount}+ students
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <LinkButton href="/about" variant="outline">
              <span className="flex items-center gap-2">
                Meet All Our Teachers
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </LinkButton>
          </div>
        </Container>
      </Section>

      {/* ── Pricing Teaser ── */}
      <Section bg="cream" aria-labelledby="pricing-teaser-heading">
        <Container>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 translate-x-12 -translate-y-12"
                aria-hidden="true"
              />
              <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-4 relative">
                Pricing
              </p>
              <h2 id="pricing-teaser-heading" className="heading-xl font-display text-white mb-4 relative">
                Affordable, Flexible Pricing
              </h2>
              <p className="text-white/70 mb-8 relative">
                Pay only for the classes you take. No hidden fees, no long-term contracts.
              </p>
              <LinkButton href="/pricing" variant="gold" className="relative">
                View Pricing
              </LinkButton>
            </div>

            <div className="bg-white border border-border-soft rounded-2xl p-8">
              <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-6">
                Included in every plan
              </p>
              <ul className="space-y-4" role="list">
                {[
                  'First class completely free',
                  'No long-term contracts',
                  'Cancel or pause anytime',
                  'Family discount available',
                  'Switch teachers if needed',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-primary">
                    <CheckCircle2 className="size-5 text-secondary shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── FAQ ── */}
      <Section aria-labelledby="faq-heading">
        <Container>
          <div className="mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Frequently Asked Questions
            </p>
            <h2 id="faq-heading" className="heading-xl font-heading text-primary">
              Common Questions About {course.title}
            </h2>
          </div>
          <div className="border border-border-soft rounded-2xl overflow-hidden divide-y divide-border-soft max-w-3xl">
            <Accordion multiple>
              {course.faqs.map((faq, i) => (
                <AccordionItem key={i} value={String(i)}>
                  <AccordionTrigger className="px-6 py-4 text-base font-semibold text-primary hover:no-underline text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <p className="text-muted-text text-sm leading-relaxed pb-4">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </Section>

      {/* ── Related Courses ── */}
      <Section bg="cream" aria-labelledby="related-heading">
        <Container>
          <div className="mb-10">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Keep Exploring
            </p>
            <h2 id="related-heading" className="heading-xl font-heading text-primary">
              You Might Also Like
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6" role="list">
            {relatedCourses.map(({ slug: rSlug, title, shortDescription, icon }) => {
              const RelatedIcon = iconMap[icon] ?? BookOpen
              return (
                <li key={rSlug}>
                  <a
                    href={`/courses/${rSlug}`}
                    className="group flex flex-col h-full bg-white rounded-2xl p-7 border border-border-soft shadow-soft hover:shadow-md hover:border-secondary/30 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <RelatedIcon className="size-5 text-secondary" aria-hidden="true" />
                      </div>
                      <span
                        className="text-accent text-xl font-display group-hover:translate-x-1 transition-transform"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-primary text-lg mb-2">{title}</h3>
                    <p className="text-muted-text text-sm leading-relaxed flex-1">{shortDescription}</p>
                    <span className="mt-4 text-secondary text-sm font-semibold">Learn more</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </Container>
      </Section>

      {/* ── CTA Banner ── */}
      <Section bg="primary" aria-labelledby="course-cta-heading">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-arabic text-accent text-2xl mb-4" dir="rtl" lang="ar" aria-hidden="true">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <p className="text-white/60 text-sm italic mb-8">
              &ldquo;The best of you are those who learn the Quran and teach it.&rdquo; — Prophet Muhammad ﷺ
            </p>
            <h2 id="course-cta-heading" className="heading-xl font-display text-white mb-4">
              Start Your {course.title} Journey Today
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Book your free first class. No credit card, no commitment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/contact" size="lg" variant="gold">
                Book Free Trial Class
              </LinkButton>
              <a
                href={whatsappLink(`I'm interested in the ${course.title} course`)}
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

      {/* Spacer so sticky bar doesn't overlap content on mobile */}
      <div className="h-20 lg:hidden" aria-hidden="true" />

      <StickyCourseCta courseTitle={course.title} />
    </>
  )
}

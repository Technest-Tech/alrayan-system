import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { aboutPageSchema, personSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'
import { aboutContent } from '@/content/about'
import { teachers } from '@/content/teachers'
import {
  Target,
  Eye,
  Heart,
  Link,
  ShieldCheck,
  Users,
  BookOpen,
  Star,
} from 'lucide-react'

export const metadata: Metadata = buildMetadata({
  title: 'About Azhary | Our Story, Mission & Teachers',
  description:
    'Learn how Azhary connects Muslims worldwide with Al-Azhar certified Quran teachers. Our story, mission, teaching approach, and full teacher team.',
  path: '/about',
})

const iconMap: Record<string, React.ElementType> = {
  Target,
  Eye,
  Heart,
  Link,
  ShieldCheck,
  Users,
  BookOpen,
  Star,
}

function IconBox({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? BookOpen
  return <Icon className={className} aria-hidden="true" />
}

export default function AboutPage() {
  const schemasJson = [
    aboutPageSchema(),
    ...teachers.map((t) => personSchema(t)),
  ]

  return (
    <>
      {schemasJson.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* ── Hero ── */}
      <section
        className="relative bg-primary overflow-hidden pt-40 pb-24"
        aria-labelledby="about-hero-heading"
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 20%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 10% 90%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />

        <Container className="relative text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">
            {aboutContent.hero.eyebrow}
          </p>
          <h1
            id="about-hero-heading"
            className="heading-display font-display text-white text-balance mb-6 max-w-4xl mx-auto"
          >
            {aboutContent.hero.heading}
          </h1>
          <p className="text-white/70 text-xl leading-relaxed max-w-2xl mx-auto">
            {aboutContent.hero.subheading}
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
            {[
              { value: '2015', label: 'Founded' },
              { value: '10,000+', label: 'Students' },
              { value: '50+', label: 'Countries' },
              { value: '100+', label: 'Teachers' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-accent text-3xl font-display font-semibold">{value}</p>
                <p className="text-white/60 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Mission / Vision / Values ── */}
      <Section aria-labelledby="mission-heading">
        <Container>
          <div className="text-center mb-14">
            <h2 id="mission-heading" className="heading-xl font-heading text-primary">
              {aboutContent.mission.heading}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {aboutContent.mission.items.map(({ title, body, icon }) => (
              <div
                key={title}
                className="bg-cream rounded-2xl p-8 border border-border-soft"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mb-5">
                  <IconBox name={icon} className="size-6 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-primary text-xl mb-3">{title}</h3>
                <p className="text-muted-text leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Story ── */}
      <Section bg="cream" aria-labelledby="story-heading">
        <Container>
          <div className="max-w-3xl mx-auto">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Our History
            </p>
            <h2 id="story-heading" className="heading-xl font-heading text-primary mb-10">
              {aboutContent.story.heading}
            </h2>

            <div className="space-y-6">
              {aboutContent.story.paragraphs.map((para, i) => (
                <p key={i} className="text-primary/80 text-lg leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            <blockquote className="mt-12 border-l-4 border-accent pl-6">
              <p
                className="font-arabic text-accent text-2xl mb-3"
                dir="rtl"
                lang="ar"
              >
                خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
              </p>
              <footer className="text-muted-text text-sm italic">
                &ldquo;The best of you are those who learn the Quran and teach it.&rdquo; — Prophet Muhammad ﷺ
              </footer>
            </blockquote>
          </div>
        </Container>
      </Section>

      {/* ── Our Approach ── */}
      <Section aria-labelledby="approach-heading">
        <Container>
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Methodology
            </p>
            <h2 id="approach-heading" className="heading-xl font-heading text-primary mb-4">
              {aboutContent.approach.heading}
            </h2>
            <p className="text-muted-text text-lg max-w-2xl mx-auto">
              {aboutContent.approach.subheading}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {aboutContent.approach.items.map(({ title, body, icon, stat }) => (
              <div
                key={title}
                className="relative bg-primary rounded-2xl p-8 text-white overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 translate-x-8 -translate-y-8"
                  aria-hidden="true"
                />
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                  <IconBox name={icon} className="size-6 text-accent" />
                </div>
                <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">
                  {stat}
                </p>
                <h3 className="font-heading font-semibold text-white text-xl mb-3">{title}</h3>
                <p className="text-white/70 leading-relaxed text-sm">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Teachers Grid ── */}
      <Section bg="cream" aria-labelledby="teachers-heading">
        <Container>
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              Our Team
            </p>
            <h2 id="teachers-heading" className="heading-xl font-heading text-primary mb-4">
              Meet Our Scholars
            </h2>
            <p className="text-muted-text text-lg max-w-xl mx-auto">
              Every teacher at Azhary holds an Ijazah or equivalent certification. Less than 10% of applicants pass our vetting process.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
            {teachers.map((teacher) => (
              <li key={teacher.id}>
                <div className="group bg-white rounded-2xl p-6 border border-border-soft shadow-soft hover:shadow-md hover:border-secondary/30 transition-all duration-200 h-full flex flex-col">
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="size-14 rounded-full bg-primary flex items-center justify-center text-accent font-display font-semibold text-xl shrink-0"
                      aria-hidden="true"
                    >
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-primary text-sm leading-tight">
                        {teacher.name}
                      </p>
                      <p className="text-secondary text-xs font-medium mt-0.5">
                        {teacher.role}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mb-4 text-xs text-muted-text">
                    <span>{teacher.yearsExperience}y exp.</span>
                    <span>·</span>
                    <span>{teacher.studentsCount}+ students</span>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {teacher.specialties.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-cream text-primary px-2.5 py-1 rounded-full border border-border-soft"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Bio — revealed on hover via group */}
                  <p className="text-muted-text text-xs leading-relaxed line-clamp-3 flex-1">
                    {teacher.bio}
                  </p>

                  {/* Languages */}
                  <p className="text-muted-text text-xs mt-4 pt-4 border-t border-border-soft">
                    Teaches in: {teacher.languages.join(', ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="text-center mt-12">
            <p className="text-muted-text mb-6">
              All teachers are available for a free trial class. No commitment required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/contact" variant="default">
                Book a Free Trial Class
              </LinkButton>
              <a
                href={whatsappLink('Assalamu alaikum, I would like to ask about your teachers.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 h-11 px-6 rounded-xl border border-border-soft text-primary text-sm font-medium hover:border-secondary hover:text-secondary transition-colors"
              >
                Ask About a Teacher
              </a>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── CTA Banner ── */}
      <Section bg="primary" aria-labelledby="about-cta-heading">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-6 fill-accent text-accent" aria-hidden="true" />
              ))}
            </div>
            <h2 id="about-cta-heading" className="heading-xl font-display text-white mb-4">
              Join 10,000+ Students Learning With Us
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Your first class is completely free. No credit card, no commitment — just a conversation about your goals.
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

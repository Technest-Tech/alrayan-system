import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { organizationSchema } from '@/lib/schema'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { whatsappLink } from '@/config/site'
import {
  BookOpen,
  Users,
  Globe,
  Star,
  ShieldCheck,
  GraduationCap,
  Heart,
  Clock,
} from 'lucide-react'

export const metadata: Metadata = buildMetadata({
  title: 'Online Quran Academy | 1-on-1 Classes | Alrayan Academy',
  description:
    'Learn Quran online with certified teachers from Al-Azhar. 1-on-1 Tajweed, Hifz, Arabic, and Islamic studies classes. Free trial available worldwide.',
  path: '/',
})

const trustBadges = [
  { icon: Users, label: '1-on-1 Classes' },
  { icon: ShieldCheck, label: 'Free First Class' },
  { icon: Heart, label: 'Female Teachers Available' },
  { icon: Globe, label: 'Native Arab Tutors' },
  { icon: GraduationCap, label: 'Ijazah-Certified' },
]

const stats = [
  { value: '10,000+', label: 'Students Taught' },
  { value: '50+', label: 'Countries Served' },
  { value: '100+', label: 'Certified Teachers' },
  { value: '4.9★', label: 'Average Rating' },
]

const courses = [
  { title: 'Noorani Qaida', desc: 'Start from the very beginning — Arabic letters, pronunciation, and Qaida rules.', href: '/courses/noorani-qaida' },
  { title: 'Quran for Kids', desc: 'Fun, structured Quran learning designed for children aged 5 to 14.', href: '/courses/quran-classes-for-kids' },
  { title: 'Tajweed Course', desc: 'Master the rules of Tajweed and recite the Quran beautifully and correctly.', href: '/courses/tajweed-course' },
  { title: 'Hifz / Memorization', desc: 'Memorize the Quran with a structured curriculum and dedicated teacher support.', href: '/courses/hifz-memorization' },
  { title: 'Ijazah Program', desc: 'Earn an authenticated Ijazah with an unbroken chain back to the Prophet ﷺ.', href: '/courses/ijazah-program' },
  { title: 'Arabic for Non-Arabs', desc: 'Learn Modern Standard Arabic and conversational Arabic from scratch.', href: '/courses/arabic-for-non-arabs' },
  { title: 'Tafseer', desc: 'Understand the meaning and wisdom behind the words of Allah.', href: '/courses/tafseer-course' },
  { title: 'Islamic Studies', desc: 'Aqeedah, Seerah, Fiqh, and Islamic history for all ages.', href: '/courses/islamic-studies' },
  { title: 'Ten Qiraat', desc: 'Advanced program covering all ten authentic modes of Quranic recitation.', href: '/courses/ten-qiraat' },
  { title: 'Female Teachers', desc: 'Learn with certified female teachers — comfortable, safe, and effective.', href: '/courses/female-quran-teachers' },
]

const testimonials = [
  { name: 'Sarah A.', location: 'London, UK', quote: "My children's Tajweed has improved beyond recognition in just 3 months. The teachers are so patient and knowledgeable.", course: 'Quran for Kids' },
  { name: 'Ahmed K.', location: 'Toronto, Canada', quote: 'I started as a complete beginner and now read the Quran with confidence. The 1-on-1 format makes all the difference.', course: 'Noorani Qaida' },
  { name: 'Fatima R.', location: 'New York, USA', quote: 'Having a female teacher was so important to me. The class schedule is flexible and fits perfectly around my work hours.', course: 'Tajweed for Adults' },
  { name: 'Omar M.', location: 'Melbourne, Australia', quote: 'The Ijazah program is rigorous and authentic. My teacher has a direct chain to Al-Azhar. Highly recommend.', course: 'Ijazah Program' },
  { name: 'Amina H.', location: 'Birmingham, UK', quote: "I've tried several online academies. Alrayan is the only one where I felt genuinely supported. The free trial convinced me immediately.", course: 'Arabic for Non-Arabs' },
]

const whyUs = [
  { icon: BookOpen, title: 'Qualified Teachers', desc: 'All teachers hold Ijazah and are graduates of Al-Azhar or equivalent Islamic universities.' },
  { icon: Clock, title: 'Flexible Scheduling', desc: 'Classes 7 days a week across all timezones — mornings, afternoons, or evenings.' },
  { icon: ShieldCheck, title: 'Risk-Free Trial', desc: 'Book your first class completely free. No credit card, no commitment.' },
]

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
      />

      {/* ── Hero ── */}
      <section
        className="relative min-h-[92vh] flex items-center bg-primary overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, #C9A24B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0E7C5A 0%, transparent 50%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-secondary/10 -translate-y-1/4 translate-x-1/4 blur-3xl"
          aria-hidden="true"
        />

        <Container className="relative py-32 lg:py-40">
          <div className="max-w-3xl">
            <p
              className="font-arabic text-accent text-2xl mb-6"
              dir="rtl"
              lang="ar"
              aria-label="In the name of Allah, the Most Gracious, the Most Merciful"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            <h1
              id="hero-heading"
              className="heading-display font-display text-white text-balance mb-6"
            >
              Learn{' '}
              <em className="text-accent not-italic">Quran Online</em>
              {' '}with Certified Teachers
            </h1>

            <p className="text-white/80 text-xl leading-relaxed mb-10 max-w-2xl">
              Premium 1-on-1 classes in Quran, Tajweed, Hifz, Arabic, and
              Islamic Studies. Certified teachers from Al-Azhar. Students in
              50+ countries.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
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

            <p className="text-white/50 text-sm">
              ✓ Free first class &nbsp;·&nbsp; ✓ No credit card required &nbsp;·&nbsp; ✓ Cancel anytime
            </p>
          </div>
        </Container>
      </section>

      {/* ── Trust Badges ── */}
      <Section bg="cream">
        <Container>
          <ul
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6"
            role="list"
            aria-label="Trust badges"
          >
            {trustBadges.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 bg-white border border-border-soft rounded-full px-5 py-3 text-sm font-medium text-primary shadow-soft"
              >
                <Icon className="size-4 text-secondary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── Stats ── */}
      <Section>
        <Container>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <dt className="heading-xl font-display text-secondary mb-2">{value}</dt>
                <dd className="text-muted-text text-sm font-medium uppercase tracking-wide">{label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      {/* ── Courses Grid ── */}
      <Section bg="cream" aria-labelledby="courses-heading">
        <Container>
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">Our Courses</p>
            <h2 id="courses-heading" className="heading-xl font-heading text-primary mb-4">
              What Would You Like to Learn?
            </h2>
            <p className="text-muted-text text-lg max-w-xl mx-auto">
              From complete beginners to advanced students seeking Ijazah — we have a program tailored for you.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
            {courses.map(({ title, desc, href }) => (
              <li key={href}>
                <a
                  href={href}
                  className="group flex flex-col h-full bg-white rounded-2xl p-7 border border-border-soft shadow-soft hover:shadow-md hover:border-secondary/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <BookOpen className="size-5 text-secondary" aria-hidden="true" />
                    </div>
                    <span className="text-accent text-xl font-display group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
                  </div>
                  <h3 className="font-heading font-semibold text-primary text-lg mb-2">{title}</h3>
                  <p className="text-muted-text text-sm leading-relaxed flex-1">{desc}</p>
                  <span className="mt-4 text-secondary text-sm font-semibold">Learn more</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="text-center mt-12">
            <LinkButton href="/courses" variant="outline">View All Courses</LinkButton>
          </div>
        </Container>
      </Section>

      {/* ── Why Alrayan ── */}
      <Section aria-labelledby="why-heading">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">Why Alrayan Academy</p>
              <h2 id="why-heading" className="heading-xl font-heading text-primary mb-6">
                Scholars, Not Just Teachers
              </h2>
              <p className="text-muted-text text-lg leading-relaxed mb-8">
                Every teacher at Alrayan holds an authenticated Ijazah — a chain of transmission going back to the Prophet ﷺ. We don&apos;t hire tutors; we partner with certified scholars.
              </p>
              <ul className="space-y-6" role="list">
                {whyUs.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex gap-4">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
                      <Icon className="size-5 text-accent" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary mb-1">{title}</h3>
                      <p className="text-muted-text text-sm leading-relaxed">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex gap-4 flex-wrap">
                <LinkButton href="/about">Meet Our Teachers</LinkButton>
                <LinkButton href="/pricing" variant="outline">See Pricing</LinkButton>
              </div>
            </div>

            <div
              className="hidden lg:block bg-primary rounded-3xl p-10 text-white relative overflow-hidden"
              aria-hidden="true"
            >
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-secondary/20 translate-x-1/3 -translate-y-1/3" />
              <p className="font-arabic text-accent text-3xl mb-6" dir="rtl" lang="ar">
                اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ
              </p>
              <p className="text-white/60 text-sm italic mb-10">
                &quot;Read in the name of your Lord who created.&quot; — Al-Alaq 96:1
              </p>
              <div className="grid grid-cols-2 gap-6">
                {stats.map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-accent text-3xl font-display font-semibold">{value}</p>
                    <p className="text-white/60 text-xs mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── Testimonials ── */}
      <Section bg="cream" aria-labelledby="testimonials-heading">
        <Container>
          <div className="text-center mb-14">
            <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">Student Stories</p>
            <h2 id="testimonials-heading" className="heading-xl font-heading text-primary">
              Trusted by Families Worldwide
            </h2>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
            {testimonials.map(({ name, location, quote, course }) => (
              <li key={name} className="bg-white rounded-2xl p-7 border border-border-soft shadow-soft">
                <div className="flex mb-4" aria-label="5 out of 5 stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-accent text-accent" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-primary text-sm leading-relaxed mb-6">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <footer className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-full bg-primary flex items-center justify-center text-accent font-semibold text-sm shrink-0"
                    aria-hidden="true"
                  >
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-primary text-sm">{name}</p>
                    <p className="text-muted-text text-xs">{location} · {course}</p>
                  </div>
                </footer>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── CTA Banner ── */}
      <Section bg="primary" aria-labelledby="cta-heading">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-arabic text-accent text-2xl mb-4" dir="rtl" lang="ar" aria-hidden="true">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <p className="text-white/60 text-sm italic mb-8">
              &quot;The best of you are those who learn the Quran and teach it.&quot; — Prophet Muhammad ﷺ
            </p>
            <h2 id="cta-heading" className="heading-xl font-display text-white mb-4">
              Begin Your Quran Journey Today
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Join 10,000+ students from 50+ countries. Your first class is completely free.
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

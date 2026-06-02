import { Quote } from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { YouTubeEmbed } from '@/components/media/YouTubeEmbed'
import { mediaConfig, youtubeEmbedUrl } from '@/config/media'

/**
 * Featured video testimonials. Renders only when at least one entry in
 * `mediaConfig.videoTestimonials` has a valid YouTube URL.
 */
export function VideoTestimonials() {
  const items = mediaConfig.videoTestimonials.filter((v) => youtubeEmbedUrl(v.youtubeUrl)).slice(0, 3)
  if (items.length === 0) return null

  return (
    <Section aria-labelledby="video-testimonials-heading">
      <Container>
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
            Real Families, Real Results
          </p>
          <h2 id="video-testimonials-heading" className="heading-xl font-heading text-primary mb-4">
            Hear It From Our Parents
          </h2>
          <p className="text-muted-text text-lg leading-relaxed">
            Short clips from families whose children are studying with us today.
          </p>
        </div>

        <ul className="grid md:grid-cols-3 gap-6" role="list">
          {items.map((v) => (
            <li key={v.id} className="flex flex-col">
              <YouTubeEmbed
                url={v.youtubeUrl}
                poster={v.posterImage}
                label={`Video testimonial from ${v.parentName}`}
                roundedClassName="rounded-2xl"
                className="mb-4"
              />
              <Quote className="size-5 text-accent mb-2" aria-hidden="true" />
              <blockquote className="text-primary text-sm leading-relaxed mb-4 flex-1">
                &ldquo;{v.quote}&rdquo;
              </blockquote>
              <footer>
                <p className="font-semibold text-primary text-sm">{v.parentName}</p>
                <p className="text-muted-text text-xs">{v.location} · {v.course}</p>
              </footer>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

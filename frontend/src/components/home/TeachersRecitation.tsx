import Image from 'next/image'
import { GraduationCap, Award } from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/link-button'
import { AudioPlayer } from '@/components/media/AudioPlayer'
import { mediaConfig } from '@/config/media'
import type { Teacher } from '@/content/teachers'

type Props = { teachers: Teacher[] }

/**
 * "Meet & hear our teachers" — featured teacher cards with optional photo and
 * a play button for a recitation audio sample.
 *
 * Photos and audio are filled in via `src/config/media.ts` → `teacherMedia`.
 * Until then, each card shows initials + a placeholder note instead of a player.
 */
export function TeachersRecitation({ teachers }: Props) {
  return (
    <Section bg="cream" aria-labelledby="teachers-heading">
      <Container>
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
            Meet Your Teacher
          </p>
          <h2 id="teachers-heading" className="heading-xl font-heading text-primary mb-4">
            Hear Their Recitation Before You Book
          </h2>
          <p className="text-muted-text text-lg leading-relaxed">
            Every Alrayan teacher holds an Ijazah with an unbroken chain to the Prophet ﷺ.
            Press play to hear them recite.
          </p>
        </div>

        <ul
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          role="list"
        >
          {teachers.map((t) => {
            const media = mediaConfig.teacherMedia[t.id as keyof typeof mediaConfig.teacherMedia]
            const photo = media?.photo
            const audio = media?.recitationAudio
            const initials = t.name
              .replace(/^(Sheikh|Sister|Dr\.?)\s+/i, '')
              .split(/\s+/)
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <li
                key={t.id}
                className="bg-white rounded-2xl border border-border-soft shadow-soft p-5 flex flex-col"
              >
                {/* Photo / avatar */}
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-primary">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={`${t.name}, ${t.role}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-accent text-5xl" aria-hidden="true">
                        {initials}
                      </span>
                    </div>
                  )}
                  {/* Female teacher badge */}
                  {t.isFemale && (
                    <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-white">
                      Sister Teacher
                    </span>
                  )}
                </div>

                {/* Name + role */}
                <h3 className="font-heading font-semibold text-primary text-base leading-snug mb-0.5">
                  {t.name}
                </h3>
                <p className="text-muted-text text-xs mb-3">{t.role}</p>

                {/* Credentials chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-accent/10 text-[#A07830]">
                    <GraduationCap className="size-3" aria-hidden="true" />
                    Al-Azhar
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                    <Award className="size-3" aria-hidden="true" />
                    Ijazah
                  </span>
                </div>

                {/* Audio player or placeholder */}
                <div className="mt-auto">
                  {audio ? (
                    <AudioPlayer src={audio} label="Recitation sample" />
                  ) : (
                    <p className="text-xs text-muted-text italic">
                      Recitation sample coming soon
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <div className="text-center mt-10">
          <LinkButton href="/about#teachers" variant="outline">
            Meet All Our Teachers
          </LinkButton>
        </div>
      </Container>
    </Section>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, ArrowRight, Award, Baby } from 'lucide-react'
import type { Teacher } from '@/content/teachers'
import type { Locale } from '@/i18n/config'
import { localizedHref } from '@/i18n/href'
import { dictionaries, translate } from '@/i18n/translate'

export function TeacherCard({ t, locale }: { t: Teacher; locale: Locale }) {
  const tr = (key: string, vars?: Record<string, string | number>) =>
    translate(dictionaries[locale], key, vars)
  return (
    <Link
      href={localizedHref(`/our-teachers/${t.id}`, locale)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:bg-white/[0.05] hover:shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
    >
      {/* Photo — fills the top of the card.
          Portrait 4:5, matching the uncropped photo on the teacher's own page:
          teachers upload phone portraits, and a landscape frame cropped them
          down to a sliver of forehead. */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-primary/50">
        <Image
          src={t.photo}
          alt={t.name}
          fill
          sizes="(max-width: 640px) 86vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {/* Fade into the card body so the photo and content read as one block.
            Held to the bottom quarter so the taller frame stays a photograph
            rather than a gradient with a face in it. */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/20 via-25% to-transparent"
          aria-hidden="true"
        />

        {/* Badges */}
        {t.elite && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-primary/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent backdrop-blur-sm">
            <Award className="size-3" aria-hidden="true" /> {tr('teacherCard.elite')}
          </span>
        )}
        {t.forChildren && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-secondary/40 bg-primary/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300 backdrop-blur-sm">
            <Baby className="size-3" aria-hidden="true" /> {tr('teacherCard.children')}
          </span>
        )}

        {/* Rating pill */}
        <div className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-primary/75 px-3 py-1 backdrop-blur-sm">
          <span className="flex" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3 ${i < Math.round(t.rating) ? 'fill-accent text-accent' : 'text-white/25'}`}
              />
            ))}
          </span>
          <span className="text-xs font-bold text-white">{t.rating.toFixed(1)}</span>
          <span className="text-[11px] text-white/45">({t.reviewsCount})</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 pt-4">
        {/* Name + subject */}
        <h3 className="text-center font-heading text-lg font-bold text-white">{t.name}</h3>
        <p className="mt-1 truncate text-center text-sm text-emerald-300">{t.title}</p>

        {/* Country */}
        <div className="mx-auto mt-2.5 inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60">
          <MapPin className="size-3" aria-hidden="true" /> {t.country}
        </div>

        {/* Bio */}
        <p className="mb-5 mt-3 line-clamp-2 text-center text-[13px] leading-relaxed text-white/50">
          {t.bio}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-white">
            <span className="text-xl font-bold">{t.hourlyRate}</span>
            <span className="text-sm text-white/50"> € {tr('teacherPage.perHour')}</span>
          </p>
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-white transition-colors group-hover:bg-accent group-hover:text-primary">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Loader2, Upload, Trash2, Plus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uploadFile } from '@/lib/system/upload'
import {
  useCreateSiteTeacher,
  useUpdateSiteTeacher,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from '@/hooks/system/useSiteTeachers'
import type { SiteTeacher, SiteTeacherReview } from '@/types/system/siteTeacher'

type FormState = Record<string, unknown>

const CARD = 'rounded-2xl border border-border-soft bg-white p-5 space-y-4'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-secondary" />
      {label}
    </label>
  )
}

export function SiteTeacherEditor({ teacher }: { teacher?: SiteTeacher }) {
  const router = useRouter()
  const isEdit = !!teacher
  const create = useCreateSiteTeacher()
  const update = useUpdateSiteTeacher(teacher?.slug ?? '')
  const saving = create.isPending || update.isPending

  const [uploading, setUploading] = useState(false)
  const [image, setImage] = useState<string | null>(teacher?.image ?? null)
  const [form, setForm] = useState<FormState>({
    name: teacher?.name ?? '',
    name_arabic: teacher?.name_arabic ?? '',
    slug: teacher?.slug ?? '',
    role: teacher?.role ?? '',
    title: teacher?.title ?? '',
    country: teacher?.country ?? 'Egypt',
    quote: teacher?.quote ?? '',
    bio: teacher?.bio ?? '',
    about: teacher?.about ?? '',
    teaching_style: teacher?.teaching_style ?? '',
    strengths: teacher?.strengths ?? '',
    credentials: teacher?.credentials ?? '',
    specialties: (teacher?.specialties ?? []).join(', '),
    languages: (teacher?.languages ?? []).join(', '),
    tags: (teacher?.tags ?? []).join(', '),
    is_female: teacher?.is_female ?? false,
    elite: teacher?.elite ?? false,
    for_children: teacher?.for_children ?? false,
    free_trial: teacher?.free_trial ?? true,
    featured: teacher?.featured ?? true,
    rating: teacher?.rating ?? 5,
    reviews_count: teacher?.reviews_count ?? 0,
    hourly_rate: teacher?.hourly_rate ?? 10,
    currency: teacher?.currency ?? 'EUR',
    years_experience: teacher?.years_experience ?? 0,
    students_count: teacher?.students_count ?? 0,
    courses_given: teacher?.courses_given ?? 0,
    teaching_hours: teacher?.teaching_hours ?? 0,
    sort_order: teacher?.sort_order ?? 0,
    // French translations
    role_fr: teacher?.role_fr ?? '',
    title_fr: teacher?.title_fr ?? '',
    country_fr: teacher?.country_fr ?? '',
    quote_fr: teacher?.quote_fr ?? '',
    bio_fr: teacher?.bio_fr ?? '',
    about_fr: teacher?.about_fr ?? '',
    teaching_style_fr: teacher?.teaching_style_fr ?? '',
    strengths_fr: teacher?.strengths_fr ?? '',
    credentials_fr: teacher?.credentials_fr ?? '',
    specialties_fr: (teacher?.specialties_fr ?? []).join(', '),
    languages_fr: (teacher?.languages_fr ?? []).join(', '),
    tags_fr: (teacher?.tags_fr ?? []).join(', '),
  })

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const csv = (v: unknown) => String(v).split(',').map((s) => s.trim()).filter(Boolean)

  async function onUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadFile(file, 'photos')
      setImage(url)
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      image,
      specialties: csv(form.specialties),
      languages: csv(form.languages),
      tags: csv(form.tags),
      specialties_fr: csv(form.specialties_fr),
      languages_fr: csv(form.languages_fr),
      tags_fr: csv(form.tags_fr),
      rating: Number(form.rating),
      reviews_count: Number(form.reviews_count),
      hourly_rate: Number(form.hourly_rate),
      years_experience: Number(form.years_experience),
      students_count: Number(form.students_count),
      courses_given: Number(form.courses_given),
      teaching_hours: Number(form.teaching_hours),
      sort_order: Number(form.sort_order),
    }
    try {
      if (isEdit) {
        await update.mutateAsync(payload)
        toast.success('Teacher saved')
      } else {
        const created = await create.mutateAsync(payload)
        toast.success('Teacher created')
        router.push(`/site/teachers/${created.slug}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[300px_1fr]">
      {/* ── Left: image + flags ── */}
      <div className="space-y-5">
        <div className={CARD}>
          <Label className="text-xs">Photo</Label>
          <div className="relative mx-auto size-40 overflow-hidden rounded-2xl border border-border-soft bg-cream">
            {image ? (
              <Image src={image} alt="" fill sizes="160px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl font-semibold text-muted-text">
                {String(form.name || '?').charAt(0)}
              </div>
            )}
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-soft py-2.5 text-sm font-medium hover:bg-cream">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? 'Uploading…' : 'Upload photo'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </label>
        </div>

        <div className={CARD}>
          <Label className="text-xs">Flags</Label>
          <div className="space-y-2.5">
            <Toggle label="Featured on site" checked={!!form.featured} onChange={(v) => set('featured', v)} />
            <Toggle label="Elite badge" checked={!!form.elite} onChange={(v) => set('elite', v)} />
            <Toggle label="Suitable for children" checked={!!form.for_children} onChange={(v) => set('for_children', v)} />
            <Toggle label="Free trial offered" checked={!!form.free_trial} onChange={(v) => set('free_trial', v)} />
            <Toggle label="Female teacher" checked={!!form.is_female} onChange={(v) => set('is_female', v)} />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create teacher'}
        </Button>
      </div>

      {/* ── Right: fields ── */}
      <div className="space-y-5">
        <div className={CARD}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *"><Input required value={String(form.name)} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Arabic name"><Input value={String(form.name_arabic)} onChange={(e) => set('name_arabic', e.target.value)} /></Field>
            <Field label="Role *"><Input required value={String(form.role)} onChange={(e) => set('role', e.target.value)} /></Field>
            <Field label="Slug (URL)"><Input value={String(form.slug)} placeholder="auto from name" onChange={(e) => set('slug', e.target.value)} /></Field>
            <Field label="Title / hook"><Input value={String(form.title)} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field label="Country"><Input value={String(form.country)} onChange={(e) => set('country', e.target.value)} /></Field>
          </div>
          <Field label="Quote"><Input value={String(form.quote)} onChange={(e) => set('quote', e.target.value)} /></Field>
        </div>

        <div className={CARD}>
          <Field label="Specialties (comma separated)"><Input value={String(form.specialties)} onChange={(e) => set('specialties', e.target.value)} /></Field>
          <Field label="Languages (comma separated)"><Input value={String(form.languages)} onChange={(e) => set('languages', e.target.value)} /></Field>
          <Field label="Tags (comma separated)"><Input value={String(form.tags)} onChange={(e) => set('tags', e.target.value)} /></Field>
        </div>

        <div className={CARD}>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Rating"><Input type="number" step="0.1" value={String(form.rating)} onChange={(e) => set('rating', e.target.value)} /></Field>
            <Field label="Reviews count"><Input type="number" value={String(form.reviews_count)} onChange={(e) => set('reviews_count', e.target.value)} /></Field>
            <Field label="Hourly rate"><Input type="number" value={String(form.hourly_rate)} onChange={(e) => set('hourly_rate', e.target.value)} /></Field>
            <Field label="Currency"><Input value={String(form.currency)} onChange={(e) => set('currency', e.target.value)} /></Field>
            <Field label="Years experience"><Input type="number" value={String(form.years_experience)} onChange={(e) => set('years_experience', e.target.value)} /></Field>
            <Field label="Students count"><Input type="number" value={String(form.students_count)} onChange={(e) => set('students_count', e.target.value)} /></Field>
            <Field label="Courses given"><Input type="number" value={String(form.courses_given)} onChange={(e) => set('courses_given', e.target.value)} /></Field>
            <Field label="Teaching hours"><Input type="number" value={String(form.teaching_hours)} onChange={(e) => set('teaching_hours', e.target.value)} /></Field>
            <Field label="Sort order"><Input type="number" value={String(form.sort_order)} onChange={(e) => set('sort_order', e.target.value)} /></Field>
          </div>
        </div>

        <div className={CARD}>
          <Field label="Short bio *"><Textarea required rows={3} value={String(form.bio)} onChange={(e) => set('bio', e.target.value)} /></Field>
          <Field label="About (profile page)"><Textarea rows={4} value={String(form.about)} onChange={(e) => set('about', e.target.value)} /></Field>
          <Field label="Teaching style"><Textarea rows={3} value={String(form.teaching_style)} onChange={(e) => set('teaching_style', e.target.value)} /></Field>
          <Field label="Strengths"><Textarea rows={3} value={String(form.strengths)} onChange={(e) => set('strengths', e.target.value)} /></Field>
          <Field label="Credentials"><Textarea rows={2} value={String(form.credentials)} onChange={(e) => set('credentials', e.target.value)} /></Field>
        </div>

        {/* ── French translations ── */}
        <div className={CARD}>
          <div className="flex items-center gap-2">
            <span className="text-base">🇫🇷</span>
            <Label className="text-sm font-semibold">Français (translations)</Label>
          </div>
          <p className="text-xs text-muted-text">
            Optional. Shown on the public site when the visitor’s language is French. Leave blank to fall back to the English text above.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rôle (Role)"><Input value={String(form.role_fr)} onChange={(e) => set('role_fr', e.target.value)} /></Field>
            <Field label="Titre / accroche (Title)"><Input value={String(form.title_fr)} onChange={(e) => set('title_fr', e.target.value)} /></Field>
            <Field label="Pays (Country)"><Input value={String(form.country_fr)} onChange={(e) => set('country_fr', e.target.value)} /></Field>
          </div>
          <Field label="Citation (Quote)"><Input value={String(form.quote_fr)} onChange={(e) => set('quote_fr', e.target.value)} /></Field>
          <Field label="Spécialités (comma separated)"><Input value={String(form.specialties_fr)} onChange={(e) => set('specialties_fr', e.target.value)} /></Field>
          <Field label="Langues (comma separated)"><Input value={String(form.languages_fr)} onChange={(e) => set('languages_fr', e.target.value)} /></Field>
          <Field label="Tags (comma separated)"><Input value={String(form.tags_fr)} onChange={(e) => set('tags_fr', e.target.value)} /></Field>
          <Field label="Bio courte (Short bio)"><Textarea rows={3} value={String(form.bio_fr)} onChange={(e) => set('bio_fr', e.target.value)} /></Field>
          <Field label="À propos (About)"><Textarea rows={4} value={String(form.about_fr)} onChange={(e) => set('about_fr', e.target.value)} /></Field>
          <Field label="Méthode d’enseignement (Teaching style)"><Textarea rows={3} value={String(form.teaching_style_fr)} onChange={(e) => set('teaching_style_fr', e.target.value)} /></Field>
          <Field label="Points forts (Strengths)"><Textarea rows={3} value={String(form.strengths_fr)} onChange={(e) => set('strengths_fr', e.target.value)} /></Field>
          <Field label="Diplômes (Credentials)"><Textarea rows={2} value={String(form.credentials_fr)} onChange={(e) => set('credentials_fr', e.target.value)} /></Field>
        </div>

        {isEdit && <ReviewsManager teacher={teacher} />}
      </div>
    </form>
  )
}

// ── Reviews management ──

function ReviewsManager({ teacher }: { teacher: SiteTeacher }) {
  const create = useCreateReview(teacher.slug)
  const del = useDeleteReview(teacher.slug)
  const [draft, setDraft] = useState({ author: '', rating: 5, text: '', text_fr: '' })
  const reviews = teacher.reviews ?? []

  async function add() {
    if (!draft.author.trim() || !draft.text.trim()) return
    try {
      await create.mutateAsync(draft)
      setDraft({ author: '', rating: 5, text: '', text_fr: '' })
      toast.success('Review added')
    } catch {
      toast.error('Failed to add review')
    }
  }

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Reviews ({reviews.length})</Label>
      </div>

      <ul className="space-y-2">
        {reviews.map((r) => (
          <ReviewRow key={r.id} review={r} teacherSlug={teacher.slug} onDelete={() => del.mutate(r.id)} />
        ))}
        {reviews.length === 0 && <li className="text-sm text-muted-text">No reviews yet.</li>}
      </ul>

      {/* Add new */}
      <div className="rounded-xl border border-dashed border-border-soft p-3 space-y-2">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input placeholder="Author (e.g. Sarah A.)" value={draft.author} onChange={(e) => setDraft((p) => ({ ...p, author: e.target.value }))} />
          <select
            value={draft.rating}
            onChange={(e) => setDraft((p) => ({ ...p, rating: Number(e.target.value) }))}
            className="h-9 rounded-md border border-border-soft bg-white px-2 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
          </select>
        </div>
        <Textarea placeholder="Review text" rows={2} value={draft.text} onChange={(e) => setDraft((p) => ({ ...p, text: e.target.value }))} />
        <Textarea placeholder="Review (French) — optional 🇫🇷" rows={2} value={draft.text_fr} onChange={(e) => setDraft((p) => ({ ...p, text_fr: e.target.value }))} />
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={create.isPending}>
          <Plus className="size-4" /> Add review
        </Button>
      </div>
    </div>
  )
}

function ReviewRow({ review, teacherSlug, onDelete }: { review: SiteTeacherReview; teacherSlug: string; onDelete: () => void }) {
  const upd = useUpdateReview(teacherSlug)
  const [approved, setApproved] = useState(review.approved)

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border-soft p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{review.author}</span>
          <span className="flex text-accent">
            {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="size-3 fill-accent" />)}
          </span>
        </div>
        <p className="text-sm text-muted-text mt-0.5">{review.text}</p>
      </div>
      <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => { setApproved(e.target.checked); upd.mutate({ id: review.id, approved: e.target.checked }) }}
          className="size-3.5 accent-secondary"
        />
        Approved
      </label>
      <button type="button" onClick={onDelete} className="text-muted-text hover:text-red-600" aria-label="Delete review">
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}

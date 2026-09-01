export interface SiteTeacherReview {
  id: number
  teacher_id: number
  author: string
  rating: number
  text: string
  text_fr?: string | null
  approved: boolean
  sort_order: number
}

export interface SiteTeacher {
  id: number
  slug: string
  name: string
  name_arabic: string | null
  role: string
  title: string | null
  country: string | null
  bio: string
  image: string | null
  specialties: string[] | null
  languages: string[] | null
  tags: string[] | null
  credentials: string | null
  is_female: boolean
  years_experience: number
  students_count: number
  rating: number
  reviews_count: number
  hourly_rate: number
  currency: string
  elite: boolean
  for_children: boolean
  free_trial: boolean
  courses_given: number
  teaching_hours: number
  quote: string | null
  about: string | null
  teaching_style: string | null
  strengths: string | null
  featured: boolean
  sort_order: number
  // French translations (nullable — served on the public API when ?locale=fr)
  role_fr?: string | null
  title_fr?: string | null
  country_fr?: string | null
  bio_fr?: string | null
  credentials_fr?: string | null
  quote_fr?: string | null
  about_fr?: string | null
  teaching_style_fr?: string | null
  strengths_fr?: string | null
  specialties_fr?: string[] | null
  languages_fr?: string[] | null
  tags_fr?: string[] | null
  reviews_count_relation?: number
  reviews?: SiteTeacherReview[]
}

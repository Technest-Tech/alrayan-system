export type Testimonial = {
  id: string
  name: string
  location: string
  country: string
  quote: string
  course: string
  rating: number
}

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Sarah A.',
    location: 'London, UK',
    country: 'uk',
    quote: "My children's Tajweed has improved beyond recognition in just 3 months. The teachers are so patient and knowledgeable — my daughter actually looks forward to her classes every day.",
    course: 'Quran for Kids',
    rating: 5,
  },
  {
    id: 't2',
    name: 'Ahmed K.',
    location: 'Toronto, Canada',
    country: 'canada',
    quote: 'I started as a complete beginner and now read the Quran with confidence. The 1-on-1 format makes all the difference — the teacher focuses entirely on me and my pace.',
    course: 'Noorani Qaida',
    rating: 5,
  },
  {
    id: 't3',
    name: 'Fatima R.',
    location: 'New York, USA',
    country: 'usa',
    quote: 'Having a female teacher was so important to me. The class schedule is flexible and fits perfectly around my work hours. I feel so comfortable and supported.',
    course: 'Tajweed for Adults',
    rating: 5,
  },
  {
    id: 't4',
    name: 'Omar M.',
    location: 'Melbourne, Australia',
    country: 'australia',
    quote: 'The Ijazah program is rigorous and authentic. My teacher has a direct chain to Al-Azhar. I finished my Hifz revision and received my Ijazah certificate — a dream fulfilled.',
    course: 'Ijazah Program',
    rating: 5,
  },
  {
    id: 't5',
    name: 'Amina H.',
    location: 'Birmingham, UK',
    country: 'uk',
    quote: "I've tried several online academies. Alrayan is the only one where I felt genuinely supported. The free trial convinced me immediately — the quality is exceptional.",
    course: 'Arabic for Non-Arabs',
    rating: 5,
  },
  {
    id: 't6',
    name: 'Yusuf B.',
    location: 'Paris, France',
    country: 'france',
    quote: 'My son completed his Hifz at age 12. The teacher was dedicated, patient, and kept him motivated through the entire journey. We are so grateful to Alrayan.',
    course: 'Hifz / Memorization',
    rating: 5,
  },
]

import type { Testimonial } from './testimonials'

export type CountrySlug = 'usa' | 'uk' | 'canada' | 'australia'

export type WhyReason = {
  title: string
  body: string
  icon: string
}

export type CountryData = {
  slug: CountrySlug
  name: string
  shortName: string
  flagEmoji: string
  hero: {
    h1: string
    subheading: string
  }
  whyUs: WhyReason[]
  timezone: {
    label: string
    note: string
    slots: string[]
  }
  localCurrencyNote: string
  testimonials: Testimonial[]
  faqs: Array<{ q: string; a: string }>
  seo: {
    title: string
    description: string
  }
  schema: {
    addressLocality: string
    addressCountry: string
  }
}

export const countriesData: CountryData[] = [
  {
    slug: 'usa',
    name: 'United States',
    shortName: 'USA',
    flagEmoji: '🇺🇸',
    hero: {
      h1: 'Online Quran Classes in the USA',
      subheading:
        'Certified Al-Azhar teachers available morning through night across all four US time zones — Eastern, Central, Mountain, and Pacific.',
    },
    whyUs: [
      {
        icon: 'Clock',
        title: 'All US Timezones Covered',
        body: "Classes run from 6 AM ET to midnight ET, seven days a week. Whether you're in New York or Los Angeles, we have a slot that fits your schedule.",
      },
      {
        icon: 'ShieldCheck',
        title: 'Al-Azhar Certified Teachers',
        body: 'Every teacher holds an authenticated Ijazah and has passed a rigorous vetting process. Less than 10% of applicants are accepted.',
      },
      {
        icon: 'Heart',
        title: 'Female Teachers Available',
        body: 'We have qualified female Quran teachers for female students and for families who prefer a female instructor for their children.',
      },
      {
        icon: 'Users',
        title: 'Serving 10,000+ Families Worldwide',
        body: "From Dearborn to Houston to New York, thousands of American Muslim families trust Azhary for their children's Quran education.",
      },
    ],
    timezone: {
      label: 'ET · CT · MT · PT',
      note: 'All classes are scheduled in your local time zone. We confirm the meeting link and time 24 hours before every session.',
      slots: [
        '6 AM – 9 AM ET (morning)',
        '12 PM – 3 PM ET (afternoon)',
        '5 PM – 9 PM ET (evening)',
        '9 PM – 12 AM ET (night)',
      ],
    },
    localCurrencyNote: 'Prices are in USD. Plans start at $30/month.',
    testimonials: [
      {
        id: 'usa-1',
        name: 'Fatima R.',
        location: 'New York, NY',
        country: 'usa',
        quote:
          'Having a female teacher was so important to me. The class schedule is flexible and fits perfectly around my work hours. I feel so comfortable and supported.',
        course: 'Tajweed for Adults',
        rating: 5,
      },
      {
        id: 'usa-2',
        name: 'Khalid M.',
        location: 'Houston, TX',
        country: 'usa',
        quote:
          'My son started from zero and is now halfway through his Hifz. The teacher checks in with us on WhatsApp every week — we feel like part of a family.',
        course: 'Hifz / Memorization',
        rating: 5,
      },
      {
        id: 'usa-3',
        name: 'Nadia S.',
        location: 'Dearborn, MI',
        country: 'usa',
        quote:
          'As a convert, I was nervous about finding a teacher who would be patient with my complete beginner level. My teacher has been wonderful — kind, clear, and encouraging.',
        course: 'Noorani Qaida',
        rating: 5,
      },
    ],
    faqs: [
      {
        q: 'Do you offer Quran classes across all US time zones?',
        a: 'Yes. We have teachers available from 6 AM to midnight Eastern Time, which covers early morning slots for Eastern states and evening slots for Pacific Time. You choose a recurring time that works for you.',
      },
      {
        q: 'Are your teachers recognized or certified in the United States?',
        a: "Our teachers hold Ijazah certifications from Al-Azhar University and equivalent accredited Islamic institutions — these are the highest internationally recognized credentials in Quranic education. Certification is religious rather than state-issued, and Al-Azhar is accepted by Islamic scholars and mosques across the US.",
      },
      {
        q: 'Can my child join if they have never learned Quran before?',
        a: "Absolutely. We have complete beginners of all ages. We start with Noorani Qaida — the foundational Arabic letter recognition program — and progress at your child's pace. No prior knowledge is required.",
      },
      {
        q: 'Do you serve students in Dearborn, Houston, or other large Muslim communities?',
        a: 'Yes. Students join from all 50 states. Being fully online means there are no geographic restrictions. You need only a device, an internet connection, and a quiet space.',
      },
      {
        q: 'What video platform do you use for classes?',
        a: 'Classes are held via Zoom, Google Meet, or Skype — whichever you prefer. We send a meeting link before each session. No special software beyond the video app is required.',
      },
      {
        q: 'Is the first class really free with no credit card?',
        a: 'Yes. The trial class is completely free and requires no payment information. We only discuss payment if you decide to continue after your first session.',
      },
    ],
    seo: {
      title: 'Online Quran Classes USA | Certified Teachers | Azhary',
      description:
        'Learn Quran online in the USA with certified Al-Azhar teachers. All US time zones, 1-on-1 classes, free first lesson. Join thousands of American Muslim families.',
    },
    schema: { addressLocality: 'Washington D.C.', addressCountry: 'US' },
  },
  {
    slug: 'uk',
    name: 'United Kingdom',
    shortName: 'UK',
    flagEmoji: '🇬🇧',
    hero: {
      h1: 'Online Quran Classes in the United Kingdom',
      subheading:
        'Morning and evening sessions timed for GMT and BST — serving students in England, Scotland, Wales, and Northern Ireland.',
    },
    whyUs: [
      {
        icon: 'Clock',
        title: 'GMT & BST Scheduling',
        body: "Classes run from 6 AM to 11 PM UK time throughout the year — with automatic adjustment for British Summer Time. No disrupted schedules when the clocks change.",
      },
      {
        icon: 'GraduationCap',
        title: 'Al-Azhar & Deobandi-Trained Teachers',
        body: 'Our teacher pool includes scholars trained at Al-Azhar, Darul Uloom institutions, and other leading Islamic universities. All hold authenticated Ijazah.',
      },
      {
        icon: 'BookOpen',
        title: "Complement Your Child's Islamic School",
        body: "Many of our UK students also attend Saturday madrassa or an Islamic school. Our 1-on-1 classes provide focused practice that group classes cannot match.",
      },
      {
        icon: 'Heart',
        title: 'Female Teachers for Sisters & Girls',
        body: 'A dedicated team of qualified female teachers is available for female students of all ages. Many UK families specifically request our female teacher option.',
      },
    ],
    timezone: {
      label: 'GMT · BST',
      note: 'All sessions are booked in UK local time and automatically adjust for British Summer Time. You will never need to manually calculate time differences.',
      slots: [
        '7 AM – 9 AM (before school)',
        '4 PM – 7 PM (after school)',
        '7 PM – 10 PM (evening)',
        'Weekends 8 AM – 12 PM',
      ],
    },
    localCurrencyNote: '≈ £24–£56/month at current exchange rates (billed in USD).',
    testimonials: [
      {
        id: 'uk-1',
        name: 'Sarah A.',
        location: 'London, UK',
        country: 'uk',
        quote:
          "My children's Tajweed has improved beyond recognition in just 3 months. The teachers are so patient and knowledgeable — my daughter actually looks forward to her classes every day.",
        course: 'Quran for Kids',
        rating: 5,
      },
      {
        id: 'uk-2',
        name: 'Amina H.',
        location: 'Birmingham, UK',
        country: 'uk',
        quote:
          "I've tried several online academies. Azhary is the only one where I felt genuinely supported. The free trial convinced me immediately — the quality is exceptional.",
        course: 'Arabic for Non-Arabs',
        rating: 5,
      },
      {
        id: 'uk-3',
        name: 'Zaynab H.',
        location: 'Manchester, UK',
        country: 'uk',
        quote:
          'My daughter was struggling with Tajweed at madrassa. Within two months of 1-on-1 sessions with Azhary, her teacher at madrassa commented on the improvement. Highly recommend.',
        course: 'Tajweed Course',
        rating: 5,
      },
    ],
    faqs: [
      {
        q: 'Do you adjust class times for British Summer Time (BST)?',
        a: 'Yes. We book all classes in UK local time, so your schedule stays consistent regardless of whether the UK is on GMT or BST. You will never need to recalculate times around the clocks changing.',
      },
      {
        q: "Can these classes complement my child's madrassa or Saturday school?",
        a: "Yes — this is actually one of the most popular use cases in the UK. Group classes at madrassa cover a lot of students and can move quickly. Our 1-on-1 sessions let the teacher focus entirely on your child's specific weaknesses, recitation errors, or memorization targets.",
      },
      {
        q: 'Do you have teachers trained at UK or European institutions?',
        a: 'Our teachers are primarily trained at Al-Azhar University in Egypt and similar internationally accredited institutions. Several have also studied at Darul Uloom institutions with UK affiliations. All hold an authenticated Ijazah chain.',
      },
      {
        q: 'Are there classes available for adults who want to improve their recitation?',
        a: 'Yes. A large portion of our UK students are adults who learned Quran as children but want to correct their Tajweed or complete the full Quran with proper pronunciation. We offer dedicated Tajweed courses for adults.',
      },
      {
        q: 'Can I get an Ijazah certificate through Azhary?',
        a: 'Yes. Our Ijazah program is available for students who have memorized the Quran (Huffaz) and want to receive a certified chain of transmission. The process typically takes 6–12 months of dedicated sessions. UK students have completed their Ijazah with us.',
      },
    ],
    seo: {
      title: 'Online Quran Classes UK | Certified Teachers | Azhary',
      description:
        'Online Quran classes in the UK with Al-Azhar certified teachers. GMT & BST scheduling, female teachers available, free trial class. Serving England, Scotland, Wales & NI.',
    },
    schema: { addressLocality: 'London', addressCountry: 'GB' },
  },
  {
    slug: 'canada',
    name: 'Canada',
    shortName: 'Canada',
    flagEmoji: '🇨🇦',
    hero: {
      h1: 'Online Quran Classes in Canada',
      subheading:
        'Six Canadian time zones covered — from Halifax on Atlantic Time to Vancouver on Pacific Time. 1-on-1 classes with certified teachers, seven days a week.',
    },
    whyUs: [
      {
        icon: 'Globe',
        title: 'All Six Canadian Time Zones',
        body: "We cover Atlantic, Eastern, Central, Mountain, Pacific, and Newfoundland time. Whether you're in Halifax, Toronto, Calgary, or Vancouver, we have a class time that works.",
      },
      {
        icon: 'Users',
        title: "Welcoming Canada's Diverse Muslim Communities",
        body: "Canada's Muslim population spans dozens of ethnic and cultural backgrounds. Our teachers are experienced working with students from South Asian, Arab, African, and convert backgrounds.",
      },
      {
        icon: 'ShieldCheck',
        title: 'Ijazah-Certified, Fully Vetted Teachers',
        body: 'Every teacher holds an authenticated chain of Quran transmission traceable to the Prophet ﷺ. All undergo background screening and a supervised trial teaching session before joining.',
      },
      {
        icon: 'BookOpen',
        title: 'From Alif-Ba-Ta to Ijazah',
        body: 'Whether your child is learning their first Arabic letters or you are an adult aiming to complete your Hifz, we have a program and a teacher for every level.',
      },
    ],
    timezone: {
      label: 'AT · ET · CT · MT · PT · NT',
      note: 'Classes are booked in your local Canadian time zone. Sessions are available early morning, after school, and evening to fit school and work schedules.',
      slots: [
        '7 AM – 9 AM (before school/work)',
        '4 PM – 7 PM (after school)',
        '7 PM – 10 PM (evening)',
        'Weekends 8 AM – 1 PM',
      ],
    },
    localCurrencyNote: '≈ C$41–C$95/month at current exchange rates (billed in USD).',
    testimonials: [
      {
        id: 'ca-1',
        name: 'Ahmed K.',
        location: 'Toronto, ON',
        country: 'canada',
        quote:
          "I started as a complete beginner and now read the Quran with confidence. The 1-on-1 format makes all the difference — the teacher focuses entirely on me and my pace.",
        course: 'Noorani Qaida',
        rating: 5,
      },
      {
        id: 'ca-2',
        name: 'Ibrahim F.',
        location: 'Calgary, AB',
        country: 'canada',
        quote:
          'Calgary is not well served by local Islamic schools. Azhary filled that gap perfectly. My children now have consistent, high-quality Quran instruction from home.',
        course: 'Quran for Kids',
        rating: 5,
      },
      {
        id: 'ca-3',
        name: 'Maryam T.',
        location: 'Vancouver, BC',
        country: 'canada',
        quote:
          "The Pacific Time evening slots are perfect. My kids finish school, have a snack, and join their Quran class before dinner. The routine has been transformative for our household.",
        course: 'Quran for Kids',
        rating: 5,
      },
    ],
    faqs: [
      {
        q: 'Do you serve students across all Canadian provinces and territories?',
        a: 'Yes. Since classes are fully online, students join from all ten provinces and three territories. We have active students in Ontario, Quebec, British Columbia, Alberta, and beyond.',
      },
      {
        q: 'Can French-speaking students from Quebec join?',
        a: 'Our classes are conducted in English and Arabic. We do not currently offer French-language instruction. However, many Quebec students — including those whose first language is French — join our English-language Quran classes without difficulty, as the primary focus is Arabic Quranic recitation.',
      },
      {
        q: 'What are the class times for students in British Columbia (Pacific Time)?',
        a: 'Pacific Time students typically book early morning sessions (6–9 AM PT) or evening sessions (5–10 PM PT). These correspond to afternoon and late-evening slots for our teachers, all of which are available.',
      },
      {
        q: 'Is there a sibling discount for Canadian families with multiple children?',
        a: 'Yes. Premium plan subscribers receive a 20% discount on each additional sibling enrolled. Contact us via WhatsApp after your free trial to activate the family discount.',
      },
      {
        q: 'How do Canadian payment methods work?',
        a: 'Payments are processed in USD via Stripe, which accepts all major Canadian credit and debit cards (Visa, Mastercard, Amex). There are no additional currency conversion fees from our side — your bank may apply a standard FX conversion rate.',
      },
    ],
    seo: {
      title: 'Online Quran Classes Canada | Certified Teachers | Azhary',
      description:
        'Online Quran classes in Canada with Al-Azhar certified teachers. All Canadian time zones, 1-on-1 sessions, free first class. Serving Ontario, BC, Alberta & all provinces.',
    },
    schema: { addressLocality: 'Toronto', addressCountry: 'CA' },
  },
  {
    slug: 'australia',
    name: 'Australia',
    shortName: 'Australia',
    flagEmoji: '🇦🇺',
    hero: {
      h1: 'Online Quran Classes in Australia',
      subheading:
        'AEST, ACST, and AWST all covered — early morning, afternoon, and evening sessions for students from Sydney to Perth.',
    },
    whyUs: [
      {
        icon: 'Clock',
        title: 'AEST, ACST & AWST Scheduling',
        body: 'We serve students in all three Australian time zones — Eastern (NSW, VIC, QLD), Central (SA, NT), and Western (WA). Classes available before school, after school, and in the evenings.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Authentic Ijazah Certification',
        body: 'Australian Muslim families increasingly demand authentic Islamic credentials, not just basic tutoring. All our teachers hold a verified Ijazah chain recognized by Islamic scholars worldwide.',
      },
      {
        icon: 'Heart',
        title: 'School Holiday Availability',
        body: 'Unlike local Islamic schools and weekend classes that close for holidays, Azhary runs year-round. We are fully available during Australian school holidays and public holidays.',
      },
      {
        icon: 'BookOpen',
        title: 'Perfect Complement to Weekend Madrassa',
        body: 'Many Australian students attend mosque-based weekend classes. Our weekday 1-on-1 sessions provide targeted practice that dramatically accelerates progress.',
      },
    ],
    timezone: {
      label: 'AEST · ACST · AWST',
      note: 'All classes are scheduled in your local Australian time zone. Early morning slots (6–9 AM) are especially popular for students who prefer to study before school.',
      slots: [
        '6 AM – 9 AM AEST (before school)',
        '4 PM – 7 PM AEST (after school)',
        '7 PM – 10 PM AEST (evening)',
        'Weekends 7 AM – 12 PM AEST',
      ],
    },
    localCurrencyNote: '≈ A$46–A$108/month at current exchange rates (billed in USD).',
    testimonials: [
      {
        id: 'au-1',
        name: 'Omar M.',
        location: 'Melbourne, VIC',
        country: 'australia',
        quote:
          'The Ijazah program is rigorous and authentic. My teacher has a direct chain to Al-Azhar. I finished my Hifz revision and received my Ijazah certificate — a dream fulfilled.',
        course: 'Ijazah Program',
        rating: 5,
      },
      {
        id: 'au-2',
        name: 'Aisha N.',
        location: 'Sydney, NSW',
        country: 'australia',
        quote:
          "We tried local tutors but found it hard to be consistent. Azhary's fixed weekly schedule and WhatsApp reminders kept us on track. My son completed his first Juz in six months.",
        course: 'Hifz / Memorization',
        rating: 5,
      },
      {
        id: 'au-3',
        name: 'Hassan W.',
        location: 'Brisbane, QLD',
        country: 'australia',
        quote:
          'I started learning Quran as an adult. I thought it was too late, but my teacher made me feel completely at ease. I now read Surah Al-Baqarah with confidence.',
        course: 'Quran for Adults',
        rating: 5,
      },
    ],
    faqs: [
      {
        q: 'Do you offer Quran classes in Perth (Western Australian Time)?',
        a: 'Yes. Perth students book early morning sessions in AWST, which correspond to afternoon slots for our teachers. We have dedicated availability for Western Australia, typically from 6 AM to 10 AM AWST on weekdays and weekends.',
      },
      {
        q: 'Are classes available during Australian school holidays?',
        a: "Yes. We operate year-round, including during all Australian state school holidays, long weekends, and public holidays. Many families use the school holiday break to schedule extra classes and accelerate their child's progress.",
      },
      {
        q: 'Can you help my child prepare for Islamic Studies at an Australian Islamic school?',
        a: "Our courses cover Quran recitation, Tajweed, Hifz, Tafseer, and Islamic Studies — all of which align with the curriculum taught at Australian Islamic schools and weekend madrassas. Our 1-on-1 format helps students who need targeted remediation or enrichment beyond what classroom teaching provides.",
      },
      {
        q: 'How is the connection quality for Zoom classes from Australia?',
        a: 'The vast majority of our Australian students report excellent video quality for their Zoom, Google Meet, or Skype sessions. A standard NBN connection (25 Mbps or above) is more than sufficient. If you experience any connectivity issues, we can switch to audio-only mode — Quran recitation requires clear audio more than video.',
      },
      {
        q: 'Do you have experience working with Australian-born children who speak English as their first language?',
        a: "Yes — this is very common among our Australian students. Our teachers are experienced working with children who have no prior Arabic or Quran knowledge. Classes are conducted in English (with Arabic instruction), and teachers use age-appropriate techniques specifically for native English-speaking children.",
      },
    ],
    seo: {
      title: 'Online Quran Classes Australia | Certified Teachers | Azhary',
      description:
        'Online Quran classes in Australia with certified Al-Azhar teachers. AEST, ACST & AWST scheduling, free first class. Serving Sydney, Melbourne, Brisbane, Perth & more.',
    },
    schema: { addressLocality: 'Sydney', addressCountry: 'AU' },
  },
]

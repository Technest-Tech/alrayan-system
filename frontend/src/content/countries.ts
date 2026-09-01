import type { Testimonial } from './testimonials'
import type { Locale } from '@/i18n/config'

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

export const countriesDataFr: CountryData[] = [
  {
    slug: 'usa',
    name: 'États-Unis',
    shortName: 'États-Unis',
    flagEmoji: '🇺🇸',
    hero: {
      h1: 'Cours de Coran en ligne aux États-Unis',
      subheading:
        'Des enseignants certifiés d’Al-Azhar disponibles du matin jusqu’au soir dans les quatre fuseaux horaires américains — Est, Centre, Montagnes et Pacifique.',
    },
    whyUs: [
      {
        icon: 'Clock',
        title: 'Tous les fuseaux horaires américains couverts',
        body: 'Les cours ont lieu de 6 h à minuit (heure de l’Est), sept jours sur sept. Que vous soyez à New York ou à Los Angeles, nous avons un créneau adapté à votre emploi du temps.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Enseignants certifiés d’Al-Azhar',
        body: 'Chaque enseignant détient une Ijazah authentifiée et a réussi un processus de sélection rigoureux. Moins de 10 % des candidats sont retenus.',
      },
      {
        icon: 'Heart',
        title: 'Enseignantes disponibles',
        body: 'Nous disposons d’enseignantes de Coran qualifiées pour les élèves femmes et pour les familles qui préfèrent une enseignante pour leurs enfants.',
      },
      {
        icon: 'Users',
        title: 'Au service de plus de 10 000 familles dans le monde entier',
        body: 'De Dearborn à Houston en passant par New York, des milliers de familles musulmanes américaines font confiance à Azhary pour l’éducation coranique de leurs enfants.',
      },
    ],
    timezone: {
      label: 'ET · CT · MT · PT',
      note: 'Tous les cours sont planifiés dans votre fuseau horaire local. Nous confirmons le lien de connexion et l’horaire 24 heures avant chaque séance.',
      slots: [
        '6 h – 9 h ET (matin)',
        '12 h – 15 h ET (après-midi)',
        '17 h – 21 h ET (soir)',
        '21 h – 0 h ET (nuit)',
      ],
    },
    localCurrencyNote: 'Les prix sont en USD. Les formules commencent à 30 $/mois.',
    testimonials: [
      {
        id: 'usa-1',
        name: 'Fatima R.',
        location: 'New York, NY',
        country: 'usa',
        quote:
          'Avoir une enseignante était très important pour moi. Les horaires de cours sont flexibles et s’adaptent parfaitement à mes heures de travail. Je me sens tellement à l’aise et soutenue.',
        course: 'Tajwid pour adultes',
        rating: 5,
      },
      {
        id: 'usa-2',
        name: 'Khalid M.',
        location: 'Houston, TX',
        country: 'usa',
        quote:
          'Mon fils est parti de zéro et a désormais mémorisé la moitié de son Hifz. L’enseignant prend de nos nouvelles sur WhatsApp chaque semaine — nous nous sentons comme en famille.',
        course: 'Hifz / Mémorisation',
        rating: 5,
      },
      {
        id: 'usa-3',
        name: 'Nadia S.',
        location: 'Dearborn, MI',
        country: 'usa',
        quote:
          'En tant que convertie, j’avais peur de trouver un enseignant qui serait patient avec mon niveau de grande débutante. Mon enseignant a été formidable — bienveillant, clair et encourageant.',
        course: 'Noorani Qaida',
        rating: 5,
      },
    ],
    faqs: [
      {
        q: 'Proposez-vous des cours de Coran dans tous les fuseaux horaires américains ?',
        a: 'Oui. Nous avons des enseignants disponibles de 6 h à minuit (heure de l’Est), ce qui couvre les créneaux tôt le matin pour les États de l’Est et les créneaux du soir pour l’heure du Pacifique. Vous choisissez un horaire récurrent qui vous convient.',
      },
      {
        q: 'Vos enseignants sont-ils reconnus ou certifiés aux États-Unis ?',
        a: 'Nos enseignants détiennent des certifications Ijazah de l’université Al-Azhar et d’institutions islamiques accréditées équivalentes — ce sont les diplômes les plus reconnus au niveau international dans l’enseignement coranique. La certification est religieuse plutôt que délivrée par l’État, et Al-Azhar est reconnue par les savants et les mosquées à travers les États-Unis.',
      },
      {
        q: 'Mon enfant peut-il s’inscrire s’il n’a jamais appris le Coran auparavant ?',
        a: 'Absolument. Nous accueillons des grands débutants de tous âges. Nous commençons par le Noorani Qaida — le programme fondamental de reconnaissance des lettres arabes — et progressons au rythme de votre enfant. Aucune connaissance préalable n’est requise.',
      },
      {
        q: 'Servez-vous les élèves de Dearborn, Houston ou d’autres grandes communautés musulmanes ?',
        a: 'Oui. Les élèves nous rejoignent depuis les 50 États. Étant entièrement en ligne, il n’y a aucune restriction géographique. Il vous suffit d’un appareil, d’une connexion Internet et d’un espace calme.',
      },
      {
        q: 'Quelle plateforme vidéo utilisez-vous pour les cours ?',
        a: 'Les cours se déroulent via Zoom, Google Meet ou Skype — selon votre préférence. Nous envoyons un lien de connexion avant chaque séance. Aucun logiciel spécial au-delà de l’application vidéo n’est requis.',
      },
      {
        q: 'Le premier cours est-il vraiment gratuit sans carte bancaire ?',
        a: 'Oui. Le cours d’essai est entièrement gratuit et ne nécessite aucune information de paiement. Nous n’abordons le paiement que si vous décidez de continuer après votre première séance.',
      },
    ],
    seo: {
      title: 'Cours de Coran en ligne aux États-Unis | Enseignants certifiés | Azhary',
      description:
        'Apprenez le Coran en ligne aux États-Unis avec des enseignants certifiés d’Al-Azhar. Tous les fuseaux horaires américains, cours particuliers, première leçon gratuite. Rejoignez des milliers de familles musulmanes américaines.',
    },
    schema: { addressLocality: 'Washington D.C.', addressCountry: 'US' },
  },
  {
    slug: 'uk',
    name: 'Royaume-Uni',
    shortName: 'Royaume-Uni',
    flagEmoji: '🇬🇧',
    hero: {
      h1: 'Cours de Coran en ligne au Royaume-Uni',
      subheading:
        'Des séances le matin et le soir calées sur GMT et BST — au service des élèves d’Angleterre, d’Écosse, du pays de Galles et d’Irlande du Nord.',
    },
    whyUs: [
      {
        icon: 'Clock',
        title: 'Planification GMT & BST',
        body: 'Les cours ont lieu de 6 h à 23 h (heure britannique) tout au long de l’année — avec ajustement automatique pour l’heure d’été britannique. Aucun emploi du temps perturbé lors du changement d’heure.',
      },
      {
        icon: 'GraduationCap',
        title: 'Enseignants formés à Al-Azhar et à l’école déobandie',
        body: 'Notre équipe d’enseignants comprend des savants formés à Al-Azhar, dans les institutions Darul Uloom et dans d’autres grandes universités islamiques. Tous détiennent une Ijazah authentifiée.',
      },
      {
        icon: 'BookOpen',
        title: 'Complétez l’école islamique de votre enfant',
        body: 'Beaucoup de nos élèves britanniques fréquentent aussi la madrassa du samedi ou une école islamique. Nos cours particuliers offrent un entraînement ciblé que les cours en groupe ne peuvent égaler.',
      },
      {
        icon: 'Heart',
        title: 'Enseignantes pour les sœurs et les filles',
        body: 'Une équipe dédiée d’enseignantes qualifiées est disponible pour les élèves femmes de tous âges. De nombreuses familles britanniques demandent spécifiquement notre option d’enseignante.',
      },
    ],
    timezone: {
      label: 'GMT · BST',
      note: 'Toutes les séances sont réservées à l’heure locale britannique et s’ajustent automatiquement à l’heure d’été britannique. Vous n’aurez jamais à calculer manuellement les décalages horaires.',
      slots: [
        '7 h – 9 h (avant l’école)',
        '16 h – 19 h (après l’école)',
        '19 h – 22 h (soir)',
        'Week-ends 8 h – 12 h',
      ],
    },
    localCurrencyNote: '≈ 24–56 £/mois aux taux de change actuels (facturé en USD).',
    testimonials: [
      {
        id: 'uk-1',
        name: 'Sarah A.',
        location: 'Londres, Royaume-Uni',
        country: 'uk',
        quote:
          'Le Tajwid de mes enfants s’est amélioré au point d’être méconnaissable en seulement 3 mois. Les enseignants sont si patients et compétents — ma fille attend même ses cours avec impatience chaque jour.',
        course: 'Coran pour enfants',
        rating: 5,
      },
      {
        id: 'uk-2',
        name: 'Amina H.',
        location: 'Birmingham, Royaume-Uni',
        country: 'uk',
        quote:
          'J’ai essayé plusieurs académies en ligne. Azhary est la seule où je me suis sentie véritablement soutenue. L’essai gratuit m’a immédiatement convaincue — la qualité est exceptionnelle.',
        course: 'Arabe pour non-arabophones',
        rating: 5,
      },
      {
        id: 'uk-3',
        name: 'Zaynab H.',
        location: 'Manchester, Royaume-Uni',
        country: 'uk',
        quote:
          'Ma fille avait des difficultés en Tajwid à la madrassa. En deux mois de cours particuliers avec Azhary, son enseignant à la madrassa a remarqué les progrès. Je recommande vivement.',
        course: 'Cours de Tajwid',
        rating: 5,
      },
    ],
    faqs: [
      {
        q: 'Ajustez-vous les horaires des cours pour l’heure d’été britannique (BST) ?',
        a: 'Oui. Nous réservons tous les cours à l’heure locale britannique, afin que votre emploi du temps reste constant que le Royaume-Uni soit à l’heure GMT ou BST. Vous n’aurez jamais à recalculer les horaires lors du changement d’heure.',
      },
      {
        q: 'Ces cours peuvent-ils compléter la madrassa ou l’école du samedi de mon enfant ?',
        a: 'Oui — c’est en fait l’un des usages les plus populaires au Royaume-Uni. Les cours en groupe à la madrassa accueillent de nombreux élèves et peuvent avancer rapidement. Nos cours particuliers permettent à l’enseignant de se concentrer entièrement sur les faiblesses spécifiques de votre enfant, ses erreurs de récitation ou ses objectifs de mémorisation.',
      },
      {
        q: 'Avez-vous des enseignants formés dans des institutions britanniques ou européennes ?',
        a: 'Nos enseignants sont principalement formés à l’université Al-Azhar en Égypte et dans des institutions similaires accréditées au niveau international. Plusieurs ont également étudié dans des institutions Darul Uloom affiliées au Royaume-Uni. Tous détiennent une chaîne d’Ijazah authentifiée.',
      },
      {
        q: 'Existe-t-il des cours pour les adultes qui souhaitent améliorer leur récitation ?',
        a: 'Oui. Une grande partie de nos élèves britanniques sont des adultes qui ont appris le Coran enfants mais souhaitent corriger leur Tajwid ou terminer l’ensemble du Coran avec une prononciation correcte. Nous proposons des cours de Tajwid dédiés aux adultes.',
      },
      {
        q: 'Puis-je obtenir un certificat d’Ijazah via Azhary ?',
        a: 'Oui. Notre programme d’Ijazah est ouvert aux élèves qui ont mémorisé le Coran (Huffaz) et souhaitent recevoir une chaîne de transmission certifiée. Le processus prend généralement de 6 à 12 mois de séances assidues. Des élèves britanniques ont obtenu leur Ijazah avec nous.',
      },
    ],
    seo: {
      title: 'Cours de Coran en ligne au Royaume-Uni | Enseignants certifiés | Azhary',
      description:
        'Cours de Coran en ligne au Royaume-Uni avec des enseignants certifiés d’Al-Azhar. Planification GMT & BST, enseignantes disponibles, cours d’essai gratuit. Au service de l’Angleterre, l’Écosse, le pays de Galles et l’Irlande du Nord.',
    },
    schema: { addressLocality: 'London', addressCountry: 'GB' },
  },
  {
    slug: 'canada',
    name: 'Canada',
    shortName: 'Canada',
    flagEmoji: '🇨🇦',
    hero: {
      h1: 'Cours de Coran en ligne au Canada',
      subheading:
        'Six fuseaux horaires canadiens couverts — de Halifax à l’heure de l’Atlantique à Vancouver à l’heure du Pacifique. Cours particuliers avec des enseignants certifiés, sept jours sur sept.',
    },
    whyUs: [
      {
        icon: 'Globe',
        title: 'Les six fuseaux horaires canadiens',
        body: 'Nous couvrons les heures de l’Atlantique, de l’Est, du Centre, des Rocheuses, du Pacifique et de Terre-Neuve. Que vous soyez à Halifax, Toronto, Calgary ou Vancouver, nous avons un horaire de cours qui convient.',
      },
      {
        icon: 'Users',
        title: 'Au service des diverses communautés musulmanes du Canada',
        body: 'La population musulmane du Canada compte des dizaines d’origines ethniques et culturelles. Nos enseignants ont l’expérience du travail avec des élèves d’origine sud-asiatique, arabe, africaine et convertie.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Enseignants certifiés par Ijazah et entièrement sélectionnés',
        body: 'Chaque enseignant détient une chaîne authentifiée de transmission du Coran remontant jusqu’au Prophète ﷺ. Tous font l’objet d’une vérification des antécédents et d’une séance d’enseignement d’essai supervisée avant de rejoindre l’équipe.',
      },
      {
        icon: 'BookOpen',
        title: 'De l’Alif-Ba-Ta à l’Ijazah',
        body: 'Que votre enfant apprenne ses premières lettres arabes ou que vous soyez un adulte visant à terminer votre Hifz, nous avons un programme et un enseignant pour chaque niveau.',
      },
    ],
    timezone: {
      label: 'AT · ET · CT · MT · PT · NT',
      note: 'Les cours sont réservés dans votre fuseau horaire canadien local. Les séances sont disponibles tôt le matin, après l’école et le soir pour s’adapter aux horaires scolaires et professionnels.',
      slots: [
        '7 h – 9 h (avant l’école/le travail)',
        '16 h – 19 h (après l’école)',
        '19 h – 22 h (soir)',
        'Week-ends 8 h – 13 h',
      ],
    },
    localCurrencyNote: '≈ 41–95 $ CA/mois aux taux de change actuels (facturé en USD).',
    testimonials: [
      {
        id: 'ca-1',
        name: 'Ahmed K.',
        location: 'Toronto, ON',
        country: 'canada',
        quote:
          'J’ai commencé en grand débutant et je lis maintenant le Coran avec assurance. Le format en cours particuliers fait toute la différence — l’enseignant se concentre entièrement sur moi et sur mon rythme.',
        course: 'Noorani Qaida',
        rating: 5,
      },
      {
        id: 'ca-2',
        name: 'Ibrahim F.',
        location: 'Calgary, AB',
        country: 'canada',
        quote:
          'Calgary est mal desservie par les écoles islamiques locales. Azhary a comblé cette lacune à la perfection. Mes enfants bénéficient désormais d’un enseignement coranique régulier et de grande qualité depuis la maison.',
        course: 'Coran pour enfants',
        rating: 5,
      },
      {
        id: 'ca-3',
        name: 'Maryam T.',
        location: 'Vancouver, BC',
        country: 'canada',
        quote:
          'Les créneaux du soir à l’heure du Pacifique sont parfaits. Mes enfants finissent l’école, prennent une collation et rejoignent leur cours de Coran avant le dîner. La routine a transformé notre foyer.',
        course: 'Coran pour enfants',
        rating: 5,
      },
    ],
    faqs: [
      {
        q: 'Servez-vous les élèves de toutes les provinces et de tous les territoires canadiens ?',
        a: 'Oui. Comme les cours sont entièrement en ligne, les élèves nous rejoignent depuis les dix provinces et les trois territoires. Nous avons des élèves actifs en Ontario, au Québec, en Colombie-Britannique, en Alberta et au-delà.',
      },
      {
        q: 'Les élèves francophones du Québec peuvent-ils s’inscrire ?',
        a: 'Nos cours sont dispensés en anglais et en arabe. Nous ne proposons pas actuellement d’enseignement en français. Cependant, de nombreux élèves québécois — y compris ceux dont la langue maternelle est le français — suivent nos cours de Coran en anglais sans difficulté, car l’accent principal est mis sur la récitation coranique en arabe.',
      },
      {
        q: 'Quels sont les horaires des cours pour les élèves de Colombie-Britannique (heure du Pacifique) ?',
        a: 'Les élèves à l’heure du Pacifique réservent généralement des séances tôt le matin (6–9 h PT) ou en soirée (17–22 h PT). Celles-ci correspondent aux créneaux de l’après-midi et de la fin de soirée pour nos enseignants, tous disponibles.',
      },
      {
        q: 'Existe-t-il une réduction pour les fratries des familles canadiennes ayant plusieurs enfants ?',
        a: 'Oui. Les abonnés à la formule Premium bénéficient d’une réduction de 20 % pour chaque frère ou sœur supplémentaire inscrit. Contactez-nous via WhatsApp après votre essai gratuit pour activer la réduction familiale.',
      },
      {
        q: 'Comment fonctionnent les moyens de paiement canadiens ?',
        a: 'Les paiements sont traités en USD via Stripe, qui accepte toutes les principales cartes de crédit et de débit canadiennes (Visa, Mastercard, Amex). Il n’y a aucuns frais de conversion supplémentaires de notre côté — votre banque peut appliquer un taux de conversion de change standard.',
      },
    ],
    seo: {
      title: 'Cours de Coran en ligne au Canada | Enseignants certifiés | Azhary',
      description:
        'Cours de Coran en ligne au Canada avec des enseignants certifiés d’Al-Azhar. Tous les fuseaux horaires canadiens, cours particuliers, premier cours gratuit. Au service de l’Ontario, la Colombie-Britannique, l’Alberta et toutes les provinces.',
    },
    schema: { addressLocality: 'Toronto', addressCountry: 'CA' },
  },
  {
    slug: 'australia',
    name: 'Australie',
    shortName: 'Australie',
    flagEmoji: '🇦🇺',
    hero: {
      h1: 'Cours de Coran en ligne en Australie',
      subheading:
        'AEST, ACST et AWST tous couverts — des séances tôt le matin, l’après-midi et le soir pour les élèves de Sydney à Perth.',
    },
    whyUs: [
      {
        icon: 'Clock',
        title: 'Planification AEST, ACST & AWST',
        body: 'Nous servons les élèves dans les trois fuseaux horaires australiens — Est (NSW, VIC, QLD), Centre (SA, NT) et Ouest (WA). Cours disponibles avant l’école, après l’école et en soirée.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Certification Ijazah authentique',
        body: 'Les familles musulmanes australiennes exigent de plus en plus des diplômes islamiques authentiques, et pas seulement du soutien scolaire de base. Tous nos enseignants détiennent une chaîne d’Ijazah vérifiée, reconnue par les savants islamiques dans le monde entier.',
      },
      {
        icon: 'Heart',
        title: 'Disponibilité pendant les vacances scolaires',
        body: 'Contrairement aux écoles islamiques locales et aux cours du week-end qui ferment pendant les vacances, Azhary fonctionne toute l’année. Nous sommes entièrement disponibles pendant les vacances scolaires australiennes et les jours fériés.',
      },
      {
        icon: 'BookOpen',
        title: 'Le complément parfait à la madrassa du week-end',
        body: 'De nombreux élèves australiens fréquentent des cours du week-end à la mosquée. Nos cours particuliers en semaine offrent un entraînement ciblé qui accélère considérablement les progrès.',
      },
    ],
    timezone: {
      label: 'AEST · ACST · AWST',
      note: 'Tous les cours sont planifiés dans votre fuseau horaire australien local. Les créneaux tôt le matin (6–9 h) sont particulièrement prisés des élèves qui préfèrent étudier avant l’école.',
      slots: [
        '6 h – 9 h AEST (avant l’école)',
        '16 h – 19 h AEST (après l’école)',
        '19 h – 22 h AEST (soir)',
        'Week-ends 7 h – 12 h AEST',
      ],
    },
    localCurrencyNote: '≈ 46–108 $ AU/mois aux taux de change actuels (facturé en USD).',
    testimonials: [
      {
        id: 'au-1',
        name: 'Omar M.',
        location: 'Melbourne, VIC',
        country: 'australia',
        quote:
          'Le programme d’Ijazah est rigoureux et authentique. Mon enseignant possède une chaîne directe jusqu’à Al-Azhar. J’ai terminé ma révision de Hifz et reçu mon certificat d’Ijazah — un rêve réalisé.',
        course: 'Programme Ijazah',
        rating: 5,
      },
      {
        id: 'au-2',
        name: 'Aisha N.',
        location: 'Sydney, NSW',
        country: 'australia',
        quote:
          'Nous avons essayé des professeurs particuliers locaux mais avons eu du mal à être réguliers. L’horaire hebdomadaire fixe de Azhary et les rappels WhatsApp nous ont maintenus sur la bonne voie. Mon fils a terminé son premier Juz en six mois.',
        course: 'Hifz / Mémorisation',
        rating: 5,
      },
      {
        id: 'au-3',
        name: 'Hassan W.',
        location: 'Brisbane, QLD',
        country: 'australia',
        quote:
          'J’ai commencé à apprendre le Coran à l’âge adulte. Je pensais qu’il était trop tard, mais mon enseignant m’a mis complètement à l’aise. Je lis désormais la sourate Al-Baqarah avec assurance.',
        course: 'Coran pour adultes',
        rating: 5,
      },
    ],
    faqs: [
      {
        q: 'Proposez-vous des cours de Coran à Perth (heure de l’Australie-Occidentale) ?',
        a: 'Oui. Les élèves de Perth réservent des séances tôt le matin en AWST, qui correspondent aux créneaux de l’après-midi pour nos enseignants. Nous avons une disponibilité dédiée pour l’Australie-Occidentale, généralement de 6 h à 10 h AWST en semaine et le week-end.',
      },
      {
        q: 'Les cours sont-ils disponibles pendant les vacances scolaires australiennes ?',
        a: 'Oui. Nous fonctionnons toute l’année, y compris pendant toutes les vacances scolaires des États australiens, les longs week-ends et les jours fériés. De nombreuses familles profitent des vacances scolaires pour programmer des cours supplémentaires et accélérer les progrès de leur enfant.',
      },
      {
        q: 'Pouvez-vous aider mon enfant à se préparer aux sciences islamiques dans une école islamique australienne ?',
        a: 'Nos cours couvrent la récitation du Coran, le Tajwid, le Hifz, le Tafsir et les sciences islamiques — autant de matières qui s’alignent sur le programme enseigné dans les écoles islamiques australiennes et les madrassas du week-end. Notre format en cours particuliers aide les élèves qui ont besoin d’un soutien ciblé ou d’un enrichissement au-delà de ce qu’offre l’enseignement en classe.',
      },
      {
        q: 'Quelle est la qualité de la connexion pour les cours Zoom depuis l’Australie ?',
        a: 'La grande majorité de nos élèves australiens signalent une excellente qualité vidéo pour leurs séances Zoom, Google Meet ou Skype. Une connexion NBN standard (25 Mbps ou plus) est amplement suffisante. En cas de problème de connectivité, nous pouvons passer en mode audio seul — la récitation du Coran exige un son clair plus qu’une image.',
      },
      {
        q: 'Avez-vous l’expérience du travail avec des enfants nés en Australie dont l’anglais est la première langue ?',
        a: 'Oui — c’est très courant parmi nos élèves australiens. Nos enseignants ont l’expérience du travail avec des enfants n’ayant aucune connaissance préalable de l’arabe ou du Coran. Les cours sont dispensés en anglais (avec un enseignement de l’arabe), et les enseignants utilisent des techniques adaptées à l’âge, spécifiquement conçues pour les enfants dont l’anglais est la langue maternelle.',
      },
    ],
    seo: {
      title: 'Cours de Coran en ligne en Australie | Enseignants certifiés | Azhary',
      description:
        'Cours de Coran en ligne en Australie avec des enseignants certifiés d’Al-Azhar. Planification AEST, ACST & AWST, premier cours gratuit. Au service de Sydney, Melbourne, Brisbane, Perth et plus encore.',
    },
    schema: { addressLocality: 'Sydney', addressCountry: 'AU' },
  },
]

export function getCountriesData(locale: Locale): CountryData[] {
  return locale === 'fr' ? countriesDataFr : countriesData
}

export type FaqCategory = 'General' | 'Classes' | 'Teachers' | 'Pricing' | 'Technical'

export type FaqItem = {
  id: string
  q: string
  a: string
  category: FaqCategory
}

export const faqCategories: FaqCategory[] = [
  'General',
  'Classes',
  'Teachers',
  'Pricing',
  'Technical',
]

export const faqs: FaqItem[] = [
  // General
  {
    id: 'g1',
    category: 'General',
    q: 'What is Azhary?',
    a: 'Azhary is an online Quran and Arabic education academy offering 1-on-1 live classes with certified teachers from Al-Azhar University and other leading Islamic institutions. We serve students in 50+ countries across all age groups and levels.',
  },
  {
    id: 'g2',
    category: 'General',
    q: 'What courses do you offer?',
    a: 'We offer Noorani Qaida, Quran recitation for kids and adults, Tajweed, Hifz (memorization), Arabic for non-Arabic speakers, Tafseer, Islamic Studies, Ijazah program, and Ten Qiraat. See our Courses page for full details.',
  },
  {
    id: 'g3',
    category: 'General',
    q: 'Which countries do you serve?',
    a: 'We serve students in over 50 countries including the USA, UK, Canada, Australia, and across Europe, Asia, and Africa. Classes run 7 days a week to cover all major timezones.',
  },
  {
    id: 'g4',
    category: 'General',
    q: 'Do you offer classes for children?',
    a: 'Yes. We have dedicated programs for children as young as 5. Our teachers are trained to engage young learners, and we offer female teachers for families who prefer them.',
  },
  // Classes
  {
    id: 'c1',
    category: 'Classes',
    q: 'How does a trial class work?',
    a: "Fill out the contact form and we will match you with a suitable teacher based on your level, schedule, and preferences. The first class is completely free — no credit card required. After the class, you decide whether to continue.",
  },
  {
    id: 'c2',
    category: 'Classes',
    q: 'What platform are classes held on?',
    a: 'Classes are held via Zoom, Google Meet, or Skype — whichever you prefer. We send you the meeting link before each session.',
  },
  {
    id: 'c3',
    category: 'Classes',
    q: 'Can I choose my class schedule?',
    a: 'Yes. After matching with a teacher, you agree on a recurring time slot that fits both schedules. Classes run 7 days a week, including evenings and weekends.',
  },
  {
    id: 'c4',
    category: 'Classes',
    q: 'What if I need to reschedule?',
    a: 'We offer free rescheduling with 24 hours notice. Simply message your teacher or our admin team on WhatsApp and we will arrange an alternative slot.',
  },
  {
    id: 'c5',
    category: 'Classes',
    q: 'Are classes recorded?',
    a: "Sessions are not recorded by default to protect student privacy. If you would like recordings for review, please discuss this with your teacher and our admin team.",
  },
  // Teachers
  {
    id: 't1',
    category: 'Teachers',
    q: 'Are your teachers qualified?',
    a: "All teachers hold an authenticated Ijazah — a certified chain of Quran transmission traceable back to the Prophet سلم — and are graduates of Al-Azhar University or equivalent accredited Islamic institutions. Less than 10% of applicants pass our vetting process.",
  },
  {
    id: 't2',
    category: 'Teachers',
    q: 'Do you have female teachers?',
    a: 'Yes. We have several highly qualified female teachers available for female students or families who prefer a female teacher for their children. Indicate your preference when booking your trial.',
  },
  {
    id: 't3',
    category: 'Teachers',
    q: 'Can I request a specific teacher?',
    a: 'Growth and Premium plan subscribers can request priority teacher selection. Starter plan students are matched based on level and availability. You can always request a change if the initial match is not the right fit.',
  },
  {
    id: 't4',
    category: 'Teachers',
    q: "What if my child doesn't connect with their teacher?",
    a: "Teacher compatibility matters. If your child is not clicking with their current teacher, message us on WhatsApp and we will arrange a free switch to another teacher — no questions asked.",
  },
  // Pricing
  {
    id: 'p1',
    category: 'Pricing',
    q: 'How much do classes cost?',
    a: 'Plans start at $30/month for 8 classes. See our Pricing page for the full breakdown of Starter, Growth, and Premium plans.',
  },
  {
    id: 'p2',
    category: 'Pricing',
    q: 'Is there a contract or lock-in period?',
    a: 'No. All plans are month-to-month. You can upgrade, downgrade, or cancel at any time before your next billing date.',
  },
  {
    id: 'p3',
    category: 'Pricing',
    q: 'Do you offer family discounts?',
    a: 'Yes. Premium plan subscribers receive 20% off for each additional sibling enrolled. Contact us after your free trial to activate the sibling discount.',
  },
  {
    id: 'p4',
    category: 'Pricing',
    q: 'What payment methods do you accept?',
    a: 'We accept Visa, Mastercard, Amex, and PayPal. All transactions are in USD and processed securely.',
  },
  // Technical
  {
    id: 'tech1',
    category: 'Technical',
    q: 'What do I need to join a class?',
    a: 'A computer, tablet, or smartphone with a working camera, microphone, and a stable internet connection. Zoom, Google Meet, or Skype installed (free). No other software is required.',
  },
  {
    id: 'tech2',
    category: 'Technical',
    q: 'What internet speed do I need?',
    a: 'A minimum of 2 Mbps upload and download is sufficient for video classes. We recommend 5 Mbps+ for the best experience.',
  },
  {
    id: 'tech3',
    category: 'Technical',
    q: 'Can I join from a mobile phone or tablet?',
    a: 'Yes. Zoom, Meet, and Skype all have iOS and Android apps. Many students join from tablets, which provide a large enough screen for reading Quran text.',
  },
  {
    id: 'tech4',
    category: 'Technical',
    q: 'What if I have a technical issue during a class?',
    a: 'Contact your teacher or our WhatsApp support line. If a class is disrupted by a technical issue on our side, the session is not counted against your monthly allocation.',
  },
]

export const faqPageContent = {
  hero: {
    eyebrow: 'Frequently Asked Questions',
    heading: 'Everything You Need to Know',
    subheading: "Can't find your answer? Chat with us on WhatsApp — we reply within minutes.",
  },
  cta: {
    heading: 'Still Have Questions?',
    subheading: 'Our team is available on WhatsApp 7 days a week. We typically reply within 10 minutes.',
    ctaPrimary: 'Book Free Trial',
    ctaSecondary: 'Chat on WhatsApp',
  },
}

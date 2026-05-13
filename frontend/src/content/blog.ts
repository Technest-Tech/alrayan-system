export type BlogCategory = {
  slug: string
  title: string
}

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  body: string
  cover_image: string | null
  seo_title?: string
  seo_description?: string
  published_at: string
  reading_minutes: number
  categories: BlogCategory[]
  author: { name: string }
}

export const blogCategories: BlogCategory[] = [
  { slug: 'quran-learning',    title: 'Quran Learning' },
  { slug: 'tajweed',           title: 'Tajweed' },
  { slug: 'hifz-memorization', title: 'Hifz & Memorization' },
  { slug: 'arabic-language',   title: 'Arabic Language' },
  { slug: 'islamic-studies',   title: 'Islamic Studies' },
  { slug: 'tips-guides',       title: 'Tips & Guides' },
]

export const blogPosts: BlogPost[] = [
  {
    slug:            'how-to-choose-quran-teacher-online',
    title:           'How to Choose a Quran Teacher Online: 7 Things to Look For',
    excerpt:         'A practical checklist covering Ijazah credentials, teaching style, trial lessons, and scheduling flexibility — so you choose the right teacher from the start.',
    cover_image:     null,
    seo_title:       'How to Choose an Online Quran Teacher | 7-Point Checklist | Alrayan',
    seo_description: 'Not all online Quran teachers are equal. Use our 7-point checklist — credentials, trial class, teaching style, schedule, and more — to find the right fit.',
    published_at:    '2026-05-01T08:00:00.000Z',
    reading_minutes: 6,
    categories:      [{ slug: 'tips-guides', title: 'Tips & Guides' }],
    author:          { name: 'Alrayan Academy' },
    body:            `<p>Finding the right Quran teacher online can feel overwhelming. A quick search returns hundreds of platforms, each claiming to have the "best" certified teachers. How do you know who is genuinely qualified — and who is right for you specifically?</p><p>After helping over 10,000 students find their teacher, we have identified the seven factors that matter most.</p><h2>1. Verified Ijazah or Equivalent Credential</h2><p>An Ijazah is the gold standard in Quranic education — an authenticated license with an unbroken chain of transmission going back to the Prophet ﷺ. Ask directly: "Do you hold an Ijazah? In which riwayah? Who granted it to you?" A reputable teacher will answer clearly.</p><h2>2. A Structured Trial Class</h2><p>The best way to evaluate a teacher is to have a full lesson with them. A genuine trial class should last at least 30 minutes, include actual teaching, and expose you to the teacher's correction style.</p><h2>3. Experience with Your Age Group or Level</h2><p>Teaching a 6-year-old and teaching a 40-year-old beginner require completely different skills. Ask specifically about their experience with your age group before committing.</p><h2>4. Real-Time Pronunciation Correction</h2><p>Tajweed cannot be learned passively. The teacher must listen to your recitation, identify errors, model the correct pronunciation, and have you repeat until it is correct — in the same session.</p><h2>5. Scheduling Compatibility</h2><p>Consistency is everything in Quran learning. Confirm available days and hours in your timezone before committing.</p><h2>6. Clear Communication and WhatsApp Support</h2><p>The best teacher relationships extend beyond the class with brief notes on what was covered and what to practice next.</p><h2>7. A No-Obligation Policy</h2><p>Any reputable teacher or academy should let you try before you commit financially. At Alrayan Academy, every trial class is free with zero obligation.</p>`,
  },
  {
    slug:            'complete-guide-tajweed-rules-beginners',
    title:           'The Complete Guide to Tajweed Rules for Beginners',
    excerpt:         'What Tajweed is, why it matters, the six key rule categories every beginner must know, and how to practice them daily — without feeling overwhelmed.',
    cover_image:     null,
    seo_title:       'Tajweed Rules for Beginners | Complete Guide | Alrayan Academy',
    seo_description: 'Learn the essential Tajweed rules — Madd, Noon Sakinah, Meem Sakinah, Qalqala, and more — explained clearly for beginners with practical examples.',
    published_at:    '2026-05-03T08:00:00.000Z',
    reading_minutes: 8,
    categories:      [{ slug: 'tajweed', title: 'Tajweed' }],
    author:          { name: 'Alrayan Academy' },
    body:            `<p>Tajweed (تجويد) means "to make something excellent." In the context of Quran recitation, Tajweed is the set of rules that govern how each letter of the Quran is pronounced — its articulation point, characteristics, and how it interacts with surrounding letters.</p><h2>Why Tajweed Matters</h2><p>Arabic is a language where a single letter or vowel can change the entire meaning of a word. Applying Tajweed correctly ensures the words of Allah are recited exactly as they were revealed.</p><h2>The Six Key Rule Categories</h2><h3>1. Makharij al-Huroof — Articulation Points</h3><p>Every Arabic letter has a specific point of origin in the mouth, throat, or nasal cavity. Mastering Makharij is the foundation of correct recitation.</p><h3>2. Madd — Elongation Rules</h3><p>Madd means elongating a vowel sound. Rules specify when to elongate 2, 4, or 6 beats depending on what follows the Madd letter.</p><h3>3. Noon Sakinah and Tanween Rules</h3><p>When noon has a sukoon or tanween, four rules apply: Izhar, Idghaam, Iqlab, and Ikhfaa — depending on the letter that follows.</p><h3>4. Meem Sakinah Rules</h3><p>Meem with sukoon follows three rules: Idghaam Shafawi, Ikhfaa Shafawi, and Izhar Shafawi.</p><h3>5. Qalqala — Echoing Sound</h3><p>Five letters produce a slight bouncing echo when they carry a sukoon: ق ط ب ج د.</p><h3>6. Tafkheem and Tarqeeq — Heavy and Light Letters</h3><p>Arabic letters are either naturally heavy or naturally light. Understanding this distinction prevents the most common errors for non-native speakers.</p><h2>How to Practice Without Feeling Overwhelmed</h2><p>Focus on one rule category at a time. Start with Makharij, then add Madd Tabee'i. Your teacher's live correction is irreplaceable — reading about rules is useful, but being corrected creates lasting change.</p>`,
  },
  {
    slug:            'online-quran-learning-effectiveness',
    title:           'Is Online Quran Learning as Effective as In-Person?',
    excerpt:         'Research, teacher experience, and 10,000+ student outcomes suggest online 1-on-1 classes can outperform group in-person tuition — here is why.',
    cover_image:     null,
    seo_title:       'Is Online Quran Learning Effective? | Research & Results | Alrayan',
    seo_description: 'Can you really learn the Quran online as effectively as in-person? We look at the research, real student outcomes, and what makes the difference.',
    published_at:    '2026-05-05T08:00:00.000Z',
    reading_minutes: 5,
    categories:      [{ slug: 'quran-learning', title: 'Quran Learning' }],
    author:          { name: 'Alrayan Academy' },
    body:            `<p>When online Quran learning first emerged, it was viewed with skepticism. The concern was reasonable: Tajweed requires live correction, and group mosque classes had worked for centuries.</p><h2>The Core Advantage: One Teacher, One Student</h2><p>In a traditional madrassa, one teacher manages 10 to 30 students. Each student receives perhaps 2–3 minutes of individual attention. In a 1-on-1 online class, every minute is focused on one student.</p><h2>Tajweed Correction Works the Same Online</h2><p>With a decent internet connection and headset, teachers can detect and correct Makhraj errors, Madd length, Ghunna strength, and Qalqala quality via video call just as effectively as in person.</p><h2>What the Research Shows</h2><p>Studies on online versus in-person language learning consistently show that 1-on-1 instruction is the key variable, not delivery format. The key variables are consistency, teacher quality, and individual attention.</p><h2>The Practical Advantages</h2><ul><li>No geographic constraint — access certified teachers anywhere</li><li>Schedule flexibility across all timezones</li><li>No commute — making consistency far more sustainable</li></ul><h2>Our Experience Across 10,000 Students</h2><p>Students complete their Noorani Qaida, Tajweed certification, and full Hifz entirely online. The medium is not the obstacle — teacher quality and student consistency are everything.</p>`,
  },
  {
    slug:            'noorani-qaida-vs-direct-quran-reading',
    title:           'Noorani Qaida vs. Direct Quran Reading: Which Comes First?',
    excerpt:         'Why most scholars recommend Noorani Qaida as the foundation, and the rare cases where a student can skip straight to direct Quran reading.',
    cover_image:     null,
    seo_title:       'Noorani Qaida vs. Direct Quran Reading | Which First? | Alrayan',
    seo_description: 'Should beginners start with Noorani Qaida or go straight to the Quran? We explain the difference, the benefits of each path, and which is right for your child.',
    published_at:    '2026-05-07T08:00:00.000Z',
    reading_minutes: 4,
    categories:      [{ slug: 'quran-learning', title: 'Quran Learning' }],
    author:          { name: 'Alrayan Academy' },
    body:            `<p>One of the most common questions from parents enrolling their children in Quran classes is: "Do they have to do Noorani Qaida, or can they start reading the Quran directly?"</p><h2>What is Noorani Qaida?</h2><p>Noorani Qaida is a structured primer for Arabic letters and pronunciation. It covers all 29 letters, vowel marks, Sukoon, Tanween, Shaddah, and Madd. Most students complete it in 2–4 months with 3 sessions per week.</p><h2>Why Noorani Qaida First?</h2><p>The Quran does not present letters and rules in isolated, progressive order — it presents complete verses that combine multiple rules simultaneously. Starting with Noorani Qaida is like teaching a child to crawl before they walk.</p><p>Students who skip the Qaida often develop pronunciation habits that are very difficult to correct later.</p><h2>When Can a Student Skip the Qaida?</h2><p>Some students genuinely do not need the full Qaida:</p><ul><li>Native Arabic speakers who already read fluently</li><li>Students who completed the Qaida elsewhere and are assessed as accurate</li><li>Older learners who can grasp multiple rules simultaneously</li></ul><h2>What We Recommend</h2><p>Every new student completes a brief level assessment in their first session. If they can already read Arabic letters clearly, we move directly to Quran reading. If not, we begin with Noorani Qaida at the student's natural pace.</p>`,
  },
  {
    slug:            'how-long-to-memorize-quran-hifz',
    title:           'How Long Does It Take to Memorize the Quran (Hifz)?',
    excerpt:         'Realistic timelines based on daily study hours, age, and prior Quran knowledge — from 1 year to 5 years, with the factors that make the biggest difference.',
    cover_image:     null,
    seo_title:       'How Long Does Hifz Take? | Quran Memorization Timeline | Alrayan',
    seo_description: 'How long does it really take to memorize the Quran? Realistic timelines for children, adults, and part-time students — with the factors that matter most.',
    published_at:    '2026-05-09T08:00:00.000Z',
    reading_minutes: 7,
    categories:      [{ slug: 'hifz-memorization', title: 'Hifz & Memorization' }],
    author:          { name: 'Alrayan Academy' },
    body:            `<p>The Quran contains 6,236 verses across 114 surahs and 30 Juz. Memorizing it completely is one of the most profound acts of Islamic devotion — and one of the most common questions we receive is: "How long will it take?"</p><h2>The Key Variables</h2><h3>1. Daily Time Commitment</h3><p>This is the single biggest factor:</p><ul><li>4+ hours/day: 1–2 years (full-time Hifz program)</li><li>2 hours/day: 2–3 years</li><li>1 hour/day: 3–5 years</li><li>30 minutes/day: 5–8 years</li></ul><h3>2. Age</h3><p>Children between 7 and 14 typically memorize faster than adults — this reflects how young brains encode information. Adults can and do complete Hifz; our oldest student was 67 years old.</p><h3>3. Prior Quran Knowledge</h3><p>A student with strong Tajweed who reads fluently will memorize much faster than one still developing reading fluency.</p><h3>4. Quality of Teacher and Method</h3><p>A good Hifz teacher balances new memorization with regular revision of previously learned portions. The three-tiered approach — new memorization, recent revision, older revision — is far more effective than memorization alone.</p><h2>Realistic Timelines for Part-Time Students</h2><ul><li>Children (8–14) with 45–60 min/day: 3–5 years</li><li>Teenagers with 60–90 min/day: 2–4 years</li><li>Adults with 30 min/day: 5–7 years</li><li>Adults with 60 min/day: 3–5 years</li></ul><h2>The Most Important Advice</h2><p>Do not begin Hifz by asking "how long will it take?" Begin by asking "am I ready to be consistent?" The students who finish are not the fastest learners — they are the most consistent ones.</p>`,
  },
]

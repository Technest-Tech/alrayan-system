import type { Locale } from '@/i18n/config'

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

export const faqCategoriesFr: string[] = [
  'Générale',
  'Cours',
  'Enseignants',
  'Tarifs',
  'Technique',
]

export const faqsFr: { id: string; q: string; a: string; category: string }[] = [
  // Générale
  {
    id: 'g1',
    category: 'Générale',
    q: "Qu'est-ce que Azhary ?",
    a: "Azhary est une académie en ligne d'enseignement du Coran et de l'arabe proposant des cours particuliers en direct avec des enseignants certifiés issus de l'université Al-Azhar et d'autres grandes institutions islamiques. Nous accompagnons des élèves dans plus de 50 pays, tous âges et tous niveaux confondus.",
  },
  {
    id: 'g2',
    category: 'Générale',
    q: 'Quels cours proposez-vous ?',
    a: "Nous proposons la Qaïda Nourania, la récitation du Coran pour enfants et adultes, le Tajwid, le Hifz (mémorisation), l'arabe pour non-arabophones, le Tafsir, les sciences islamiques, le programme Ijazah et les Dix Qiraat. Consultez notre page Cours pour tous les détails.",
  },
  {
    id: 'g3',
    category: 'Générale',
    q: 'Quels pays desservez-vous ?',
    a: "Nous accompagnons des élèves dans plus de 50 pays, notamment les États-Unis, le Royaume-Uni, le Canada, l'Australie, ainsi qu'en Europe, en Asie et en Afrique. Les cours ont lieu 7 jours sur 7 afin de couvrir tous les principaux fuseaux horaires.",
  },
  {
    id: 'g4',
    category: 'Générale',
    q: 'Proposez-vous des cours pour les enfants ?',
    a: "Oui. Nous avons des programmes dédiés aux enfants dès 5 ans. Nos enseignants sont formés pour capter l'attention des jeunes apprenants, et nous proposons des enseignantes pour les familles qui le préfèrent.",
  },
  // Cours
  {
    id: 'c1',
    category: 'Cours',
    q: "Comment se déroule un cours d'essai ?",
    a: "Remplissez le formulaire de contact et nous vous mettrons en relation avec un enseignant adapté à votre niveau, votre emploi du temps et vos préférences. Le premier cours est entièrement gratuit — aucune carte bancaire requise. À l'issue du cours, vous décidez si vous souhaitez continuer.",
  },
  {
    id: 'c2',
    category: 'Cours',
    q: 'Sur quelle plateforme les cours ont-ils lieu ?',
    a: "Les cours ont lieu via Zoom, Google Meet ou Skype — selon votre préférence. Nous vous envoyons le lien de la réunion avant chaque séance.",
  },
  {
    id: 'c3',
    category: 'Cours',
    q: 'Puis-je choisir mon emploi du temps ?',
    a: "Oui. Après avoir été mis en relation avec un enseignant, vous convenez d'un créneau récurrent qui convient aux deux emplois du temps. Les cours ont lieu 7 jours sur 7, y compris en soirée et le week-end.",
  },
  {
    id: 'c4',
    category: 'Cours',
    q: 'Que faire si je dois reporter un cours ?',
    a: "Nous proposons un report gratuit avec un préavis de 24 heures. Il vous suffit d'envoyer un message à votre enseignant ou à notre équipe administrative sur WhatsApp et nous vous proposerons un autre créneau.",
  },
  {
    id: 'c5',
    category: 'Cours',
    q: 'Les cours sont-ils enregistrés ?',
    a: "Les séances ne sont pas enregistrées par défaut afin de protéger la vie privée des élèves. Si vous souhaitez des enregistrements pour révision, veuillez en discuter avec votre enseignant et notre équipe administrative.",
  },
  // Enseignants
  {
    id: 't1',
    category: 'Enseignants',
    q: 'Vos enseignants sont-ils qualifiés ?',
    a: "Tous nos enseignants détiennent une Ijazah authentifiée — une chaîne certifiée de transmission du Coran remontant jusqu'au Prophète سلم — et sont diplômés de l'université Al-Azhar ou d'institutions islamiques accréditées équivalentes. Moins de 10 % des candidats réussissent notre processus de sélection.",
  },
  {
    id: 't2',
    category: 'Enseignants',
    q: 'Avez-vous des enseignantes ?',
    a: "Oui. Nous avons plusieurs enseignantes hautement qualifiées disponibles pour les élèves de sexe féminin ou pour les familles qui préfèrent une enseignante pour leurs enfants. Indiquez votre préférence lors de la réservation de votre essai.",
  },
  {
    id: 't3',
    category: 'Enseignants',
    q: 'Puis-je demander un enseignant en particulier ?',
    a: "Les abonnés aux formules Growth et Premium peuvent bénéficier d'une sélection prioritaire de l'enseignant. Les élèves de la formule Starter sont mis en relation en fonction de leur niveau et des disponibilités. Vous pouvez toujours demander un changement si la première mise en relation ne convient pas.",
  },
  {
    id: 't4',
    category: 'Enseignants',
    q: "Que faire si mon enfant n'accroche pas avec son enseignant ?",
    a: "La compatibilité avec l'enseignant est essentielle. Si votre enfant n'accroche pas avec son enseignant actuel, envoyez-nous un message sur WhatsApp et nous organiserons un changement gratuit vers un autre enseignant — sans aucune question.",
  },
  // Tarifs
  {
    id: 'p1',
    category: 'Tarifs',
    q: 'Combien coûtent les cours ?',
    a: "Les formules débutent à 30 $/mois pour 8 cours. Consultez notre page Tarifs pour le détail complet des formules Starter, Growth et Premium.",
  },
  {
    id: 'p2',
    category: 'Tarifs',
    q: "Y a-t-il un contrat ou une période d'engagement ?",
    a: "Non. Toutes les formules sont sans engagement, au mois. Vous pouvez passer à une formule supérieure ou inférieure, ou résilier à tout moment avant votre prochaine date de facturation.",
  },
  {
    id: 'p3',
    category: 'Tarifs',
    q: 'Proposez-vous des réductions pour les familles ?',
    a: "Oui. Les abonnés à la formule Premium bénéficient de 20 % de réduction pour chaque frère ou sœur supplémentaire inscrit. Contactez-nous après votre essai gratuit pour activer la réduction fratrie.",
  },
  {
    id: 'p4',
    category: 'Tarifs',
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: "Nous acceptons Visa, Mastercard, Amex et PayPal. Toutes les transactions sont effectuées en USD et traitées de manière sécurisée.",
  },
  // Technique
  {
    id: 'tech1',
    category: 'Technique',
    q: "De quoi ai-je besoin pour rejoindre un cours ?",
    a: "Un ordinateur, une tablette ou un smartphone doté d'une caméra et d'un microphone en état de marche, ainsi qu'une connexion Internet stable. Zoom, Google Meet ou Skype installé (gratuit). Aucun autre logiciel n'est requis.",
  },
  {
    id: 'tech2',
    category: 'Technique',
    q: 'Quelle vitesse de connexion me faut-il ?',
    a: "Un minimum de 2 Mbps en envoi et en réception suffit pour les cours en visioconférence. Nous recommandons 5 Mbps ou plus pour une expérience optimale.",
  },
  {
    id: 'tech3',
    category: 'Technique',
    q: "Puis-je rejoindre un cours depuis un téléphone ou une tablette ?",
    a: "Oui. Zoom, Meet et Skype disposent tous d'applications iOS et Android. De nombreux élèves se connectent depuis une tablette, dont l'écran est suffisamment grand pour lire le texte du Coran.",
  },
  {
    id: 'tech4',
    category: 'Technique',
    q: "Que faire en cas de problème technique pendant un cours ?",
    a: "Contactez votre enseignant ou notre ligne d'assistance WhatsApp. Si un cours est interrompu par un problème technique de notre côté, la séance n'est pas décomptée de votre quota mensuel.",
  },
]

export function getFaqCategories(locale: Locale): string[] {
  return locale === 'fr' ? faqCategoriesFr : (faqCategories as unknown as string[])
}

/** A FAQ entry whose `category` is a display string rather than the English-only union. */
export type LocalizedFaqItem = { id: string; q: string; a: string; category: string }

export function getFaqs(locale: Locale): LocalizedFaqItem[] {
  return locale === 'fr' ? faqsFr : (faqs as unknown as LocalizedFaqItem[])
}

export const faqPageContentFr: typeof faqPageContent = {
  hero: {
    eyebrow: 'Foire aux questions',
    heading: 'Tout ce que vous devez savoir',
    subheading: "Vous ne trouvez pas votre réponse ? Discutez avec nous sur WhatsApp — nous répondons en quelques minutes.",
  },
  cta: {
    heading: "Vous avez encore des questions ?",
    subheading: "Notre équipe est disponible sur WhatsApp 7 jours sur 7. Nous répondons généralement en moins de 10 minutes.",
    ctaPrimary: "Réserver un essai gratuit",
    ctaSecondary: 'Discuter sur WhatsApp',
  },
}

export function getFaqPageContent(locale: Locale) {
  return locale === 'fr' ? faqPageContentFr : faqPageContent
}

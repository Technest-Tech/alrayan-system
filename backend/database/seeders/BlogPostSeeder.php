<?php

namespace Database\Seeders;

use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Database\Seeder;

class BlogPostSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::first();

        $posts = [
            [
                'slug'            => 'how-to-choose-quran-teacher-online',
                'title'           => 'How to Choose a Quran Teacher Online: 7 Things to Look For',
                'excerpt'         => 'A practical checklist covering Ijazah credentials, teaching style, trial lessons, and scheduling flexibility — so you choose the right teacher from the start.',
                'category'        => 'tips-guides',
                'reading_minutes' => 6,
                'seo_title'       => 'How to Choose an Online Quran Teacher | 7-Point Checklist | Alrayan',
                'seo_description' => 'Not all online Quran teachers are equal. Use our 7-point checklist — credentials, trial class, teaching style, schedule, and more — to find the right fit.',
                'body'            => <<<'HTML'
<p>Finding the right Quran teacher online can feel overwhelming. A quick search returns hundreds of platforms, each claiming to have the "best" certified teachers. How do you know who is genuinely qualified — and who is right for you specifically?</p>

<p>After helping over 10,000 students find their teacher, we have identified the seven factors that matter most.</p>

<h2>1. Verified Ijazah or Equivalent Credential</h2>
<p>An Ijazah is the gold standard in Quranic education — an authenticated license with an unbroken chain of transmission going back to the Prophet ﷺ. When a teacher has an Ijazah, it means their Tajweed has been tested and certified by a qualified scholar who also holds a chain.</p>
<p>Ask directly: "Do you hold an Ijazah? In which riwayah? Who granted it to you?" A reputable teacher will answer clearly and provide documentation.</p>
<p>If a teacher claims Al-Azhar certification but cannot provide details, ask for clarification. Al-Azhar credentials are specific — a degree in Quranic Sciences is different from a general education degree.</p>

<h2>2. A Structured Trial Class (Not Just a "Demo")</h2>
<p>The best way to evaluate a teacher is to have a full lesson with them. A genuine trial class should:</p>
<ul>
<li>Last at least 30 minutes</li>
<li>Include actual teaching, not just introductions</li>
<li>Expose you or your child to the teacher's correction style</li>
<li>Give the teacher enough time to assess your current level</li>
</ul>
<p>Be cautious of platforms that offer only a 10-minute "call" — that is a sales call, not a trial lesson. At Alrayan Academy, every trial class is a full session with zero obligation.</p>

<h2>3. Experience with Your Specific Age Group or Level</h2>
<p>Teaching a 6-year-old and teaching a 40-year-old beginner require completely different skills. Ask specifically:</p>
<ul>
<li>"How many years have you taught children this age?"</li>
<li>"What is your approach to adult beginners who feel embarrassed?"</li>
<li>"Have you helped students who are starting completely from scratch?"</li>
</ul>
<p>A teacher who has only taught advanced students may not have the patience and methodology needed for a complete beginner — and vice versa.</p>

<h2>4. Real-Time Pronunciation Correction</h2>
<p>Tajweed cannot be learned passively. The teacher must listen to your recitation, identify errors, model the correct pronunciation, and have you repeat until it is correct — in the same session.</p>
<p>In a trial class, recite something you know (even Al-Fatiha) and pay attention: does the teacher correct specific errors with precision? Do they explain why the error occurs? Do they have you repeat until it is right? That is what real Tajweed teaching looks like.</p>

<h2>5. Scheduling Compatibility and Timezone Coverage</h2>
<p>Consistency is everything in Quran learning. A teacher who is difficult to schedule — or whose slots do not match your life — will lead to missed sessions and slow progress.</p>
<p>Before committing, confirm:</p>
<ul>
<li>Available days and hours in your timezone</li>
<li>What happens when you need to reschedule</li>
<li>Whether they have backup teachers if your assigned teacher is unavailable</li>
</ul>

<h2>6. Clear Communication and WhatsApp Support</h2>
<p>The best teacher relationships extend beyond the class. A good teacher will send brief WhatsApp notes after class — what was covered, what to practice, what to focus on next. This keeps parents informed and students accountable.</p>
<p>Ask: "Do you provide feedback between sessions? How do you communicate with parents?"</p>

<h2>7. A Refund or No-Obligation Policy</h2>
<p>Any reputable teacher or academy should let you try before you commit financially. If a platform asks for payment before a trial class, that is a red flag. A teacher who is confident in their teaching does not need to lock you in before you experience their class.</p>

<h2>Summary</h2>
<p>The right Quran teacher has verified credentials, a structured teaching approach, experience with your level, and a scheduling setup that works for your life. The trial class is your best evaluation tool — use it fully. At Alrayan Academy, every student receives a free, no-obligation first class with a certified teacher before making any commitment.</p>
HTML,
            ],
            [
                'slug'            => 'complete-guide-tajweed-rules-beginners',
                'title'           => 'The Complete Guide to Tajweed Rules for Beginners',
                'excerpt'         => 'What Tajweed is, why it matters, the six key rule categories every beginner must know, and how to practice them daily — without feeling overwhelmed.',
                'category'        => 'tajweed',
                'reading_minutes' => 8,
                'seo_title'       => 'Tajweed Rules for Beginners | Complete Guide | Alrayan Academy',
                'seo_description' => 'Learn the essential Tajweed rules — Madd, Noon Sakinah, Meem Sakinah, Qalqala, and more — explained clearly for beginners with practical examples.',
                'body'            => <<<'HTML'
<p>Tajweed (تجويد) means "to make something excellent." In the context of Quran recitation, Tajweed is the set of rules that govern how each letter of the Quran is pronounced — its articulation point, characteristics, and how it interacts with surrounding letters.</p>

<p>The Prophet ﷺ received the Quran with specific pronunciation, and the science of Tajweed preserves that pronunciation exactly as it was revealed. Reciting the Quran without Tajweed is permissible but considered deficient; reciting it with Tajweed is obligatory (wajib) according to the majority of scholars when reciting aloud.</p>

<h2>Why Tajweed Matters</h2>
<p>Arabic is a language where a single letter or vowel can change the entire meaning of a word. Applying Tajweed correctly is not just about beauty — it ensures the words of Allah are recited exactly as they were revealed, preserving meaning and reverence.</p>
<p>A common example: the letters ق (Qaf) and ك (Kaf) are often confused by non-native speakers. Mispronouncing them changes words entirely. Tajweed rules specify exactly where in the throat or mouth each letter originates.</p>

<h2>The Six Key Rule Categories</h2>

<h3>1. Makharij al-Huroof — Articulation Points</h3>
<p>Every Arabic letter has a specific point of origin in the mouth, throat, or nasal cavity. The letters are divided into five regions:</p>
<ul>
<li><strong>Al-Jawf</strong> (the open cavity) — the letters of natural Madd: Alif, Waw, Ya</li>
<li><strong>Al-Halq</strong> (the throat) — ء، ه، ع، ح، غ، خ</li>
<li><strong>Al-Lisaan</strong> (the tongue) — 18 letters, each with a specific tongue position</li>
<li><strong>Al-Shafataan</strong> (the lips) — ب، م، و، ف</li>
<li><strong>Al-Khayshoom</strong> (the nasal cavity) — the Ghunna sound in ن and م</li>
</ul>
<p>Mastering Makharij is the foundation. Without it, you cannot pronounce Arabic correctly regardless of how many other rules you know.</p>

<h3>2. Madd — Elongation Rules</h3>
<p>Madd means elongating a vowel sound. The basic unit of Madd is one "beat" (harakah). Rules specify when to elongate 2, 4, or 6 beats:</p>
<ul>
<li><strong>Madd Tabee'i</strong> (Natural Madd) — always 2 beats. Occurs when Alif follows Fatha, Waw follows Dhamma, or Ya follows Kasra, with no Hamzah or sukoon after it.</li>
<li><strong>Madd Muttasil</strong> (Joined Obligatory Madd) — 4–5 beats. Madd letter followed by Hamzah in the same word.</li>
<li><strong>Madd Munfasil</strong> (Separated Madd) — 4–5 beats. Madd letter at end of one word followed by Hamzah at start of the next.</li>
<li><strong>Madd Aarid lil Sukoon</strong> — 2, 4, or 6 beats. Natural Madd followed by a letter with sukoon that occurs only when stopping at that word.</li>
</ul>

<h3>3. Noon Sakinah and Tanween Rules</h3>
<p>When noon (ن) has a sukoon (rest mark) or tanween (double vowel), four rules apply depending on the letter that follows:</p>
<ul>
<li><strong>Izhar</strong> (Clear) — pronounce the noon clearly before throat letters (ء ه ع ح غ خ)</li>
<li><strong>Idghaam</strong> (Merge) — merge the noon into the following letter (ي ر م ل و ن). With Ghunna for most, without for ر and ل.</li>
<li><strong>Iqlab</strong> (Convert) — change the noon to a meem sound before ب, with Ghunna</li>
<li><strong>Ikhfaa</strong> (Conceal) — partially pronounce the noon with Ghunna before the remaining 15 letters</li>
</ul>

<h3>4. Meem Sakinah Rules</h3>
<p>Meem with sukoon has three rules:</p>
<ul>
<li><strong>Idghaam Shafawi</strong> — merge meem into following meem, with Ghunna</li>
<li><strong>Ikhfaa Shafawi</strong> — conceal meem before ب, with Ghunna</li>
<li><strong>Izhar Shafawi</strong> — pronounce meem clearly before all other letters</li>
</ul>

<h3>5. Qalqala — Echoing Sound</h3>
<p>Five letters produce a slight bouncing "echo" sound when they carry a sukoon: ق ط ب ج د (remembered as قطب جد).</p>
<p>Qalqala is minor when the letter is in the middle of a word, and stronger when stopping at a word ending in a Qalqala letter. The echo must be audible but controlled.</p>

<h3>6. Tafkheem and Tarqeeq — Heavy and Light Letters</h3>
<p>Arabic letters are either naturally heavy (pronounced with a full mouth, back of the throat raised — like خ، غ، ص، ض، ط، ظ، ق) or naturally light. Understanding this distinction prevents the most common errors in Arabic pronunciation for non-native speakers.</p>
<p>Special attention: the letter ر (Ra) can be either heavy or light depending on context — mastering Ra is one of the more challenging and rewarding elements of Tajweed study.</p>

<h2>How to Practice Daily Without Feeling Overwhelmed</h2>
<p>The biggest mistake beginners make is trying to apply all rules at once. Here is a practical approach:</p>
<ol>
<li><strong>Week 1–2:</strong> Focus entirely on Makharij. Record yourself and compare with your teacher.</li>
<li><strong>Week 3–4:</strong> Add Madd Tabee'i. It appears in almost every verse — you will practice it constantly.</li>
<li><strong>Month 2:</strong> Add Noon Sakinah rules — Izhar and Idghaam first, then Iqlab and Ikhfaa.</li>
<li><strong>Month 3:</strong> Add Meem Sakinah and Qalqala — both are straightforward once you have the foundation.</li>
<li><strong>Month 4+:</strong> Advanced Madd types, Tafkheem/Tarqeeq nuances, and Waqf rules.</li>
</ol>
<p>Your teacher's live correction is irreplaceable. Reading about Tajweed rules is useful — hearing and being corrected is what creates lasting change.</p>
HTML,
            ],
            [
                'slug'            => 'online-quran-learning-effectiveness',
                'title'           => 'Is Online Quran Learning as Effective as In-Person?',
                'excerpt'         => 'Research, teacher experience, and 10,000+ student outcomes suggest online 1-on-1 classes can outperform group in-person tuition — here is why.',
                'category'        => 'quran-learning',
                'reading_minutes' => 5,
                'seo_title'       => 'Is Online Quran Learning Effective? | Research & Results | Alrayan',
                'seo_description' => 'Can you really learn the Quran online as effectively as in-person? We look at the research, real student outcomes, and what makes the difference.',
                'body'            => <<<'HTML'
<p>When online Quran learning first emerged, it was viewed with skepticism by many scholars and parents. The concern was reasonable: Tajweed requires live correction, and group mosque classes had worked for centuries. What could a video call offer that an in-person class could not?</p>

<p>Ten years and over 10,000 students later, the answer has become clear. Not only is online 1-on-1 Quran learning effective — in specific and important ways, it outperforms traditional group classes.</p>

<h2>The Core Advantage: One Teacher, One Student</h2>
<p>In a traditional madrassa or mosque class, one teacher manages 10 to 30 students. Each student receives perhaps 2–3 minutes of individual attention per session. The rest of the time is spent listening — or waiting.</p>
<p>In a 1-on-1 online class, every minute of the session is focused on one student. The teacher listens to every word of their recitation, corrects every error, and adjusts the lesson based on that specific student's needs in real time.</p>
<p>The outcome difference compounds over months. A student receiving 30 minutes of focused individual instruction three times per week consistently outperforms a student in a weekly group class — even if the group class lasts two hours.</p>

<h2>Tajweed Correction Works the Same Online</h2>
<p>The most common skepticism is about Tajweed — the science of pronunciation. Critics ask: can a teacher really hear and correct pronunciation errors through a screen?</p>
<p>With a decent internet connection and headset, the answer is unambiguously yes. Our teachers report the same ability to detect and correct Makhraj errors, Madd length, Ghunna strength, and Qalqala quality via video call as they would in person. Many teachers prefer it, noting they can ask the student to repeat individual words and phrases with zero awkwardness — something that is harder to do in a physical classroom setting.</p>

<h2>What the Research Shows</h2>
<p>Studies on online versus in-person language learning (which Quran recitation closely resembles — it requires auditory discrimination, phonemic training, and live feedback) consistently show that 1-on-1 instruction is the key variable, not delivery format. A 2020 meta-analysis of online tutoring programs found no statistically significant difference in outcomes between online and in-person 1-on-1 tutoring across language and skills-based subjects.</p>
<p>The key variables are consistency, teacher quality, and individual attention — not the medium of delivery.</p>

<h2>The Practical Advantages of Online Learning</h2>
<p>Beyond effectiveness, online Quran learning has concrete practical advantages:</p>
<ul>
<li><strong>No geographic constraint:</strong> Students access certified Al-Azhar teachers regardless of where they live. This is transformative for Muslims in countries with limited access to qualified Quran teachers.</li>
<li><strong>Schedule flexibility:</strong> Classes can be booked at any time of day, across all timezones. A parent in Vancouver can schedule a pre-school morning class that aligns with the teacher's afternoon in Cairo.</li>
<li><strong>No commute:</strong> For families, eliminating the drive to and from a madrassa makes consistency far more sustainable.</li>
<li><strong>Recorded sessions:</strong> Many online classes can be recorded for student review — a luxury rarely available in a physical classroom.</li>
</ul>

<h2>When In-Person Learning is Better</h2>
<p>Online learning is not the right choice in every context. Very young children (under 5) often struggle with the screen-based format and benefit more from in-person interaction. Students who need heavy tactile or social learning — some children with certain learning differences — may also prefer physical classroom settings.</p>
<p>For most students aged 5 and above, online 1-on-1 learning is as effective as in-person, and often more so due to the individual attention and scheduling flexibility it enables.</p>

<h2>Our Experience Across 10,000 Students</h2>
<p>At Alrayan Academy, we have watched students complete their Noorani Qaida, finish their Tajweed certification, and complete full Hifz — all entirely online. We have students who were told by local teachers that they "could not be taught" who have thrived in our 1-on-1 format. We have adults who started from zero in their 40s and now recite Surah Al-Baqarah with confidence.</p>
<p>The medium is not the obstacle. The quality of the teacher and the consistency of the student are everything.</p>
HTML,
            ],
            [
                'slug'            => 'noorani-qaida-vs-direct-quran-reading',
                'title'           => 'Noorani Qaida vs. Direct Quran Reading: Which Comes First?',
                'excerpt'         => 'Why most scholars recommend Noorani Qaida as the foundation, and the rare cases where a student can skip straight to direct Quran reading.',
                'category'        => 'quran-learning',
                'reading_minutes' => 4,
                'seo_title'       => 'Noorani Qaida vs. Direct Quran Reading | Which First? | Alrayan',
                'seo_description' => 'Should beginners start with Noorani Qaida or go straight to the Quran? We explain the difference, the benefits of each path, and which is right for your child.',
                'body'            => <<<'HTML'
<p>One of the most common questions from parents enrolling their children in Quran classes is: "Do they have to do Noorani Qaida, or can they start reading the Quran directly?" It is a fair question, especially for parents whose children are eager to "get to the real thing."</p>

<p>The short answer: Noorani Qaida almost always comes first, and there are strong reasons why.</p>

<h2>What is Noorani Qaida?</h2>
<p>Noorani Qaida is a structured primer for Arabic letters and pronunciation, developed by Molvi Noor Mohammad Ludhianvi. It is used worldwide as the entry point to Arabic literacy and Quran recitation. The Qaida covers:</p>
<ul>
<li>All 29 Arabic letters in isolation</li>
<li>Letter forms — initial, medial, and final</li>
<li>Short vowels (Fatha, Kasra, Dhamma) and Sukoon</li>
<li>Tanween, Shaddah, and Madd</li>
<li>Joining letters into words and reading real Quranic words</li>
</ul>
<p>The entire Qaida takes most students 2–4 months with 3 sessions per week.</p>

<h2>Why Noorani Qaida First?</h2>
<p>The Quran does not contain all the vowel marks (Tashkeel) in isolated, progressive order — it presents complete verses that combine multiple rules simultaneously. A student without foundational training will encounter rules they have never seen, letters they cannot distinguish, and pronunciation patterns they have not practiced.</p>
<p>Starting with Noorani Qaida is like teaching a child to crawl before they walk. The Qaida isolates each element, builds it correctly, and then combines them progressively. By the time the student opens the Quran, they have already encountered almost every letter combination they will see.</p>
<p>Students who skip the Qaida and start directly from the Quran often develop pronunciation habits that are very difficult to correct later. They learn to "read" words without understanding why they pronounce them a certain way — and when they encounter an unfamiliar word, they cannot decode it correctly.</p>

<h2>When Can a Student Skip the Qaida?</h2>
<p>Some students genuinely do not need to complete the full Noorani Qaida before moving to the Quran. This is typically the case when:</p>
<ul>
<li>The student already reads Arabic fluently (for example, native Arabic speakers, or students who have completed Arabic language education)</li>
<li>The student has already completed the Qaida with another teacher and their reading is assessed as accurate</li>
<li>An older student (teenager or adult) who learns quickly and can grasp multiple rules simultaneously</li>
</ul>
<p>In these cases, a competent teacher will assess the student's level in the first session and may begin Quran reading directly, introducing relevant rules as they arise. This is a judgment call that should be made by the teacher after proper assessment — not assumed in advance.</p>

<h2>What We Recommend</h2>
<p>Our standard approach:</p>
<ol>
<li>Every new student, regardless of age, completes a brief level assessment in their first session.</li>
<li>If the student can already read Arabic letters clearly and apply basic vowel rules, we move directly to Quran reading.</li>
<li>If not — for the vast majority of beginners — we begin with Noorani Qaida and move through it at the student's natural pace.</li>
</ol>
<p>Children aged 5–9 almost always benefit from completing the full Qaida before transitioning to Quran. Adults who are motivated and already have some Arabic exposure may progress faster.</p>
<p>The goal is never to rush the foundation — it is to build it so solidly that every step after it becomes easier.</p>
HTML,
            ],
            [
                'slug'            => 'how-long-to-memorize-quran-hifz',
                'title'           => 'How Long Does It Take to Memorize the Quran (Hifz)?',
                'excerpt'         => 'Realistic timelines based on daily study hours, age, and prior Quran knowledge — from 1 year to 5 years, with the factors that make the biggest difference.',
                'category'        => 'hifz-memorization',
                'reading_minutes' => 7,
                'seo_title'       => 'How Long Does Hifz Take? | Quran Memorization Timeline | Alrayan',
                'seo_description' => 'How long does it really take to memorize the Quran? Realistic timelines for children, adults, and part-time students — with the factors that matter most.',
                'body'            => <<<'HTML'
<p>The Quran contains 6,236 verses across 114 surahs and 30 Juz. Memorizing it completely is one of the most profound and demanding acts of Islamic devotion — and one of the most common questions we receive is: "How long will it take?"</p>

<p>The honest answer: it depends heavily on several factors. But we can give you realistic ranges based on experience with hundreds of students.</p>

<h2>The Key Variables</h2>

<h3>1. Daily Time Commitment</h3>
<p>This is the single biggest factor. A student who memorizes for 4–6 hours daily (typical in a full-time Hifz school) will complete the Quran in 1–2 years. A part-time student studying 30–60 minutes per day should expect 4–6 years.</p>
<p>Here is a rough framework:</p>
<ul>
<li><strong>4+ hours/day:</strong> 1–2 years (full-time Hifz program)</li>
<li><strong>2 hours/day:</strong> 2–3 years</li>
<li><strong>1 hour/day:</strong> 3–5 years</li>
<li><strong>30 minutes/day:</strong> 5–8 years</li>
</ul>
<p>These ranges assume consistent, focused daily practice — not casual reading.</p>

<h3>2. Age</h3>
<p>Children between 7 and 14 typically memorize faster than adults. This is not a limitation of intelligence — it reflects how young brains encode and retain new information, particularly language and sound patterns. Children who begin Hifz at age 8–10 and study consistently often complete it by age 14–16.</p>
<p>Adults can and do complete Hifz. Our oldest student to complete full memorization was 67 years old. Adults typically take longer but show stronger conscious retention techniques — they understand what they are memorizing in a way that often helps long-term recall.</p>

<h3>3. Prior Quran Knowledge</h3>
<p>A student with strong Tajweed who can read the Quran fluently will memorize much faster than a student who is still developing their reading fluency. If you cannot yet read the Quran smoothly, the reading itself is slowing the memorization process. Solidifying reading fluency first saves time overall.</p>

<h3>4. Quality of the Teacher and Method</h3>
<p>A good Hifz teacher does not just assign daily portions — they design a systematic revision schedule that balances new memorization with regular review of previously learned portions. The most common mistake in independent Hifz is memorizing forward without adequate revision, leading to the forgetting of earlier portions by the time the end is reached.</p>
<p>The three-tiered revision approach used by experienced Hifz teachers — new memorization, recent revision (last 7 days), and older revision (full Juz cycle) — is far more effective than memorization-only methods.</p>

<h3>5. Consistency Over Speed</h3>
<p>Consistency matters far more than daily volume. A student who memorizes half a page every day without missing a single day will progress further and retain better than a student who memorizes 2 pages some days and nothing for a week. Hifz rewards discipline above all other traits.</p>

<h2>Realistic Timelines for Part-Time Students</h2>
<p>Most of our students — adults with jobs and families, children with school and activities — fall into the part-time category. Here is what we see in practice:</p>
<ul>
<li><strong>Children (8–14) with 45–60 min/day, 5–6 days/week:</strong> 3–5 years to complete Hifz</li>
<li><strong>Teenagers (14–18) with 60–90 min/day:</strong> 2–4 years</li>
<li><strong>Adults with 30 min/day dedicated Hifz session:</strong> 5–7 years</li>
<li><strong>Adults with 60 min/day dedicated Hifz session:</strong> 3–5 years</li>
</ul>

<h2>What If I Have Already Memorized Some?</h2>
<p>Many students come to us having memorized Juz Amma (the 30th Juz) or other individual surahs on their own. If you have already memorized portions — even if your Tajweed needs work — you have a significant head start. We assess each student, strengthen what they have, and continue from there. Time to completion is adjusted accordingly.</p>

<h2>The Most Important Advice</h2>
<p>Do not begin Hifz by asking "how long will it take?" Begin by asking "am I ready to be consistent?" The students who finish Hifz are not necessarily the fastest learners — they are the most consistent ones.</p>
<p>A student who memorizes half a page per day, every day, for three years, will finish the Quran. A student who memorizes 2 pages when motivated but skips weeks when busy will still be in Juz 10 three years later.</p>
<p>Choose your pace honestly, commit to it, and find a teacher and structure that supports your consistency. That is what actually determines how long it takes.</p>
HTML,
            ],
        ];

        foreach ($posts as $postData) {
            $categorySlug = $postData['category'];
            unset($postData['category']);

            $postData['status']      = 'published';
            $postData['published_at'] = now();
            $postData['author_id']   = $author->id;
            $postData['cover_image'] = null;

            $post = BlogPost::updateOrCreate(['slug' => $postData['slug']], $postData);

            $category = BlogCategory::where('slug', $categorySlug)->first();
            if ($category) {
                $post->categories()->syncWithoutDetaching([$category->id]);
            }
        }
    }
}

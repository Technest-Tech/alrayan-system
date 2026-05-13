<?php

namespace Database\Seeders;

use App\Models\Teacher;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = [
            [
                'name'             => 'Sheikh Ibrahim Al-Rashid',
                'name_arabic'      => 'الشيخ إبراهيم الراشد',
                'role'             => 'Head of Quran Studies',
                'specialties'      => ['Tajweed', 'Hifz', 'Ijazah', 'Ten Qiraat'],
                'languages'        => ['Arabic', 'English'],
                'credentials'      => 'Al-Azhar University — Bachelor & Master in Quranic Sciences. Ijazah in Hafs an Asim and all ten Qiraat.',
                'bio'              => 'Sheikh Ibrahim has dedicated over 15 years to teaching the Quran internationally. A graduate of Al-Azhar with a direct chain of transmission, he has guided hundreds of students to full Hifz and Ijazah certification.',
                'is_female'        => false,
                'years_experience' => 15,
                'students_count'   => 420,
                'featured'         => true,
                'sort_order'       => 1,
            ],
            [
                'name'             => 'Sister Aisha Karimi',
                'name_arabic'      => 'الأستاذة عائشة كريمي',
                'role'             => 'Senior Female Quran Teacher',
                'specialties'      => ['Quran for Kids', 'Tajweed', 'Noorani Qaida', 'Hifz'],
                'languages'        => ['Arabic', 'English', 'Urdu'],
                'credentials'      => 'Islamic University of Madinah — Quranic Studies. Ijazah in Hafs an Asim. 12+ years teaching.',
                'bio'              => 'Sister Aisha is beloved by students and families across the UK, USA, and Canada. Her patient, structured approach makes her the top choice for beginners and children. She holds Ijazah and is certified to grant Ijazah to her students.',
                'is_female'        => true,
                'years_experience' => 12,
                'students_count'   => 380,
                'featured'         => true,
                'sort_order'       => 2,
            ],
            [
                'name'             => 'Sheikh Omar Al-Hassan',
                'name_arabic'      => 'الشيخ عمر الحسن',
                'role'             => 'Ijazah Program Director',
                'specialties'      => ['Ijazah', 'Ten Qiraat', 'Tajweed', 'Tafseer'],
                'languages'        => ['Arabic', 'English', 'French'],
                'credentials'      => 'Al-Azhar University — PhD in Islamic Studies. Ijazah in all ten Qiraat with Mutawatir chain.',
                'bio'              => 'Dr. Omar leads our rigorous Ijazah program, ensuring every student receives an authentic, unbroken chain back to the Prophet. He has granted Ijazah to over 60 students worldwide and teaches advanced Qiraat.',
                'is_female'        => false,
                'years_experience' => 18,
                'students_count'   => 210,
                'featured'         => true,
                'sort_order'       => 3,
            ],
            [
                'name'             => 'Sister Fatima Benali',
                'name_arabic'      => 'الأستاذة فاطمة بنعلي',
                'role'             => 'Arabic Language Specialist',
                'specialties'      => ['Arabic for Non-Arabs', 'Quranic Arabic', 'Islamic Studies'],
                'languages'        => ['Arabic', 'English', 'French'],
                'credentials'      => 'University of Cairo — BA Arabic Literature. Al-Azhar certified teacher. 10 years teaching Arabic online.',
                'bio'              => 'Sister Fatima makes Arabic accessible to complete beginners. Her structured curriculum takes students from the alphabet to conversational Arabic. She also teaches Quranic grammar to help students understand the Quran directly.',
                'is_female'        => true,
                'years_experience' => 10,
                'students_count'   => 290,
                'featured'         => true,
                'sort_order'       => 4,
            ],
            [
                'name'             => 'Sheikh Yusuf Al-Ansari',
                'name_arabic'      => 'الشيخ يوسف الأنصاري',
                'role'             => 'Quran & Islamic Studies Teacher',
                'specialties'      => ['Tafseer', 'Islamic Studies', 'Seerah', 'Aqeedah'],
                'languages'        => ['Arabic', 'English'],
                'credentials'      => 'Al-Azhar University — BA Islamic Studies. Specialist in Tafseer and Aqeedah. 8 years teaching.',
                'bio'              => 'Sheikh Yusuf brings the Quran to life through deep Tafseer study. His classes help students not just recite, but understand the wisdom and guidance behind each verse. Students describe his lessons as transformative.',
                'is_female'        => false,
                'years_experience' => 8,
                'students_count'   => 175,
                'featured'         => false,
                'sort_order'       => 5,
            ],
            [
                'name'             => 'Sister Maryam Saleh',
                'name_arabic'      => 'الأستاذة مريم صالح',
                'role'             => "Children's Quran Specialist",
                'specialties'      => ['Quran for Kids', 'Noorani Qaida', 'Tajweed', 'Islamic Studies for Kids'],
                'languages'        => ['Arabic', 'English', 'Turkish'],
                'credentials'      => 'Islamic Educational Institute — Quran & Pedagogy. Certified child learning specialist. 9 years experience.',
                'bio'              => 'Sister Maryam has a gift for teaching children. Her playful, encouraging style makes even reluctant learners eager for their next class. She specializes in ages 5–14 and has helped hundreds of children complete their Noorani Qaida and begin Tajweed.',
                'is_female'        => true,
                'years_experience' => 9,
                'students_count'   => 330,
                'featured'         => false,
                'sort_order'       => 6,
            ],
            [
                'name'             => 'Sheikh Khalid Mansour',
                'name_arabic'      => 'الشيخ خالد منصور',
                'role'             => 'Hifz Program Coordinator',
                'specialties'      => ['Hifz / Memorization', 'Tajweed', 'Revision Techniques'],
                'languages'        => ['Arabic', 'English'],
                'credentials'      => 'Al-Azhar University — Hifz certification with full chain. Specialized in memorization methodology. 14 years.',
                'bio'              => 'Sheikh Khalid has helped over 200 students complete their full Hifz of the Quran. His systematic approach to memorization — breaking, reviewing, and cementing — produces lasting results. His oldest student to complete Hifz was 67 years old.',
                'is_female'        => false,
                'years_experience' => 14,
                'students_count'   => 260,
                'featured'         => false,
                'sort_order'       => 7,
            ],
            [
                'name'             => 'Sister Nour Al-Deen',
                'name_arabic'      => 'الأستاذة نور الدين',
                'role'             => 'Adult Quran & Tajweed Teacher',
                'specialties'      => ['Tajweed', 'Quran for Adults', 'Arabic', 'Hifz'],
                'languages'        => ['Arabic', 'English', 'German'],
                'credentials'      => 'Umm Al-Qura University — Quranic Recitation & Tajweed. Ijazah in Hafs an Asim. 7 years teaching adults.',
                'bio'              => 'Sister Nour specializes in helping adults — especially those who grew up without Quran education — start or restart their journey with confidence. Her non-judgmental, structured approach has earned her exceptional reviews from students across Europe and North America.',
                'is_female'        => true,
                'years_experience' => 7,
                'students_count'   => 195,
                'featured'         => false,
                'sort_order'       => 8,
            ],
        ];

        foreach ($teachers as $data) {
            Teacher::updateOrCreate(['name' => $data['name']], $data);
        }
    }
}

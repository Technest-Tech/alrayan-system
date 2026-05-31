<?php

namespace Database\Seeders\System;

use App\Models\Course;
use App\Models\System\Lead;
use App\Models\User;
use Illuminate\Database\Seeder;

class LeadSeeder extends Seeder
{
    private const LEADS = [
        /* ── new_lead ────────────────────────────────────── */
        ['name' => 'Fatima Al-Zahra Benali',    'phone' => '+213661234501', 'email' => 'fatima.benali@gmail.com',      'status' => 'new_lead',            'country' => 'DZ', 'city' => 'Algiers',     'source' => 'google_ads',       'platform' => 'instagram', 'priority' => 'high'],
        ['name' => 'Omar Hassan Al-Rashid',      'phone' => '+966501234502', 'email' => 'omar.rashid@hotmail.com',      'status' => 'new_lead',            'country' => 'SA', 'city' => 'Riyadh',      'source' => 'facebook_ads',     'platform' => 'facebook',  'priority' => 'medium'],
        ['name' => 'Amina Khoury',               'phone' => '+33612345003',  'email' => 'amina.khoury@outlook.fr',      'status' => 'new_lead',            'country' => 'FR', 'city' => 'Paris',       'source' => 'instagram_ads',    'platform' => 'instagram', 'priority' => 'medium'],
        ['name' => 'Yusuf Ibrahim Diallo',       'phone' => '+44712345004',  'email' => 'yusuf.diallo@gmail.com',       'status' => 'new_lead',            'country' => 'GB', 'city' => 'London',      'source' => 'student_referral', 'platform' => 'whatsapp',  'priority' => 'low'],
        ['name' => 'Nour El-Din Mansour',        'phone' => '+201012345005', 'email' => 'nourelden@yahoo.com',          'status' => 'new_lead',            'country' => 'EG', 'city' => 'Cairo',       'source' => 'manual_entry',     'platform' => 'other',     'priority' => 'low'],

        /* ── interested ──────────────────────────────────── */
        ['name' => 'Khadija Osman Al-Sheikh',   'phone' => '+971501234506', 'email' => 'khadija.osman@gmail.com',      'status' => 'interested',          'country' => 'AE', 'city' => 'Dubai',       'source' => 'google_ads',       'platform' => 'youtube',   'priority' => 'high',   'package_hours' => 8,  'subscription_price' => 120, 'currency' => 'AED'],
        ['name' => 'Bilal Mohamad Sarhan',       'phone' => '+905321234507', 'email' => 'bilal.sarhan@gmail.com',       'status' => 'interested',          'country' => 'TR', 'city' => 'Istanbul',    'source' => 'whatsapp_direct',  'platform' => 'whatsapp',  'priority' => 'high'],
        ['name' => 'Zaynab Tahir Hussain',       'phone' => '+14161234508',  'email' => 'zaynab.hussain@gmail.com',     'status' => 'interested',          'country' => 'CA', 'city' => 'Toronto',     'source' => 'facebook_ads',     'platform' => 'facebook',  'priority' => 'medium', 'package_hours' => 4],
        ['name' => 'Mustafa Al-Amin Karar',      'phone' => '+4917612345009','email' => 'mustafa.karar@web.de',         'status' => 'interested',          'country' => 'DE', 'city' => 'Berlin',      'source' => 'website_form',     'platform' => 'website',   'priority' => 'medium'],
        ['name' => 'Rahma Boulahia',             'phone' => '+21261234510',  'email' => 'rahma.boulahia@gmail.com',     'status' => 'interested',          'country' => 'MA', 'city' => 'Casablanca',  'source' => 'instagram_ads',    'platform' => 'instagram', 'priority' => 'low'],

        /* ── waiting_for_trial ───────────────────────────── */
        ['name' => 'Abdullah Nasser Al-Okaili', 'phone' => '+966551234511', 'email' => 'abdullah.okaili@gmail.com',    'status' => 'waiting_for_trial',   'country' => 'SA', 'city' => 'Jeddah',      'source' => 'google_ads',       'platform' => 'youtube',   'priority' => 'high',   'package_hours' => 12, 'subscription_price' => 180, 'currency' => 'SAR'],
        ['name' => 'Hafsah Mahmoud Othman',     'phone' => '+201112345012', 'email' => 'hafsah.othman@gmail.com',      'status' => 'waiting_for_trial',   'country' => 'EG', 'city' => 'Alexandria',  'source' => 'facebook_ads',     'platform' => 'facebook',  'priority' => 'medium'],
        ['name' => 'Ibrahim Al-Farsi',           'phone' => '+97451234513',  'email' => 'ibrahim.alfarsi@gmail.com',    'status' => 'waiting_for_trial',   'country' => 'QA', 'city' => 'Doha',        'source' => 'student_referral', 'platform' => 'whatsapp',  'priority' => 'high',   'package_hours' => 8,  'subscription_price' => 350, 'currency' => 'QAR'],
        ['name' => 'Mariam Chaudhry',            'phone' => '+447123450014', 'email' => 'mariam.chaudhry@gmail.com',   'status' => 'waiting_for_trial',   'country' => 'GB', 'city' => 'Manchester',  'source' => 'instagram_ads',    'platform' => 'instagram', 'priority' => 'medium'],
        ['name' => 'Saad El-Badawi Taha',        'phone' => '+21212345015',  'email' => 'saad.taha@hotmail.com',        'status' => 'waiting_for_trial',   'country' => 'MA', 'city' => 'Rabat',       'source' => 'whatsapp_direct',  'platform' => 'tiktok',    'priority' => 'low'],

        /* ── waiting_for_payment ─────────────────────────── */
        ['name' => 'Aisha Abdallah Al-Balushi', 'phone' => '+96812345016',  'email' => 'aisha.balushi@gmail.com',      'status' => 'waiting_for_payment', 'country' => 'OM', 'city' => 'Muscat',      'source' => 'google_ads',       'platform' => 'website',   'priority' => 'high',   'package_hours' => 12, 'subscription_price' => 150, 'currency' => 'OMR', 'payment_method' => 'bank_transfer'],
        ['name' => 'Tariq Nabil Saeed',          'phone' => '+96512345017',  'email' => 'tariq.saeed@hotmail.com',      'status' => 'waiting_for_payment', 'country' => 'KW', 'city' => 'Kuwait City', 'source' => 'facebook_ads',     'platform' => 'facebook',  'priority' => 'high',   'package_hours' => 8,  'subscription_price' => 90,  'currency' => 'USD', 'payment_method' => 'card'],
        ['name' => 'Halima Diallo Ba',           'phone' => '+221761234518', 'email' => 'halima.ba@gmail.com',          'status' => 'waiting_for_payment', 'country' => 'SN', 'city' => 'Dakar',       'source' => 'student_referral', 'platform' => 'whatsapp',  'priority' => 'medium',                                'subscription_price' => 60,  'currency' => 'EUR', 'payment_method' => 'card'],
        ['name' => 'Hassan Berkouk',             'phone' => '+33781234519',  'email' => 'hassan.berkouk@gmail.com',     'status' => 'waiting_for_payment', 'country' => 'FR', 'city' => 'Lyon',        'source' => 'website_form',     'platform' => 'website',   'priority' => 'medium', 'package_hours' => 4,  'subscription_price' => 80,  'currency' => 'EUR'],
        ['name' => 'Ruqayyah Abdulaziz',         'phone' => '+14081234520',  'email' => 'ruqayyah.abdulaziz@gmail.com','status' => 'waiting_for_payment', 'country' => 'US', 'city' => 'Houston',     'source' => 'google_ads',       'platform' => 'youtube',   'priority' => 'low',                                   'subscription_price' => 120, 'currency' => 'USD'],

        /* ── closed ──────────────────────────────────────── */
        ['name' => 'Zaid Al-Tamimi',             'phone' => '+971501234521', 'email' => 'zaid.altamimi@gmail.com',      'status' => 'closed',              'country' => 'AE', 'city' => 'Abu Dhabi',   'source' => 'google_ads',       'platform' => 'youtube',   'priority' => 'high',   'package_hours' => 12, 'subscription_price' => 600, 'currency' => 'AED', 'payment_method' => 'bank_transfer'],
        ['name' => 'Sumayya Hassan Warsame',     'phone' => '+46712345022',  'email' => 'sumayya.warsame@gmail.com',    'status' => 'closed',              'country' => 'SE', 'city' => 'Stockholm',   'source' => 'student_referral', 'platform' => 'facebook',  'priority' => 'medium', 'package_hours' => 8,  'subscription_price' => 120, 'currency' => 'GBP', 'payment_method' => 'card'],
        ['name' => 'Khaled El-Sayed Ibrahim',   'phone' => '+201234560023', 'email' => 'khaled.ibrahim@gmail.com',     'status' => 'closed',              'country' => 'EG', 'city' => 'Cairo',       'source' => 'facebook_ads',     'platform' => 'facebook',  'priority' => 'medium', 'package_hours' => 4,  'subscription_price' => 250, 'currency' => 'SAR', 'payment_method' => 'card'],
        ['name' => 'Maryam Boukhari',            'phone' => '+31612345024',  'email' => 'maryam.boukhari@gmail.com',    'status' => 'closed',              'country' => 'NL', 'city' => 'Amsterdam',   'source' => 'instagram_ads',    'platform' => 'instagram', 'priority' => 'high',   'package_hours' => 8,  'subscription_price' => 100, 'currency' => 'EUR', 'payment_method' => 'bank_transfer'],
        ['name' => 'Sulayman Al-Khalidi',        'phone' => '+96212345025',  'email' => 'sulayman@hotmail.com',         'status' => 'closed',              'country' => 'JO', 'city' => 'Amman',       'source' => 'website_form',     'platform' => 'website',   'priority' => 'low',    'package_hours' => 4,  'subscription_price' => 60,  'currency' => 'USD', 'payment_method' => 'cash'],

        /* ── not_interested ──────────────────────────────── */
        ['name' => 'Layla Noor Al-Deen',        'phone' => '+966501234526', 'email' => 'layla.noor@gmail.com',         'status' => 'not_interested',      'country' => 'SA', 'city' => 'Medina',      'source' => 'google_ads',       'platform' => 'youtube',   'priority' => 'low',    'rejection_reason' => 'price'],
        ['name' => 'Dawud Mensah Al-Ghani',      'phone' => '+23312345027',  'email' => 'dawud.ghani@gmail.com',        'status' => 'not_interested',      'country' => 'GH', 'city' => 'Accra',       'source' => 'facebook_ads',     'platform' => 'facebook',  'priority' => 'low',    'rejection_reason' => 'schedule'],
        ['name' => 'Safiya Binte Rahman',        'phone' => '+60121234528',  'email' => 'safiya.rahman@gmail.com',      'status' => 'not_interested',      'country' => 'MY', 'city' => 'Kuala Lumpur','source' => 'instagram_ads',    'platform' => 'instagram', 'priority' => 'medium', 'rejection_reason' => 'not_interested'],
        ['name' => 'Ahmed Okonkwo',              'phone' => '+23481234529',  'email' => 'ahmed.okonkwo@gmail.com',      'status' => 'not_interested',      'country' => 'NG', 'city' => 'Lagos',       'source' => 'whatsapp_direct',  'platform' => 'whatsapp',  'priority' => 'low',    'rejection_reason' => 'price'],
        ['name' => 'Nadia El-Haddad',            'phone' => '+21661234530',  'email' => 'nadia.haddad@gmail.com',       'status' => 'not_interested',      'country' => 'TN', 'city' => 'Tunis',       'source' => 'manual_entry',     'platform' => 'other',     'priority' => 'low',    'rejection_reason' => 'no_response'],

        /* ── lost ────────────────────────────────────────── */
        ['name' => 'Ismail Konate',              'phone' => '+22361234531',  'email' => 'ismail.konate@gmail.com',      'status' => 'lost',                'country' => 'ML', 'city' => 'Bamako',      'source' => 'facebook_ads',     'platform' => 'facebook',  'priority' => 'low',    'rejection_reason' => 'schedule'],
        ['name' => 'Jameelah Sultan Al-Hashemi', 'phone' => '+97312345032',  'email' => 'jameelah.sultan@hotmail.com',  'status' => 'lost',                'country' => 'BH', 'city' => 'Manama',      'source' => 'google_ads',       'platform' => 'website',   'priority' => 'medium', 'rejection_reason' => 'price'],
        ['name' => 'Talib Hassan Yusuf',         'phone' => '+61412345033',  'email' => 'talib.yusuf@gmail.com',        'status' => 'lost',                'country' => 'AU', 'city' => 'Sydney',      'source' => 'website_form',     'platform' => 'youtube',   'priority' => 'medium', 'rejection_reason' => 'other'],
        ['name' => 'Fatiha Zerrouki',            'phone' => '+213551234534', 'email' => 'fatiha.zerrouki@gmail.com',    'status' => 'lost',                'country' => 'DZ', 'city' => 'Oran',        'source' => 'instagram_ads',    'platform' => 'tiktok',    'priority' => 'low',    'rejection_reason' => 'no_response'],
        ['name' => 'Anas Ibrahim Al-Jabri',      'phone' => '+96812345035',  'email' => 'anas.aljabri@gmail.com',       'status' => 'lost',                'country' => 'OM', 'city' => 'Salalah',     'source' => 'student_referral', 'platform' => 'whatsapp',  'priority' => 'low',    'rejection_reason' => 'price'],
    ];

    public function run(): void
    {
        $adminUser = User::where('role', 'admin')->first();
        $courses   = Course::all();

        foreach (self::LEADS as $i => $data) {
            if (Lead::where('email', $data['email'])->exists()) {
                continue;
            }

            $course = $courses->isNotEmpty() ? $courses->get($i % $courses->count()) : null;

            Lead::create([
                'name'                   => $data['name'],
                'email'                  => $data['email'],
                'phone'                  => $data['phone'],
                'country'                => $data['country'],
                'city'                   => $data['city'] ?? null,
                'status'                 => $data['status'],
                'source'                 => $data['source'],
                'platform'               => $data['platform'] ?? null,
                'priority'               => $data['priority'] ?? 'medium',
                'package_hours'          => $data['package_hours'] ?? null,
                'subscription_price'     => $data['subscription_price'] ?? null,
                'currency'               => $data['currency'] ?? null,
                'payment_method'         => $data['payment_method'] ?? null,
                'rejection_reason'       => $data['rejection_reason'] ?? null,
                'course_interest_id'     => $course?->id,
                'assigned_supervisor_id' => $adminUser?->id,
                'payload'                => [
                    'phones' => [['value' => $data['phone'], 'primary' => true]],
                    'emails' => [['value' => $data['email'], 'primary' => true]],
                ],
            ]);
        }

        $this->command->info('LeadSeeder: ' . count(self::LEADS) . ' leads seeded across all 7 statuses.');
    }
}

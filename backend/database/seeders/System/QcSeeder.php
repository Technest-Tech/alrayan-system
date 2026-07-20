<?php

namespace Database\Seeders\System;

use App\Models\System\QcCategory;
use App\Models\System\QcSpecialRule;
use Illuminate\Database\Seeder;

class QcSeeder extends Seeder
{
    /**
     * Seed the default Quality-Control checklist that ships with the module.
     * Penalties are calibrated so every item unchecked lands the score at 0
     * (the 10 category sums total 100%). Idempotent — safe to re-run.
     */
    public function run(): void
    {
        QcSpecialRule::firstOrCreate(
            ['rule_key' => 'camera_cap'],
            [
                'rule_type' => 'score_cap',
                'label'     => 'Camera Off — Score Cap at 30%',
                'cap_value' => 30,
                'is_active' => true,
            ],
        );

        foreach ($this->blueprint() as $order => $cat) {
            $category = QcCategory::firstOrCreate(
                ['name' => $cat['name']],
                ['weight' => $cat['weight'] ?? 10, 'sort_order' => $order, 'is_active' => true],
            );

            foreach ($cat['items'] as $itemOrder => $item) {
                $category->items()->firstOrCreate(
                    ['label' => $item['label']],
                    [
                        'penalty'          => $item['penalty'],
                        'special_rule_key' => $item['rule'] ?? null,
                        'sort_order'       => $itemOrder,
                        'is_active'        => true,
                    ],
                );
            }
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function blueprint(): array
    {
        return [
            [
                'name'  => 'Simplicity & Clarity of Explanation',
                'items' => [
                    ['label' => "Simple explanation adapted to the student's level", 'penalty' => 8],
                    ['label' => 'Examples / rephrasing when needed',                 'penalty' => 7],
                ],
            ],
            [
                'name'  => 'Interaction (Class Dynamics)',
                'items' => [
                    ['label' => 'No boredom (lively pace, energy)',                        'penalty' => 5],
                    ['label' => 'Two-way communication (teacher ↔ student)',               'penalty' => 5],
                    ['label' => 'Teacher asks questions to the student',                    'penalty' => 5],
                    ['label' => 'Role-playing - Explain to me NOT "DID YOU UNDERSTAND??"',  'penalty' => 5],
                    ['label' => "Student's name used at least once",                        'penalty' => 5],
                ],
            ],
            [
                'name'  => 'Camera (Strict Rule)',
                'items' => [
                    ['label' => 'If camera off → apply score ≤ 30% rule', 'penalty' => 10, 'rule' => 'camera_cap'],
                    ['label' => 'Exception only for real sudden technical issues', 'penalty' => 5],
                ],
            ],
            [
                'name'  => 'Internet Connection',
                'items' => [
                    ['label' => 'Stable and good quality connection', 'penalty' => 10],
                ],
            ],
            [
                'name'  => 'Clear Sound (no echo/noise) & Varied Tone',
                'items' => [
                    ['label' => 'Clear sound (no echo/noise)', 'penalty' => 5],
                    ['label' => 'Varied tone (not monotone)',  'penalty' => 5],
                ],
            ],
            [
                'name'  => 'Break from "Teaching Mode" Every 10–15 Minutes',
                'items' => [
                    ['label' => 'Regular breaks / activity changes', 'penalty' => 5],
                ],
            ],
            [
                'name'  => 'Language',
                'items' => [
                    ['label' => 'Correct pronunciation',   'penalty' => 3],
                    ['label' => 'Understanding verified',   'penalty' => 2],
                ],
            ],
            [
                'name'  => 'Surprise Observation',
                'items' => [
                    ['label' => 'Surprise observation conducted', 'penalty' => 5],
                ],
            ],
            [
                'name'  => 'Student Encouragement During 10-Minute Observation',
                'items' => [
                    ['label' => 'At least 1 compliment given', 'penalty' => 5],
                ],
            ],
            [
                'name'  => "Subject Mastery (Teacher's Scientific Level)",
                'items' => [
                    ['label' => 'Reliable corrections and accurate explanations', 'penalty' => 3],
                    ['label' => 'Answers questions clearly (or notes question and returns with correct answer)', 'penalty' => 2],
                ],
            ],
        ];
    }
}

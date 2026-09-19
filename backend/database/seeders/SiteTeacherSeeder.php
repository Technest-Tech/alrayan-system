<?php

namespace Database\Seeders;

use App\Models\Teacher;
use App\Models\TeacherReview;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Publishes the marketing site's teacher profiles and their reviews.
 *
 * The site rendered these teachers from frontend/src/content/teachers.ts while the
 * `teachers` table stayed empty, so every /our-teachers/<slug> profile 404'd. The
 * JSON beside this file is exported from that same content, so the database and the
 * static content say the same thing rather than drifting apart.
 *
 * The profiles and reviews are PLACEHOLDER copy shipped with the template — invented
 * names, templated review text. Replace them with the academy's real teachers and real
 * student feedback in Site → Teachers / Site → Reviews; re-running this seeder will not
 * resurrect a profile you deleted, but it does reset the ones whose slug it still owns.
 */
class SiteTeacherSeeder extends Seeder
{
    public function run(): void
    {
        $path = __DIR__ . '/data/site-teachers.json';

        if (! is_file($path)) {
            $this->command?->warn("SiteTeacherSeeder: {$path} is missing, nothing seeded.");
            return;
        }

        $rows = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        DB::transaction(function () use ($rows) {
            foreach ($rows as $row) {
                $reviews = $row['reviews'] ?? [];
                unset($row['reviews']);

                $teacher = Teacher::updateOrCreate(['slug' => $row['slug']], $row);

                // Replace this teacher's seeded reviews rather than appending on re-run.
                TeacherReview::where('teacher_id', $teacher->id)->delete();

                foreach ($reviews as $review) {
                    TeacherReview::create($review + [
                        'teacher_id' => $teacher->id,
                        'approved'   => true,
                    ]);
                }

                $teacher->forceFill([
                    'reviews_count' => count($reviews) ?: $teacher->reviews_count,
                ])->save();
            }
        });

        $this->command?->info(sprintf(
            'Seeded %d site teachers and %d reviews.',
            count($rows),
            array_sum(array_map(fn ($r) => count($r['reviews'] ?? []), $rows)),
        ));
    }
}

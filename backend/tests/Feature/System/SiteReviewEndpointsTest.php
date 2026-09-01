<?php

namespace Tests\Feature\System;

use App\Models\Teacher;
use App\Models\TeacherReview;
use Tests\SystemTestCase;

class SiteReviewEndpointsTest extends SystemTestCase
{
    private function teacher(array $attributes = []): Teacher
    {
        static $n = 0;
        $n++;

        return Teacher::create(array_merge([
            'slug'        => "teacher-{$n}",
            'name'        => "Teacher {$n}",
            'name_arabic' => 'معلم',
            'role'        => 'Quran Teacher',
            'bio'         => 'Teaches Quran.',
            'credentials' => 'Ijazah',
            'specialties' => ['Tajweed'],
            'languages'   => ['English'],
        ], $attributes));
    }

    private function review(Teacher $teacher, array $attributes = []): TeacherReview
    {
        return $teacher->reviews()->create(array_merge([
            'author'   => 'Sarah A.',
            'rating'   => 5,
            'text'     => 'Wonderful lessons.',
            'approved' => true,
        ], $attributes));
    }

    public function test_requires_the_site_permission(): void
    {
        $this->actingAs($this->staffUser('accountant'), 'sanctum')
            ->getJson('/api/system/site/reviews')
            ->assertForbidden();
    }

    public function test_lists_every_review_across_teachers_with_its_teacher(): void
    {
        $this->review($this->teacher(['name' => 'Aisha']));
        $this->review($this->teacher(['name' => 'Omar']));

        $response = $this->asAdmin()->getJson('/api/system/site/reviews')->assertOk();

        $this->assertSame(2, $response->json('total'));
        $this->assertNotNull($response->json('data.0.teacher.name'));
    }

    public function test_shows_pending_reviews_first(): void
    {
        $teacher = $this->teacher();
        $this->review($teacher, ['author' => 'Approved one', 'approved' => true]);
        $this->review($teacher, ['author' => 'Waiting one', 'approved' => false]);

        $authors = $this->asAdmin()->getJson('/api/system/site/reviews')->json('data.*.author');

        $this->assertSame('Waiting one', $authors[0], 'the moderation queue opens on the work');
    }

    public function test_filters_by_status_teacher_rating_and_text(): void
    {
        $aisha = $this->teacher(['name' => 'Aisha']);
        $omar  = $this->teacher(['name' => 'Omar']);

        $this->review($aisha, ['author' => 'Pending Person', 'approved' => false, 'rating' => 3]);
        $this->review($aisha, ['author' => 'Happy Person', 'approved' => true, 'rating' => 5]);
        $this->review($omar,  ['author' => 'Other Person', 'approved' => true, 'rating' => 5]);

        $this->assertSame(1, $this->asAdmin()->getJson('/api/system/site/reviews?status=pending')->json('total'));
        $this->assertSame(2, $this->asAdmin()->getJson('/api/system/site/reviews?status=approved')->json('total'));
        $this->assertSame(2, $this->asAdmin()->getJson("/api/system/site/reviews?teacher_id={$aisha->id}")->json('total'));
        $this->assertSame(1, $this->asAdmin()->getJson('/api/system/site/reviews?rating=3')->json('total'));
        $this->assertSame(1, $this->asAdmin()->getJson('/api/system/site/reviews?search=Happy')->json('total'));
    }

    public function test_reports_moderation_totals(): void
    {
        $teacher = $this->teacher();
        $this->review($teacher, ['approved' => true, 'rating' => 5]);
        $this->review($teacher, ['approved' => true, 'rating' => 4]);
        $this->review($teacher, ['approved' => false, 'rating' => 3]);

        $stats = $this->asAdmin()->getJson('/api/system/site/reviews/stats')->assertOk()->json('data');

        $this->assertSame(3, $stats['total']);
        $this->assertSame(2, $stats['approved']);
        $this->assertSame(1, $stats['pending']);
        $this->assertEquals(4, $stats['average_rating']);
        $this->assertSame(1, $stats['by_rating'][5]);
        $this->assertSame(0, $stats['by_rating'][1]);
    }

    public function test_bulk_approves_reviews(): void
    {
        $teacher = $this->teacher();
        $a = $this->review($teacher, ['approved' => false]);
        $b = $this->review($teacher, ['approved' => false]);

        $this->asAdmin()
            ->postJson('/api/system/site/reviews/bulk', ['action' => 'approve', 'ids' => [$a->id, $b->id]])
            ->assertOk()
            ->assertJsonPath('data.affected', 2);

        $this->assertTrue($a->fresh()->approved);
        $this->assertTrue($b->fresh()->approved);
    }

    public function test_bulk_deletes_reviews(): void
    {
        $teacher = $this->teacher();
        $review  = $this->review($teacher);

        $this->asAdmin()
            ->postJson('/api/system/site/reviews/bulk', ['action' => 'delete', 'ids' => [$review->id]])
            ->assertOk();

        $this->assertSame(0, TeacherReview::count());
    }

    public function test_rejects_an_unknown_bulk_action(): void
    {
        $review = $this->review($this->teacher());

        $this->asAdmin()
            ->postJson('/api/system/site/reviews/bulk', ['action' => 'burn', 'ids' => [$review->id]])
            ->assertStatus(422);
    }

    public function test_reorders_the_public_teachers_list(): void
    {
        $first  = $this->teacher(['sort_order' => 0]);
        $second = $this->teacher(['sort_order' => 1]);
        $third  = $this->teacher(['sort_order' => 2]);

        $this->asAdmin()
            ->postJson('/api/system/site/teachers/reorder', ['ids' => [$third->id, $first->id, $second->id]])
            ->assertOk();

        $this->assertSame(0, $third->fresh()->sort_order);
        $this->assertSame(1, $first->fresh()->sort_order);
        $this->assertSame(2, $second->fresh()->sort_order);
    }

    public function test_reorder_rejects_an_unknown_teacher(): void
    {
        $this->asAdmin()
            ->postJson('/api/system/site/teachers/reorder', ['ids' => [9999]])
            ->assertStatus(422);
    }

    /**
     * A teacher saved without a slug is invisible on the public site: the slug
     * is the route key, so the site links to a numeric id the API cannot
     * resolve and the profile 404s. The model fills it in on every write path.
     */
    public function test_a_teacher_saved_without_a_slug_still_gets_one(): void
    {
        $teacher = $this->teacher(['slug' => null, 'name' => 'Ustadh Bilal']);

        $this->assertSame('ustadh-bilal', $teacher->fresh()->slug);
    }

    public function test_a_blank_slug_does_not_collide_with_an_existing_one(): void
    {
        $this->teacher(['slug' => null, 'name' => 'Ustadh Bilal']);
        $second = $this->teacher(['slug' => null, 'name' => 'Ustadh Bilal']);

        $this->assertSame('ustadh-bilal-2', $second->fresh()->slug);
    }

    public function test_creating_a_teacher_through_the_api_without_a_slug_derives_one_from_the_name(): void
    {
        $this->asAdmin()
            ->postJson('/api/system/site/teachers', [
                'name' => 'Sheikh Anas Yusuf',
                'role' => 'Quran Teacher',
                'bio'  => 'Teaches Tajweed.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'sheikh-anas-yusuf');
    }
}

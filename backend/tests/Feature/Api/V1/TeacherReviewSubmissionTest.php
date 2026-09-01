<?php

namespace Tests\Feature\Api\V1;

use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TeacherReviewSubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The submit route is rate limited per IP; without this the limiter
        // carries hits from one test into the next.
        Cache::flush();

        // phpunit.xml forces a Turnstile secret so the captcha guard is really
        // exercised — the verification call itself is faked, as in ContactTest.
        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response(['success' => true], 200),
        ]);
    }

    private function teacher(array $attrs = []): Teacher
    {
        return Teacher::create(array_merge([
            'name'             => 'Ustadh Test',
            'name_arabic'      => 'اسم',
            'slug'             => 'ustadh-test',
            'role'             => 'Quran Teacher',
            'bio'              => 'Bio text.',
            'credentials'      => 'Al-Azhar certified.',
            'specialties'      => ['Tajweed'],
            'languages'        => ['Arabic'],
            'is_female'        => false,
            'years_experience' => 5,
            'students_count'   => 10,
            'featured'         => true,
            'sort_order'       => 0,
        ], $attrs));
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'author' => 'Amina',
            'rating' => 5,
            'text'           => 'Patient and clear. My son looks forward to every lesson.',
            'turnstileToken' => 'test-token',
        ], $overrides);
    }

    public function test_a_submitted_review_appears_on_the_teacher_immediately(): void
    {
        $teacher = $this->teacher();

        $this->postJson("/api/v1/teachers/{$teacher->slug}/reviews", $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.author', 'Amina')
            ->assertJsonPath('data.rating', 5);

        // The public endpoint the page reads must already show it — no
        // approval step in between.
        $this->getJson("/api/v1/teachers/{$teacher->slug}")
            ->assertOk()
            ->assertJsonPath('data.reviews.0.author', 'Amina');
    }

    public function test_the_review_is_stored_already_approved(): void
    {
        $teacher = $this->teacher();

        $this->postJson("/api/v1/teachers/{$teacher->slug}/reviews", $this->payload())->assertCreated();

        $this->assertDatabaseHas('teacher_reviews', [
            'teacher_id' => $teacher->id,
            'author'     => 'Amina',
            'approved'   => true,
        ]);
    }

    public function test_a_new_review_is_listed_first(): void
    {
        $teacher = $this->teacher();
        $teacher->reviews()->create(['author' => 'Existing', 'rating' => 5, 'text' => 'Older review.', 'approved' => true, 'sort_order' => 0]);

        $this->postJson("/api/v1/teachers/{$teacher->slug}/reviews", $this->payload(['author' => 'Newest']))->assertCreated();

        $this->getJson("/api/v1/teachers/{$teacher->slug}")
            ->assertOk()
            ->assertJsonPath('data.reviews.0.author', 'Newest')
            ->assertJsonPath('data.reviews.1.author', 'Existing');
    }

    public function test_the_stored_sort_order_is_never_negative(): void
    {
        // `teacher_reviews.sort_order` is an unsigned column in MySQL, so a
        // negative value is not merely odd — it is rejected outright and the
        // submission 500s. sqlite, which this suite runs on, stores a negative
        // quite happily, so the bug has to be asserted directly rather than
        // left for the database to catch.
        $teacher = $this->teacher();
        $teacher->reviews()->create(['author' => 'Existing', 'rating' => 5, 'text' => 'Older.', 'approved' => true, 'sort_order' => 0]);

        $this->postJson("/api/v1/teachers/{$teacher->slug}/reviews", $this->payload())->assertCreated();

        $this->assertGreaterThanOrEqual(0, $teacher->reviews()->min('sort_order'));
    }

    public function test_the_first_ever_review_for_a_teacher_saves(): void
    {
        // The empty-table case: min('sort_order') is null there, which is where
        // the out-of-range value came from, and every teacher started empty.
        $teacher = $this->teacher();
        $this->assertSame(0, $teacher->reviews()->count());

        $this->postJson("/api/v1/teachers/{$teacher->slug}/reviews", $this->payload(['author' => 'Amina']))
            ->assertCreated()
            ->assertJsonPath('data.author', 'Amina');

        $this->assertGreaterThanOrEqual(0, $teacher->reviews()->min('sort_order'));
    }

    public function test_a_deleted_review_disappears_from_the_page(): void
    {
        $teacher = $this->teacher();
        $this->postJson("/api/v1/teachers/{$teacher->slug}/reviews", $this->payload())->assertCreated();

        $teacher->reviews()->delete();

        $this->getJson("/api/v1/teachers/{$teacher->slug}")
            ->assertOk()
            ->assertJsonCount(0, 'data.reviews');
    }

    public function test_an_unapproved_review_is_hidden_without_being_deleted(): void
    {
        $teacher = $this->teacher();
        $this->postJson("/api/v1/teachers/{$teacher->slug}/reviews", $this->payload())->assertCreated();

        $teacher->reviews()->update(['approved' => false]);

        $this->getJson("/api/v1/teachers/{$teacher->slug}")
            ->assertOk()
            ->assertJsonCount(0, 'data.reviews');
        $this->assertDatabaseCount('teacher_reviews', 1);
    }

    public function test_it_rejects_an_incomplete_or_out_of_range_review(): void
    {
        $teacher = $this->teacher();
        $url = "/api/v1/teachers/{$teacher->slug}/reviews";

        $this->postJson($url, $this->payload(['author' => '']))->assertJsonValidationErrorFor('author');
        $this->postJson($url, $this->payload(['text' => '']))->assertJsonValidationErrorFor('text');
        $this->postJson($url, $this->payload(['rating' => 0]))->assertJsonValidationErrorFor('rating');
        $this->postJson($url, $this->payload(['rating' => 6]))->assertJsonValidationErrorFor('rating');
        $this->postJson($url, $this->payload(['text' => str_repeat('a', 1001)]))->assertJsonValidationErrorFor('text');

        $this->assertDatabaseCount('teacher_reviews', 0);
    }

    public function test_it_404s_for_an_unknown_teacher(): void
    {
        $this->postJson('/api/v1/teachers/no-such-teacher/reviews', $this->payload())->assertNotFound();
    }

    public function test_the_french_page_shows_a_review_written_in_french(): void
    {
        $teacher = $this->teacher();

        $this->postJson("/api/v1/teachers/{$teacher->slug}/reviews", $this->payload([
            'author' => 'Fatima',
            'text'   => 'Enseignant patient et clair.',
        ]))->assertCreated();

        // No `text_fr` is captured from the public form, so the submitted text
        // is what both locales show.
        $this->getJson("/api/v1/teachers/{$teacher->slug}?locale=fr")
            ->assertOk()
            ->assertJsonPath('data.reviews.0.text', 'Enseignant patient et clair.');
    }

    public function test_it_rejects_a_submission_with_no_captcha_token(): void
    {
        $teacher = $this->teacher();
        $payload = $this->payload();
        unset($payload['turnstileToken']);

        $this->postJson("/api/v1/teachers/{$teacher->slug}/reviews", $payload)->assertStatus(422);
        $this->assertDatabaseCount('teacher_reviews', 0);
    }

    public function test_submissions_are_rate_limited(): void
    {
        $teacher = $this->teacher();
        $url = "/api/v1/teachers/{$teacher->slug}/reviews";

        for ($i = 0; $i < 5; $i++) {
            $this->postJson($url, $this->payload(['author' => "Person {$i}"]))->assertCreated();
        }

        $this->postJson($url, $this->payload(['author' => 'One too many']))->assertStatus(429);
    }
}

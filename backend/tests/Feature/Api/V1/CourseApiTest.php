<?php

namespace Tests\Feature\Api\V1;

use App\Models\Course;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CourseApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function makeCourse(array $attrs = []): Course
    {
        return Course::create(array_merge([
            'slug'              => 'course-' . uniqid(),
            'title'             => 'Test Course',
            'short_description' => 'Short description.',
            'long_description'  => 'Long description.',
            'icon'              => 'BookOpen',
            'level'             => 'Beginner',
            'features'          => ['Feature 1'],
            'seo_title'         => 'Test SEO Title',
            'seo_description'   => 'Test SEO Description.',
            'outcomes'          => ['Outcome 1'],
            'curriculum'        => [['module' => 'Module 1', 'topics' => ['Topic 1']]],
            'personas'          => [['title' => 'Persona 1', 'description' => 'Desc.']],
            'faqs'              => [['q' => 'Q?', 'a' => 'A.']],
            'related_slugs'     => [],
            'specialty_tags'    => ['Test'],
            'active'            => true,
            'sort_order'        => 0,
        ], $attrs));
    }

    public function test_lists_active_courses(): void
    {
        $this->makeCourse(['slug' => 'active-1']);
        $this->makeCourse(['slug' => 'active-2']);
        $this->makeCourse(['slug' => 'inactive', 'active' => false]);

        $response = $this->getJson('/api/v1/courses')->assertOk();

        $this->assertArrayHasKey('data', $response->json());
        $this->assertCount(2, $response->json('data'));
    }

    public function test_inactive_course_excluded(): void
    {
        $this->makeCourse(['slug' => 'inactive', 'active' => false]);

        $data = $this->getJson('/api/v1/courses')->assertOk()->json('data');
        $this->assertEmpty($data);
    }

    public function test_returns_single_course_by_slug(): void
    {
        $this->makeCourse(['slug' => 'tajweed-course', 'title' => 'Tajweed']);

        $this->getJson('/api/v1/courses/tajweed-course')
             ->assertOk()
             ->assertJsonPath('slug', 'tajweed-course')
             ->assertJsonPath('title', 'Tajweed');
    }

    public function test_returns_404_for_unknown_course(): void
    {
        $this->getJson('/api/v1/courses/nonexistent')->assertNotFound();
    }

    public function test_returns_404_for_inactive_course(): void
    {
        $this->makeCourse(['slug' => 'inactive-course', 'active' => false]);

        $this->getJson('/api/v1/courses/inactive-course')->assertNotFound();
    }

    public function test_courses_ordered_by_sort_order(): void
    {
        $this->makeCourse(['slug' => 'course-b', 'sort_order' => 2]);
        $this->makeCourse(['slug' => 'course-a', 'sort_order' => 1]);
        $this->makeCourse(['slug' => 'course-c', 'sort_order' => 3]);

        $data = $this->getJson('/api/v1/courses')->assertOk()->json('data');

        $this->assertEquals('course-a', $data[0]['slug']);
        $this->assertEquals('course-b', $data[1]['slug']);
        $this->assertEquals('course-c', $data[2]['slug']);
    }
}

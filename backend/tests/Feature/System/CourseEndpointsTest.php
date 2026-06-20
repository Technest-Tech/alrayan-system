<?php

namespace Tests\Feature\System;

use App\Models\Course;
use App\Models\System\Student;
use Tests\SystemTestCase;

class CourseEndpointsTest extends SystemTestCase
{
    private function makeCourse(array $attrs = []): Course
    {
        return Course::create(array_merge([
            'slug'              => 'course-' . uniqid(),
            'title'             => 'Test Course',
            'short_description' => 'Short description.',
            'long_description'  => 'Long description.',
            'icon'              => 'BookOpen',
            'level'             => 'Beginner',
            'features'          => [],
            'seo_title'         => 'Test SEO Title',
            'seo_description'   => 'Test SEO Description.',
            'outcomes'          => [],
            'curriculum'        => [],
            'personas'          => [],
            'faqs'              => [],
            'related_slugs'     => [],
            'specialty_tags'    => [],
            'active'            => true,
            'sort_order'        => 0,
        ], $attrs));
    }

    public function test_admin_can_create_subject(): void
    {
        $this->asAdmin()
            ->postJson('/api/system/courses', [
                'name'        => 'Tajweed Basics',
                'level'       => 'Beginner',
                'description' => 'Intro to tajweed.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Tajweed Basics')
            ->assertJsonPath('data.level', 'Beginner')
            ->assertJsonPath('data.is_active_for_system', true);

        // New subjects are hidden from the public site until their content is filled in.
        $this->assertDatabaseHas('courses', [
            'title'  => 'Tajweed Basics',
            'slug'   => 'tajweed-basics',
            'active' => false,
        ]);
    }

    public function test_create_subject_requires_name(): void
    {
        $this->asAdmin()
            ->postJson('/api/system/courses', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_create_subject_derives_unique_slug(): void
    {
        $this->makeCourse(['slug' => 'tajweed-basics']);

        $this->asAdmin()
            ->postJson('/api/system/courses', ['name' => 'Tajweed Basics'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'tajweed-basics-2');
    }

    public function test_admin_can_delete_empty_subject(): void
    {
        $course = $this->makeCourse();

        $this->asAdmin()
            ->deleteJson("/api/system/courses/{$course->id}")
            ->assertOk();

        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }

    public function test_cannot_delete_subject_with_students(): void
    {
        $course = $this->makeCourse();
        Student::factory()->create(['course_id' => $course->id]);

        $this->asAdmin()
            ->deleteJson("/api/system/courses/{$course->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('courses', ['id' => $course->id]);
    }
}

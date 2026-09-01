<?php

namespace Tests\Feature\Api\V1;

use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TeacherApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function makeTeacher(array $attrs = []): Teacher
    {
        return Teacher::create(array_merge([
            'name'             => 'Teacher ' . uniqid(),
            'name_arabic'      => 'اسم',
            'role'             => 'Quran Teacher',
            'bio'              => 'Bio text.',
            'specialties'      => ['Tajweed'],
            'languages'        => ['Arabic', 'English'],
            'credentials'      => 'Al-Azhar certified.',
            'is_female'        => false,
            'years_experience' => 5,
            'students_count'   => 100,
            'featured'         => true,
            'sort_order'       => 0,
        ], $attrs));
    }

    public function test_lists_featured_teachers(): void
    {
        $this->makeTeacher(['featured' => true]);
        $this->makeTeacher(['featured' => true]);
        $this->makeTeacher(['featured' => false]);

        $response = $this->getJson('/api/v1/teachers')->assertOk();

        $this->assertArrayHasKey('data', $response->json());
        $this->assertCount(2, $response->json('data'));
    }

    public function test_non_featured_teachers_excluded(): void
    {
        $this->makeTeacher(['featured' => false]);

        $data = $this->getJson('/api/v1/teachers')->assertOk()->json('data');
        $this->assertEmpty($data);
    }

    public function test_teachers_ordered_by_sort_order(): void
    {
        $this->makeTeacher(['name' => 'Teacher B', 'sort_order' => 2]);
        $this->makeTeacher(['name' => 'Teacher A', 'sort_order' => 1]);

        $data = $this->getJson('/api/v1/teachers')->assertOk()->json('data');

        $this->assertEquals('Teacher A', $data[0]['name']);
        $this->assertEquals('Teacher B', $data[1]['name']);
    }

    public function test_french_request_returns_the_french_title(): void
    {
        $this->makeTeacher([
            'title'    => 'Quran and Arabic Language Teacher',
            'title_fr' => 'Professeur de Coran et de langue arabe',
            'role_fr'  => 'Enseignant',
        ]);

        $this->getJson('/api/v1/teachers?locale=fr')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Professeur de Coran et de langue arabe');
    }

    public function test_french_title_falls_back_to_the_french_role_not_english(): void
    {
        // A teacher saved through the admin panel without a French title: the
        // French site must not print the English hook at the reader.
        $this->makeTeacher([
            'title'    => 'Quran and Arabic Language Teacher',
            'title_fr' => null,
            'role_fr'  => 'Enseignante',
        ]);

        $this->getJson('/api/v1/teachers?locale=fr')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Enseignante');
    }

    public function test_english_request_is_unaffected_by_the_french_fallback(): void
    {
        $this->makeTeacher([
            'title'    => 'Quran and Arabic Language Teacher',
            'title_fr' => null,
            'role_fr'  => 'Enseignante',
        ]);

        $this->getJson('/api/v1/teachers')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Quran and Arabic Language Teacher');
    }

    public function test_french_title_keeps_english_when_there_is_no_french_role_either(): void
    {
        $this->makeTeacher([
            'title'    => 'Quran and Arabic Language Teacher',
            'title_fr' => null,
            'role_fr'  => null,
        ]);

        $this->getJson('/api/v1/teachers?locale=fr')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Quran and Arabic Language Teacher');
    }

    public function test_response_includes_expected_fields(): void
    {
        $this->makeTeacher();

        $response = $this->getJson('/api/v1/teachers')->assertOk();
        $teacher = $response->json('data.0');

        $this->assertArrayHasKey('name', $teacher);
        $this->assertArrayHasKey('role', $teacher);
        $this->assertArrayHasKey('specialties', $teacher);
        $this->assertArrayHasKey('languages', $teacher);
        $this->assertArrayHasKey('bio', $teacher);
    }
}

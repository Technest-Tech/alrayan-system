<?php

namespace Tests\Feature\Api\V1;

use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BlogApiTest extends TestCase
{
    use RefreshDatabase;

    private User $author;

    protected function setUp(): void
    {
        parent::setUp();
        $this->author = User::factory()->create();
        Cache::flush();
    }

    private function makePost(array $attrs = []): BlogPost
    {
        return BlogPost::create(array_merge([
            'title'           => 'Test Post',
            'slug'            => 'test-post-' . uniqid(),
            'excerpt'         => 'Test excerpt.',
            'body'            => '<p>Test body.</p>',
            'status'          => 'published',
            'published_at'    => now()->subMinute(),
            'reading_minutes' => 5,
            'author_id'       => $this->author->id,
        ], $attrs));
    }

    public function test_lists_published_posts(): void
    {
        $this->makePost();
        $this->makePost();
        $this->makePost(['status' => 'draft', 'published_at' => null]);

        $response = $this->getJson('/api/v1/blog');

        $response->assertOk()
                 ->assertJsonStructure(['data', 'total', 'current_page', 'last_page']);

        $this->assertEquals(2, $response->json('total'));
    }

    public function test_draft_post_not_in_listing(): void
    {
        $this->makePost(['status' => 'draft', 'published_at' => null]);

        $this->getJson('/api/v1/blog')
             ->assertOk()
             ->assertJsonPath('total', 0);
    }

    public function test_future_published_post_not_in_listing(): void
    {
        $this->makePost(['published_at' => now()->addDay()]);

        $this->getJson('/api/v1/blog')
             ->assertOk()
             ->assertJsonPath('total', 0);
    }

    public function test_returns_single_published_post(): void
    {
        $post = $this->makePost(['slug' => 'my-test-post']);

        $this->getJson('/api/v1/blog/my-test-post')
             ->assertOk()
             ->assertJsonPath('slug', 'my-test-post');
    }

    public function test_returns_404_for_unknown_slug(): void
    {
        $this->getJson('/api/v1/blog/nonexistent-slug')->assertNotFound();
    }

    public function test_returns_404_for_draft_post_by_slug(): void
    {
        $this->makePost(['slug' => 'draft-slug', 'status' => 'draft', 'published_at' => null]);

        $this->getJson('/api/v1/blog/draft-slug')->assertNotFound();
    }

    public function test_filters_by_category_slug(): void
    {
        $category = BlogCategory::create(['title' => 'Tajweed', 'slug' => 'tajweed']);

        $matching = $this->makePost(['slug' => 'matching-post']);
        $matching->categories()->attach($category->id);

        $this->makePost(['slug' => 'other-post']);

        $this->getJson('/api/v1/blog?category=tajweed')
             ->assertOk()
             ->assertJsonPath('total', 1)
             ->assertJsonPath('data.0.slug', 'matching-post');
    }

    public function test_response_includes_categories_and_author(): void
    {
        $post = $this->makePost(['slug' => 'full-post']);
        $category = BlogCategory::create(['title' => 'Tips', 'slug' => 'tips']);
        $post->categories()->attach($category->id);

        $response = $this->getJson('/api/v1/blog/full-post')->assertOk();

        $this->assertArrayHasKey('categories', $response->json());
        $this->assertArrayHasKey('author', $response->json());
    }

    public function test_pagination_works(): void
    {
        for ($i = 1; $i <= 15; $i++) {
            $this->makePost(['slug' => "post-{$i}", 'title' => "Post {$i}"]);
        }

        $response = $this->getJson('/api/v1/blog?perPage=10')->assertOk();

        $this->assertCount(10, $response->json('data'));
        $this->assertEquals(15, $response->json('total'));
        $this->assertEquals(2, $response->json('last_page'));
    }
}

<?php

namespace Database\Seeders;

use App\Models\BlogCategory;
use Illuminate\Database\Seeder;

class BlogCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['title' => 'Quran Learning',    'slug' => 'quran-learning'],
            ['title' => 'Tajweed',           'slug' => 'tajweed'],
            ['title' => 'Hifz & Memorization', 'slug' => 'hifz-memorization'],
            ['title' => 'Arabic Language',   'slug' => 'arabic-language'],
            ['title' => 'Islamic Studies',   'slug' => 'islamic-studies'],
            ['title' => 'Tips & Guides',     'slug' => 'tips-guides'],
        ];

        foreach ($categories as $category) {
            BlogCategory::updateOrCreate(['slug' => $category['slug']], $category);
        }
    }
}

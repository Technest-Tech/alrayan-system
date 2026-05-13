<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BlogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $page     = $request->integer('page', 1);
        $perPage  = $request->integer('perPage', 10);
        $category = $request->get('category', '');

        $cacheKey = "blog.index.{$page}.{$perPage}.{$category}";

        $data = Cache::remember($cacheKey, 3600, function () use ($request, $perPage) {
            $query = BlogPost::published()
                ->with(['categories:id,title,slug', 'author:id,name'])
                ->latest('published_at');

            if ($cat = $request->get('category')) {
                $query->whereHas('categories', fn ($q) => $q->where('slug', $cat));
            }

            return $query->paginate($perPage);
        });

        return response()->json($data);
    }

    public function show(string $slug): JsonResponse
    {
        $data = Cache::remember("blog.show.{$slug}", 3600, function () use ($slug) {
            return BlogPost::published()
                ->with(['categories:id,title,slug', 'author:id,name'])
                ->where('slug', $slug)
                ->firstOrFail();
        });

        return response()->json($data);
    }
}

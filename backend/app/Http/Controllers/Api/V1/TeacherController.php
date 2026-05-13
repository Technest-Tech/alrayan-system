<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class TeacherController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember('teachers.index', 3600, fn () =>
            Teacher::where('featured', true)->orderBy('sort_order')->get()
        );

        return response()->json(['data' => $data]);
    }
}

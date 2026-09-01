<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\TeacherReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SiteTeacherController extends Controller
{
    /** List all marketing teachers for the admin table. */
    public function index(): JsonResponse
    {
        $teachers = Teacher::withCount('reviews')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $teachers]);
    }

    public function show(Teacher $teacher): JsonResponse
    {
        return response()->json(['data' => $teacher->load('reviews')]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? $data['name']);

        // These columns are NOT NULL with no database default, but none of them
        // is something an admin must fill in to publish a profile. Supply the
        // empty value so an omitted optional field is a blank profile section
        // rather than a 500.
        $data += [
            'name_arabic' => '',
            'credentials' => '',
            'specialties' => [],
            'languages'   => [],
        ];

        $teacher = Teacher::create($data);

        return response()->json(['data' => $teacher->load('reviews')], 201);
    }

    public function update(Request $request, Teacher $teacher): JsonResponse
    {
        $data = $this->validated($request, $teacher->id);
        if (isset($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $teacher->id);
        }

        $teacher->update($data);

        return response()->json(['data' => $teacher->fresh()->load('reviews')]);
    }

    public function destroy(Teacher $teacher): JsonResponse
    {
        $teacher->delete();

        return response()->json(null, 204);
    }

    /**
     * Persist a new display order for the public teachers list.
     *
     * The whole ordered list of ids is sent at once rather than a moved-from/to
     * pair, so the result cannot drift out of step with what the admin sees
     * after a drag.
     */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:teachers,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['ids'] as $position => $id) {
                Teacher::where('id', $id)->update(['sort_order' => $position]);
            }
        });

        return response()->json(['data' => Teacher::withCount('reviews')->orderBy('sort_order')->get()]);
    }

    // ── Reviews ──

    public function storeReview(Request $request, Teacher $teacher): JsonResponse
    {
        $data = $request->validate([
            'author'     => ['required', 'string', 'max:120'],
            'rating'     => ['required', 'integer', 'min:1', 'max:5'],
            'text'       => ['required', 'string', 'max:1000'],
            'text_fr'    => ['sometimes', 'nullable', 'string', 'max:1000'],
            'approved'   => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ]);
        $data['sort_order'] ??= (int) $teacher->reviews()->max('sort_order') + 1;

        $review = $teacher->reviews()->create($data);

        return response()->json(['data' => $review], 201);
    }

    public function updateReview(Request $request, TeacherReview $review): JsonResponse
    {
        $data = $request->validate([
            'author'     => ['sometimes', 'string', 'max:120'],
            'rating'     => ['sometimes', 'integer', 'min:1', 'max:5'],
            'text'       => ['sometimes', 'string', 'max:1000'],
            'text_fr'    => ['sometimes', 'nullable', 'string', 'max:1000'],
            'approved'   => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ]);

        $review->update($data);

        return response()->json(['data' => $review->fresh()]);
    }

    public function destroyReview(TeacherReview $review): JsonResponse
    {
        $review->delete();

        return response()->json(null, 204);
    }

    // ── Helpers ──

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $required = $ignoreId ? 'sometimes' : 'required';

        return $request->validate([
            'slug'             => ['sometimes', 'nullable', 'string', 'max:160', Rule::unique('teachers', 'slug')->ignore($ignoreId)],
            'name'             => [$required, 'string', 'max:160'],
            'name_arabic'      => ['sometimes', 'nullable', 'string', 'max:160'],
            'role'             => [$required, 'string', 'max:160'],
            'title'            => ['sometimes', 'nullable', 'string', 'max:200'],
            'country'          => ['sometimes', 'nullable', 'string', 'max:100'],
            'bio'              => [$required, 'string', 'max:2000'],
            'image'            => ['sometimes', 'nullable', 'string', 'max:500'],
            'specialties'      => ['sometimes', 'array'],
            'specialties.*'    => ['string', 'max:80'],
            'languages'        => ['sometimes', 'array'],
            'languages.*'      => ['string', 'max:60'],
            'tags'             => ['sometimes', 'nullable', 'array'],
            'tags.*'           => ['string', 'max:60'],
            'credentials'      => ['sometimes', 'nullable', 'string', 'max:1000'],
            'is_female'        => ['sometimes', 'boolean'],
            'years_experience' => ['sometimes', 'integer', 'min:0', 'max:80'],
            'students_count'   => ['sometimes', 'integer', 'min:0'],
            'rating'           => ['sometimes', 'numeric', 'min:0', 'max:5'],
            'reviews_count'    => ['sometimes', 'integer', 'min:0'],
            'hourly_rate'      => ['sometimes', 'integer', 'min:0'],
            'currency'         => ['sometimes', 'string', 'size:3'],
            'elite'            => ['sometimes', 'boolean'],
            'for_children'     => ['sometimes', 'boolean'],
            'free_trial'       => ['sometimes', 'boolean'],
            'courses_given'    => ['sometimes', 'integer', 'min:0'],
            'teaching_hours'   => ['sometimes', 'integer', 'min:0'],
            'quote'            => ['sometimes', 'nullable', 'string', 'max:300'],
            'about'            => ['sometimes', 'nullable', 'string', 'max:3000'],
            'teaching_style'   => ['sometimes', 'nullable', 'string', 'max:2000'],
            'strengths'        => ['sometimes', 'nullable', 'string', 'max:2000'],
            'featured'         => ['sometimes', 'boolean'],
            'sort_order'       => ['sometimes', 'integer'],
            // ── French translations (all optional; English is the fallback) ──
            'role_fr'          => ['sometimes', 'nullable', 'string', 'max:160'],
            'title_fr'         => ['sometimes', 'nullable', 'string', 'max:200'],
            'country_fr'       => ['sometimes', 'nullable', 'string', 'max:100'],
            'bio_fr'           => ['sometimes', 'nullable', 'string', 'max:2000'],
            'credentials_fr'   => ['sometimes', 'nullable', 'string', 'max:1000'],
            'quote_fr'         => ['sometimes', 'nullable', 'string', 'max:300'],
            'about_fr'         => ['sometimes', 'nullable', 'string', 'max:3000'],
            'teaching_style_fr' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'strengths_fr'     => ['sometimes', 'nullable', 'string', 'max:2000'],
            'specialties_fr'   => ['sometimes', 'nullable', 'array'],
            'specialties_fr.*' => ['string', 'max:80'],
            'languages_fr'     => ['sometimes', 'nullable', 'array'],
            'languages_fr.*'   => ['string', 'max:60'],
            'tags_fr'          => ['sometimes', 'nullable', 'array'],
            'tags_fr.*'        => ['string', 'max:60'],
        ]);
    }

    /** Slug generation lives on the model, so every write path shares it. */
    private function uniqueSlug(string $source, ?int $ignoreId = null): string
    {
        return Teacher::uniqueSlug($source, $ignoreId);
    }
}

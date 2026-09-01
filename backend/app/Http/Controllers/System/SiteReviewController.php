<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\TeacherReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Reviews across every public teacher profile.
 *
 * Per-teacher review editing lives on SiteTeacherController; this is the
 * moderation queue — one place to see everything waiting for approval without
 * opening each teacher in turn.
 */
class SiteReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'teacher_id' => ['sometimes', 'nullable', 'integer', 'exists:teachers,id'],
            'status'     => ['sometimes', 'nullable', 'in:approved,pending'],
            'rating'     => ['sometimes', 'nullable', 'integer', 'min:1', 'max:5'],
            'search'     => ['sometimes', 'nullable', 'string', 'max:120'],
            'per_page'   => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $reviews = TeacherReview::query()
            ->with('teacher:id,slug,name,image')
            ->when($filters['teacher_id'] ?? null, fn ($q, $id) => $q->where('teacher_id', $id))
            ->when(($filters['status'] ?? null) === 'approved', fn ($q) => $q->where('approved', true))
            ->when(($filters['status'] ?? null) === 'pending', fn ($q) => $q->where('approved', false))
            ->when($filters['rating'] ?? null, fn ($q, $rating) => $q->where('rating', $rating))
            ->when($filters['search'] ?? null, function ($q, $term) {
                $like = '%' . $term . '%';
                $q->where(fn ($inner) => $inner->where('author', 'like', $like)->orWhere('text', 'like', $like));
            })
            // Pending first: the queue should open on the work, not the archive.
            ->orderBy('approved')
            ->latest('id')
            ->paginate($filters['per_page'] ?? 25);

        return response()->json($reviews);
    }

    /** Counts for the header cards, unaffected by the current filters. */
    public function stats(): JsonResponse
    {
        // Aliased away from the real column names: `approved` would be run
        // through the model's boolean cast and a count of 2 would arrive as true.
        $row = TeacherReview::query()
            ->selectRaw('count(*) as total_count')
            ->selectRaw('sum(case when approved = 1 then 1 else 0 end) as approved_count')
            ->selectRaw('avg(rating) as average')
            ->first();

        $byRating = TeacherReview::query()
            ->selectRaw('rating, count(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating');

        $total    = (int) ($row->total_count ?? 0);
        $approved = (int) ($row->approved_count ?? 0);

        return response()->json([
            'data' => [
                'total'          => $total,
                'approved'       => $approved,
                'pending'        => $total - $approved,
                'average_rating' => round((float) ($row->average ?? 0), 2),
                'by_rating'      => collect(range(5, 1))
                    ->mapWithKeys(fn ($r) => [$r => (int) ($byRating[$r] ?? 0)])
                    ->all(),
            ],
        ]);
    }

    /** Approve, unapprove or delete a batch of reviews in one go. */
    public function bulk(Request $request): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', 'in:approve,unapprove,delete'],
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer', 'exists:teacher_reviews,id'],
        ]);

        $affected = DB::transaction(function () use ($data) {
            $query = TeacherReview::whereIn('id', $data['ids']);

            return match ($data['action']) {
                'approve'   => $query->update(['approved' => true]),
                'unapprove' => $query->update(['approved' => false]),
                'delete'    => $query->delete(),
            };
        });

        return response()->json(['data' => ['affected' => $affected]]);
    }
}

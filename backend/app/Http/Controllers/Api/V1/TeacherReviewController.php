<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeacherReviewResource;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Review submission from the teacher's page on the public site.
 *
 * Reviews publish immediately — there is no queue for the academy to clear
 * before a student's words appear. Control is exercised after the fact, from
 * the admin panel: an unwanted review is deleted outright, or its `approved`
 * flag is cleared to hide it while keeping the record.
 *
 * Publishing straight to a public page means the throttle and the Turnstile
 * check on this route (see routes/api.php) are the only thing between one
 * genuine review and a thousand automated ones. They are not decoration.
 */
class TeacherReviewController extends Controller
{
    public function store(Request $request, string $slug): JsonResponse
    {
        $teacher = Teacher::where('slug', $slug)->firstOrFail();

        $data = $request->validate([
            'author' => ['required', 'string', 'max:120'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'text'   => ['required', 'string', 'max:1000'],
        ]);

        // Visitor reviews all sit at 0 and are ordered newest-first by the read
        // query's tiebreaker. Sorting one above the rest with `min - 1` is what
        // this used to do, and it put -1 into an unsigned column: MySQL rejected
        // every submission with SQLSTATE[22003] out of range, so the review was
        // lost and the student got a 500. sqlite accepts a negative there, which
        // is why the suite went on passing while production could not save a
        // single review.

        $data['sort_order'] = 0;

        // Published on arrival: this is the moderation step being removed.
        $data['approved'] = true;

        $review = $teacher->reviews()->create($data);

        return response()->json(['data' => new TeacherReviewResource($review)], 201);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Site\VisitRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SiteVisitController extends Controller
{
    /**
     * Record one page view from the public site's tracking beacon.
     *
     * Analytics must never be able to break the page that reports it, so a
     * failure to write the row is logged and swallowed — the visitor still gets
     * a 204. A malformed payload is a bug in the beacon rather than a visitor's
     * problem, so that still answers 422 where it will be noticed.
     */
    public function store(Request $request, VisitRecorder $recorder): JsonResponse
    {
        $data = $request->validate([
            'path'        => ['required', 'string', 'max:2000'],
            'sessionId'   => ['required', 'string', 'max:100'],
            'locale'      => ['nullable', 'string', 'max:5'],
            'referrer'    => ['nullable', 'string', 'max:2000'],
            'utmSource'   => ['nullable', 'string', 'max:200'],
            'utmMedium'   => ['nullable', 'string', 'max:200'],
            'utmCampaign' => ['nullable', 'string', 'max:200'],
        ]);

        try {
            $recorder->record($request, $data);
        } catch (\Throwable $e) {
            Log::warning('Failed to record site visit', ['error' => $e->getMessage()]);
        }

        return response()->json(null, 204);
    }
}

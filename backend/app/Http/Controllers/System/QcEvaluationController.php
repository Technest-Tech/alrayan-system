<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Qc\StoreEvaluationRequest;
use App\Http\Requests\System\Qc\UpdateEvaluationRequest;
use App\Http\Resources\System\QcEvaluationDetailResource;
use App\Http\Resources\System\QcEvaluationResource;
use App\Models\System\QcEvaluation;
use App\Services\System\QcScorer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class QcEvaluationController extends Controller
{
    public function __construct(private QcScorer $scorer) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', QcEvaluation::class);

        $evaluations = QueryBuilder::for(QcEvaluation::class)
            ->allowedFilters($this->filters())
            ->allowedSorts(['evaluated_at', 'score', 'duration_minutes', 'created_at'])
            ->defaultSort('-evaluated_at')
            ->with(['teacher.user', 'student', 'qualityManager'])
            ->paginate($request->integer('per_page', 50))
            ->appends($request->query());

        // Totals across the whole filtered set (not just the current page).
        $count    = QueryBuilder::for(QcEvaluation::class)->allowedFilters($this->filters())->count();
        $duration = (int) QueryBuilder::for(QcEvaluation::class)->allowedFilters($this->filters())->sum('duration_minutes');

        return QcEvaluationResource::collection($evaluations)->additional([
            'summary' => [
                'count'                  => $count,
                'total_duration_minutes' => $duration,
            ],
        ]);
    }

    public function show(QcEvaluation $qcEvaluation): QcEvaluationDetailResource
    {
        $this->authorize('view', $qcEvaluation);
        $qcEvaluation->load(['teacher.user', 'student', 'qualityManager', 'items']);
        return new QcEvaluationDetailResource($qcEvaluation);
    }

    public function store(StoreEvaluationRequest $request): JsonResponse
    {
        $this->authorize('create', QcEvaluation::class);

        $data   = $request->validated();
        $result = $this->scorer->build($data['checked_item_ids'] ?? []);

        $evaluation = DB::transaction(function () use ($data, $result, $request) {
            $evaluation = QcEvaluation::create([
                'teacher_id'         => $data['teacher_id'],
                'student_id'         => $data['student_id'],
                'quality_manager_id' => $data['quality_manager_id'] ?? $request->user()->id,
                'duration_minutes'   => $data['duration_minutes'],
                'general_notes'      => $data['general_notes'] ?? null,
                'evaluated_at'       => $data['evaluated_at'] ?? now(),
                'score'              => $result['score'],
            ]);

            foreach ($result['items'] as $row) {
                $evaluation->items()->create($row);
            }

            return $evaluation;
        });

        return (new QcEvaluationDetailResource(
            $evaluation->fresh(['teacher.user', 'student', 'qualityManager', 'items'])
        ))->response()->setStatusCode(201);
    }

    public function update(UpdateEvaluationRequest $request, QcEvaluation $qcEvaluation): QcEvaluationDetailResource
    {
        $this->authorize('update', $qcEvaluation);

        $data = $request->validated();

        DB::transaction(function () use ($data, $qcEvaluation) {
            if (array_key_exists('checked_item_ids', $data)) {
                $result = $this->scorer->build($data['checked_item_ids']);
                $qcEvaluation->items()->delete();
                foreach ($result['items'] as $row) {
                    $qcEvaluation->items()->create($row);
                }
                $data['score'] = $result['score'];
                unset($data['checked_item_ids']);
            }

            if (! empty($data)) {
                $qcEvaluation->update($data);
            }
        });

        return new QcEvaluationDetailResource(
            $qcEvaluation->fresh(['teacher.user', 'student', 'qualityManager', 'items'])
        );
    }

    public function destroy(QcEvaluation $qcEvaluation): JsonResponse
    {
        $this->authorize('delete', $qcEvaluation);
        $qcEvaluation->delete();
        return response()->json(['message' => 'Evaluation deleted.']);
    }

    /** @return array<int, AllowedFilter> */
    private function filters(): array
    {
        return [
            AllowedFilter::exact('quality_manager_id'),
            AllowedFilter::exact('teacher_id'),
            AllowedFilter::exact('student_id'),
            AllowedFilter::callback('min_score', fn ($q, $v) => $q->where('score', '>=', $v)),
            AllowedFilter::callback('max_score', fn ($q, $v) => $q->where('score', '<=', $v)),
            AllowedFilter::callback('from_date', fn ($q, $v) => $q->whereDate('evaluated_at', '>=', $v)),
            AllowedFilter::callback('to_date',   fn ($q, $v) => $q->whereDate('evaluated_at', '<=', $v)),
        ];
    }
}

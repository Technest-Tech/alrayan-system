<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Lead\AssignLeadRequest;
use App\Http\Requests\System\Lead\BulkAssignRequest;
use App\Http\Requests\System\Lead\ConvertLeadRequest;
use App\Http\Requests\System\Lead\MarkLostRequest;
use App\Http\Requests\System\Lead\StoreLeadRequest;
use App\Http\Requests\System\Lead\UpdateLeadRequest;
use App\Http\Resources\System\LeadDetailResource;
use App\Http\Resources\System\LeadResource;
use App\Http\Resources\System\StudentDetailResource;
use App\Models\System\Lead;
use App\Services\System\LeadPipelineService;
use App\Services\System\LeadToStudentConverter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class LeadController extends Controller
{
    public function __construct(
        private LeadPipelineService $pipeline,
        private LeadToStudentConverter $converter,
    ) {}

    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('viewAny', Lead::class);

        $leads = QueryBuilder::for(Lead::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('source'),
                AllowedFilter::exact('platform'),
                AllowedFilter::exact('priority'),
                AllowedFilter::exact('assigned_supervisor_id'),
                AllowedFilter::exact('course_interest_id'),
                AllowedFilter::scope('q', 'search'),
                AllowedFilter::callback('from_date', fn($q, $v) => $q->whereDate('created_at', '>=', $v)),
                AllowedFilter::callback('to_date',   fn($q, $v) => $q->whereDate('created_at', '<=', $v)),
            ])
            ->allowedSorts(['created_at', 'updated_at', 'name'])
            ->defaultSort('-created_at')
            ->with(['courseInterest', 'supervisor'])
            ->withCount(['followUps', 'followUps as pending_follow_ups_count' => fn($q) => $q->whereNull('completed_at')])
            ->paginate($request->integer('per_page', 50));

        return LeadResource::collection($leads);
    }

    public function show(Lead $lead): LeadDetailResource
    {
        $this->authorize('view', $lead);
        $lead->load(['supervisor', 'courseInterest', 'followUps.actor', 'trialBooking', 'convertedToStudent', 'activities.causer']);
        return new LeadDetailResource($lead);
    }

    public function store(StoreLeadRequest $request): LeadDetailResource
    {
        $this->authorize('create', Lead::class);
        $lead = Lead::create($request->validated());
        $lead->refresh();
        return new LeadDetailResource($lead);
    }

    public function update(UpdateLeadRequest $request, Lead $lead): LeadDetailResource
    {
        $this->authorize('update', $lead);

        $data = $request->validated();

        if (isset($data['status'])) {
            $this->pipeline->transition($lead, $data['status'], $request->user());
            unset($data['status']);
        }

        $lead->update($data);
        return new LeadDetailResource($lead->fresh(['supervisor', 'courseInterest', 'followUps']));
    }

    public function assign(AssignLeadRequest $request, Lead $lead): LeadDetailResource
    {
        $this->authorize('assign', $lead);
        $lead->update(['assigned_supervisor_id' => $request->supervisor_id]);
        return new LeadDetailResource($lead->fresh('supervisor'));
    }

    public function convert(ConvertLeadRequest $request, Lead $lead): JsonResponse
    {
        $this->authorize('convert', $lead);

        if ($lead->status === 'closed') {
            return response()->json(['message' => 'Lead is already converted.'], 422);
        }

        $student = $this->converter->convert($lead, $request->validated());

        return response()->json([
            'message'    => 'Lead converted to student.',
            'student_id' => $student->id,
        ]);
    }

    public function markLost(MarkLostRequest $request, Lead $lead): LeadDetailResource
    {
        $this->authorize('markLost', $lead);
        $this->pipeline->transition($lead, 'lost', $request->user(), $request->validated());
        return new LeadDetailResource($lead->fresh());
    }

    public function bulkAssign(BulkAssignRequest $request): JsonResponse
    {
        $this->authorize('assign', Lead::class);
        Lead::whereIn('id', $request->lead_ids)->update(['assigned_supervisor_id' => $request->supervisor_id]);
        return response()->json(['message' => count($request->lead_ids) . ' leads assigned.']);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $this->authorize('delete', $lead);
        $lead->delete();
        return response()->json(['message' => 'Lead deleted.']);
    }
}

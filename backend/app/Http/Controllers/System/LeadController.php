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
use App\Services\System\StudentCreator;
use App\Support\System\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class LeadController extends Controller
{
    public function __construct(
        private LeadPipelineService $pipeline,
        private LeadToStudentConverter $converter,
        private StudentCreator $studentCreator,
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
            ->with(['courseInterest', 'supervisor', 'student'])
            ->withCount(['followUps', 'followUps as pending_follow_ups_count' => fn($q) => $q->whereNull('completed_at')])
            ->paginate($request->integer('per_page', 50));

        return LeadResource::collection($leads);
    }

    public function show(Lead $lead): LeadDetailResource
    {
        $this->authorize('view', $lead);
        $lead->load(['supervisor', 'courseInterest', 'followUps.actor', 'trialBooking', 'convertedToStudent', 'student', 'activities.causer']);
        return new LeadDetailResource($lead);
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $this->authorize('create', Lead::class);

        $data = $request->validated();
        // assigned_teacher_id isn't a lead column — it flows onto the provisioned student.
        $teacherId = $data['assigned_teacher_id'] ?? null;
        unset($data['assigned_teacher_id']);

        $lead = DB::transaction(function () use ($data, $teacherId, $request) {
            $lead = Lead::create($data);

            // Every new lead is provisioned as a real student (+ user, role=student) up front,
            // with NO payment/package details yet. Payment is finalised later on close/convert.
            $student = $this->studentCreator->create([
                'name'                => $lead->name,
                'email'               => $lead->email,
                'whatsapp'            => $lead->whatsapp ?? $lead->phone,
                'gender'              => $lead->gender,
                'country'             => $lead->country,
                'timezone'            => Setting::get('academy.default_timezone', 'UTC'),
                'student_type'        => 'adult',
                'source'              => 'lead',
                'assigned_teacher_id' => $teacherId,
            ], $request->user()?->id);

            $leadUpdates = ['student_id' => $student->id];
            // Assigning a teacher up front means the lead is ready for its trial lesson.
            // (status is null in-memory right after create when not supplied → defaults to new_lead.)
            $currentStatus = $lead->status ?? 'new_lead';
            if ($teacherId && in_array($currentStatus, ['new_lead', 'interested'], true)) {
                $leadUpdates['status'] = 'waiting_for_trial';
            }
            $lead->update($leadUpdates);

            return $lead->refresh();
        });

        return (new LeadDetailResource($lead->load(['supervisor', 'courseInterest', 'student'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateLeadRequest $request, Lead $lead): LeadDetailResource
    {
        $this->authorize('update', $lead);

        $data = $request->validated();

        if (isset($data['status'])) {
            $this->pipeline->transition($lead, $data['status'], $request->user());
            unset($data['status']);
        }

        // assigned_teacher_id isn't a lead column — propagate any (re)assignment to the
        // linked student so it stays filterable by teacher in the calendar.
        if (array_key_exists('assigned_teacher_id', $data)) {
            $teacherId = $data['assigned_teacher_id'];
            unset($data['assigned_teacher_id']);
            if ($teacherId && $lead->student) {
                $lead->student->update(['assigned_teacher_id' => $teacherId]);
            }
            // Assigning a teacher advances an early-stage lead to "waiting for trial".
            if ($teacherId && in_array($lead->status, ['new_lead', 'interested'], true)) {
                $lead->update(['status' => 'waiting_for_trial']);
            }
        }

        $lead->update($data);
        return new LeadDetailResource($lead->fresh(['supervisor', 'courseInterest', 'followUps', 'student']));
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

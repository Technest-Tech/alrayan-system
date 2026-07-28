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
use App\Models\User;
use App\Services\System\LeadPipelineService;
use App\Services\System\LeadToStudentConverter;
use App\Services\System\StudentCreator;
use App\Services\System\UserProvisioner;
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
        private UserProvisioner $provisioner,
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

        // The status is applied last and only through the pipeline — writing it as a plain
        // field would skip the transition rules.
        $status = $data['status'] ?? null;
        unset($data['status']);

        // assigned_teacher_id isn't a lead column — it lives on the linked student.
        $teacherTouched = array_key_exists('assigned_teacher_id', $data);
        $teacherId      = $data['assigned_teacher_id'] ?? null;
        unset($data['assigned_teacher_id']);

        DB::transaction(function () use ($lead, $data, $status, $teacherId, $teacherTouched, $request) {
            $lead->update($data);

            if ($teacherTouched) {
                // Propagate the (re)assignment to the linked student so it stays filterable
                // by teacher in the calendar. A null clears the assignment.
                $lead->student?->update(['assigned_teacher_id' => $teacherId]);

                // Assigning a teacher advances an early-stage lead to "waiting for trial" —
                // unless the same edit picked a status of its own, which always wins.
                if ($teacherId && $status === null && in_array($lead->status, ['new_lead', 'interested'], true)) {
                    $status = 'waiting_for_trial';
                }
            }

            // Re-saving a lead on the status it already has is a no-op, not a transition.
            // Without this, editing any closed or lost lead would be rejected outright —
            // the edit form always posts the status it loaded.
            if ($status !== null && $status !== $lead->status) {
                $this->pipeline->transition($lead, $status, $request->user(), $this->transitionExtra($lead, $status));
            }

            $this->mirrorIdentityToStudent($lead, $data);
        });

        return new LeadDetailResource($lead->fresh(['supervisor', 'courseInterest', 'followUps', 'student']));
    }

    /**
     * Extra attributes the pipeline needs to complete a transition.
     *
     * Marking a lead lost requires a reason, but the edit form collects one as
     * `rejection_reason` (a slightly different vocabulary). Map it onto the lost_reason
     * enum instead of failing the whole save on a field the form never asked for.
     *
     * @return array<string,mixed>
     */
    private function transitionExtra(Lead $lead, string $status): array
    {
        if ($status !== 'lost') {
            return [];
        }

        $fromRejection = [
            'price'          => 'price',
            'schedule'       => 'schedule',
            'no_response'    => 'no_response',
            'not_interested' => 'other',
            'other'          => 'other',
        ];

        return [
            'lost_reason' => $lead->lost_reason
                ?? ($fromRejection[$lead->rejection_reason] ?? 'other'),
        ];
    }

    /**
     * A lead provisions a real student (+ `users` identity row) the moment it is created, and
     * the rest of the system reads THAT record — the user directory, the calendar, the WhatsApp
     * lesson report. An edit that only touched sys_leads would never surface there, so mirror
     * the fields the two records share — and only the ones this request actually sent.
     *
     * @param  array<string,mixed>  $data  The validated payload, minus status/teacher.
     */
    private function mirrorIdentityToStudent(Lead $lead, array $data): void
    {
        $student = $lead->student;

        if (! $student) {
            return;
        }

        $profile  = [];   // sys_students columns
        $identity = [];   // users columns, via the provisioner

        if (array_key_exists('name', $data) && $lead->name) {
            $profile['name'] = $identity['name'] = $lead->name;
        }

        if (array_key_exists('country', $data) && $lead->country) {
            $profile['country'] = $lead->country;
        }

        if (array_key_exists('gender', $data)) {
            $identity['gender'] = $lead->gender;
        }

        // Every WhatsApp send reads the student's number, so keep it on the lead's primary
        // contact — but never blank it, which would cut the student off from their reports.
        $contactTouched = array_key_exists('phone', $data)
            || array_key_exists('whatsapp', $data)
            || array_key_exists('payload', $data);

        if ($contactTouched && ($number = $lead->whatsapp ?: $lead->phone)) {
            $profile['whatsapp'] = $identity['whatsapp'] = $number;
        }

        // users.email is unique — an address shared with another person must not blow up
        // an otherwise valid lead edit.
        $emailIsFree = $lead->email
            && ! User::where('email', $lead->email)->whereKeyNot($student->user_id)->exists();

        if (array_key_exists('email', $data) && $emailIsFree) {
            $profile['email'] = $identity['email'] = $lead->email;
        }

        // The form's extra addresses/numbers become the identity's contact rows. Emails only
        // ride along when the primary above was safe to set: the provisioner replaces the whole
        // list, and it would otherwise promote a duplicate address to primary.
        if (array_key_exists('payload', $data)) {
            if ($emailIsFree && $rows = $this->contactRows(data_get($lead->payload, 'emails', []), 'email')) {
                $identity['emails'] = $rows;
            }
            if ($rows = $this->contactRows(data_get($lead->payload, 'phones', []), 'phone')) {
                $identity['phones'] = $rows;
            }
        }

        if ($profile) {
            $student->update($profile);
        }

        if ($identity && $student->user) {
            $this->provisioner->update($student->user, $identity);
        }
    }

    /**
     * The lead form stores contacts as {value, primary}; the provisioner wants {email|phone, is_primary}.
     *
     * @param  mixed  $entries
     * @return array<int,array<string,mixed>>
     */
    private function contactRows($entries, string $key): array
    {
        if (! is_array($entries)) {
            return [];
        }

        return collect($entries)
            ->filter(fn ($e) => is_array($e) && ! empty($e['value']))
            ->map(fn ($e) => [$key => $e['value'], 'is_primary' => (bool) ($e['primary'] ?? false)])
            ->values()
            ->all();
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

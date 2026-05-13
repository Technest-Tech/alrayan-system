<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\LeadFollowUp\CompleteFollowUpRequest;
use App\Http\Requests\System\LeadFollowUp\StoreFollowUpRequest;
use App\Http\Requests\System\LeadFollowUp\UpdateFollowUpRequest;
use App\Http\Resources\System\LeadFollowUpResource;
use App\Models\System\Lead;
use App\Models\System\LeadFollowUp;
use Illuminate\Http\JsonResponse;

class LeadFollowUpController extends Controller
{
    public function index(Lead $lead): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('view', $lead);
        return LeadFollowUpResource::collection($lead->followUps()->with('actor')->get());
    }

    public function store(StoreFollowUpRequest $request, Lead $lead): LeadFollowUpResource
    {
        $this->authorize('view', $lead);

        $followUp = $lead->followUps()->create(array_merge(
            $request->validated(),
            ['actor_user_id' => $request->user()->id]
        ));

        return new LeadFollowUpResource($followUp->load('actor'));
    }

    public function update(UpdateFollowUpRequest $request, LeadFollowUp $leadFollowUp): LeadFollowUpResource
    {
        $this->authorize('view', $leadFollowUp->lead);
        $leadFollowUp->update($request->validated());
        return new LeadFollowUpResource($leadFollowUp->fresh('actor'));
    }

    public function complete(CompleteFollowUpRequest $request, LeadFollowUp $leadFollowUp): LeadFollowUpResource
    {
        $this->authorize('view', $leadFollowUp->lead);
        $leadFollowUp->update([
            'completed_at'     => now(),
            'completion_notes' => $request->completion_notes,
        ]);
        return new LeadFollowUpResource($leadFollowUp->fresh('actor'));
    }

    public function destroy(LeadFollowUp $leadFollowUp): JsonResponse
    {
        $this->authorize('view', $leadFollowUp->lead);
        $leadFollowUp->delete();
        return response()->json(['message' => 'Follow-up deleted.']);
    }
}

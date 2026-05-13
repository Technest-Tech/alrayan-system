<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\WhatsAppGroup\StoreWhatsAppGroupRequest;
use App\Http\Requests\System\WhatsAppGroup\UpdateWhatsAppGroupRequest;
use App\Http\Resources\System\WhatsAppGroupResource;
use App\Models\System\Student;
use App\Models\System\Teacher;
use App\Models\System\WhatsAppGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class WhatsAppGroupController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('viewAny', WhatsAppGroup::class);

        $groups = QueryBuilder::for(WhatsAppGroup::class)
            ->allowedFilters([
                AllowedFilter::exact('type'),
                AllowedFilter::exact('status'),
            ])
            ->with(['linkedStudent', 'linkedTeacher.user'])
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 50));

        return WhatsAppGroupResource::collection($groups);
    }

    public function show(WhatsAppGroup $whatsappGroup): WhatsAppGroupResource
    {
        $this->authorize('view', $whatsappGroup);
        $whatsappGroup->load(['linkedStudent', 'linkedTeacher.user', 'createdBy']);
        return new WhatsAppGroupResource($whatsappGroup);
    }

    public function store(StoreWhatsAppGroupRequest $request): WhatsAppGroupResource
    {
        $this->authorize('create', WhatsAppGroup::class);

        $group = WhatsAppGroup::create(array_merge(
            $request->validated(),
            ['created_by_user_id' => $request->user()->id]
        ));

        // Link the FK on the related model
        if ($group->linked_student_id) {
            Student::where('id', $group->linked_student_id)->update(['whatsapp_group_id' => $group->id]);
        }
        if ($group->linked_teacher_id) {
            Teacher::where('id', $group->linked_teacher_id)->update(['whatsapp_group_id' => $group->id]);
        }

        return new WhatsAppGroupResource($group->load(['linkedStudent', 'linkedTeacher.user']));
    }

    public function update(UpdateWhatsAppGroupRequest $request, WhatsAppGroup $whatsappGroup): WhatsAppGroupResource
    {
        $this->authorize('update', $whatsappGroup);
        $whatsappGroup->update($request->validated());
        return new WhatsAppGroupResource($whatsappGroup->fresh(['linkedStudent', 'linkedTeacher.user']));
    }

    public function stop(WhatsAppGroup $whatsappGroup): WhatsAppGroupResource
    {
        $this->authorize('stop', $whatsappGroup);
        $whatsappGroup->update(['status' => 'stopped']);
        return new WhatsAppGroupResource($whatsappGroup->fresh());
    }

    public function reactivate(WhatsAppGroup $whatsappGroup): WhatsAppGroupResource
    {
        $this->authorize('reactivate', $whatsappGroup);
        $whatsappGroup->update(['status' => 'active']);
        return new WhatsAppGroupResource($whatsappGroup->fresh());
    }
}

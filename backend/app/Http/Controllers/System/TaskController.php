<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Task\AssignTaskRequest;
use App\Http\Requests\System\Task\DecisionRequest;
use App\Http\Requests\System\Task\PostponeTaskRequest;
use App\Http\Requests\System\Task\StoreTaskNoteRequest;
use App\Http\Requests\System\Task\StoreTaskRequest;
use App\Http\Requests\System\Task\UpdateTaskRequest;
use App\Http\Resources\System\TaskDetailResource;
use App\Http\Resources\System\TaskResource;
use App\Models\System\Task;
use App\Services\System\TaskActionService;
use App\Services\System\TaskStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TaskController extends Controller
{
    public function __construct(
        private TaskStatusService $status,
        private TaskActionService $actions,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Task::class);

        $roles = $request->user()->getRoleNames()->all();

        $tasks = QueryBuilder::for(Task::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('priority'),
                AllowedFilter::exact('assignee_role'),
                AllowedFilter::exact('student_id'),
                AllowedFilter::exact('teacher_id'),
                AllowedFilter::callback('mine', fn ($q, $v) => filter_var($v, FILTER_VALIDATE_BOOLEAN)
                    ? $q->whereIn('assignee_role', $roles)
                    : $q),
                AllowedFilter::callback('q', fn ($q, $v) => $q->where('title', 'like', '%' . $v . '%')),
                AllowedFilter::callback('from_date', fn ($q, $v) => $q->whereDate('created_at', '>=', $v)),
                AllowedFilter::callback('to_date',   fn ($q, $v) => $q->whereDate('created_at', '<=', $v)),
            ])
            ->allowedSorts(['created_at', 'updated_at', 'due_at', 'priority'])
            ->defaultSort('-created_at')
            ->with(['student', 'teacher.user', 'assignee'])
            ->paginate($request->integer('per_page', 50));

        return TaskResource::collection($tasks);
    }

    public function show(Task $task): TaskDetailResource
    {
        $this->authorize('view', $task);
        $task->load(['student', 'teacher.user', 'assignee', 'creator', 'decider', 'notes.actor', 'activities.causer']);
        return new TaskDetailResource($task);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $this->authorize('create', Task::class);

        $data = $request->validated();
        $data['type']       ??= 'manual_task';
        $data['priority']   ??= 'medium';
        $data['status']     ??= 'new';
        $data['created_by']   = $request->user()->id;

        $task = Task::create($data);

        return (new TaskDetailResource($task->fresh(['student', 'teacher.user', 'assignee', 'creator'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateTaskRequest $request, Task $task): TaskDetailResource
    {
        $this->authorize('update', $task);

        $data = $request->validated();

        if (isset($data['status'])) {
            $this->status->transition($task, $data['status'], $request->user());
            unset($data['status']);
        }

        if (!empty($data)) {
            $task->update($data);
        }

        return new TaskDetailResource($task->fresh(['student', 'teacher.user', 'assignee', 'creator']));
    }

    public function assign(AssignTaskRequest $request, Task $task): TaskDetailResource
    {
        $this->authorize('assign', $task);
        $task->update($request->validated());
        return new TaskDetailResource($task->fresh(['assignee']));
    }

    public function approve(DecisionRequest $request, Task $task): TaskDetailResource
    {
        $this->authorize('approve', $task);
        $task = $this->actions->approve($task, $request->user(), $request->input('notes'));
        return new TaskDetailResource($task->fresh(['student', 'teacher.user', 'decider']));
    }

    public function reject(DecisionRequest $request, Task $task): TaskDetailResource
    {
        $this->authorize('reject', $task);
        $task = $this->actions->reject($task, $request->user(), $request->input('notes'));
        return new TaskDetailResource($task->fresh(['student', 'teacher.user', 'decider']));
    }

    public function postpone(PostponeTaskRequest $request, Task $task): TaskDetailResource
    {
        $this->authorize('update', $task);
        $task->update(array_filter([
            'status' => 'postponed',
            'due_at' => $request->input('due_at'),
        ], fn ($v) => $v !== null));
        return new TaskDetailResource($task->fresh());
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);
        $task->delete();
        return response()->json(['message' => 'Task deleted.']);
    }

    public function notesIndex(Task $task): JsonResponse
    {
        $this->authorize('view', $task);
        $notes = $task->notes()->with('actor')->get()->map(fn ($n) => [
            'id'         => $n->id,
            'body'       => $n->body,
            'actor_name' => $n->actor?->name,
            'created_at' => $n->created_at?->toISOString(),
        ]);
        return response()->json(['data' => $notes]);
    }

    public function notesStore(StoreTaskNoteRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);
        $note = $task->notes()->create([
            'body'          => $request->body,
            'actor_user_id' => $request->user()->id,
        ]);
        return response()->json([
            'data' => [
                'id'         => $note->id,
                'body'       => $note->body,
                'actor_name' => $request->user()->name,
                'created_at' => $note->created_at?->toISOString(),
            ],
        ], 201);
    }
}

<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Note\StoreNoteRequest;
use App\Http\Requests\System\Note\UpdateNoteRequest;
use App\Http\Resources\System\StudentNoteResource;
use App\Models\System\Student;
use App\Models\System\StudentNote;

class StudentNoteController extends Controller
{
    public function index(Student $student): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('view', $student);

        $includeTrashed = request()->boolean('include_trashed') && auth()->user()->role === 'admin';

        $notes = $student->notes()
            ->with('author')
            ->when($includeTrashed, fn($q) => $q->withTrashed())
            ->orderByDesc('pinned')
            ->orderByDesc('created_at')
            ->paginate(50);

        return StudentNoteResource::collection($notes);
    }

    public function store(StoreNoteRequest $request, Student $student): StudentNoteResource
    {
        $this->authorize('create', StudentNote::class);

        $note = StudentNote::create([
            'student_id'     => $student->id,
            'author_user_id' => auth()->id(),
            'body'           => $request->body,
            'note_type'      => $request->input('note_type', 'general'),
            'pinned'         => $request->boolean('pinned', false),
        ]);

        app(\App\Services\System\StudentTimelineRecorder::class)
            ->record($student, 'note_added', ['note_id' => $note->id]);

        return new StudentNoteResource($note->load('author'));
    }

    public function update(UpdateNoteRequest $request, StudentNote $note): StudentNoteResource
    {
        $this->authorize('update', $note);

        $note->update(array_filter([
            'body'      => $request->body,
            'note_type' => $request->note_type,
            'pinned'    => $request->has('pinned') ? $request->boolean('pinned') : null,
        ], fn($v) => $v !== null));

        return new StudentNoteResource($note->load('author'));
    }

    public function destroy(StudentNote $note): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $note);
        $note->delete();

        return response()->json(['deleted' => true]);
    }
}

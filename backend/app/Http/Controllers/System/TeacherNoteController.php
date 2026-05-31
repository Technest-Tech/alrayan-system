<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\Note\StoreNoteRequest;
use App\Http\Requests\System\Note\UpdateNoteRequest;
use App\Http\Resources\System\TeacherNoteResource;
use App\Models\System\Teacher;
use App\Models\System\TeacherNote;
use Illuminate\Http\Request;

class TeacherNoteController extends Controller
{
    public function index(Teacher $teacher): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('view', $teacher);

        $includeTrashed = request()->boolean('include_trashed') && auth()->user()->role === 'admin';

        $notes = $teacher->notes()
            ->with('author')
            ->when($includeTrashed, fn($q) => $q->withTrashed())
            ->paginate(25);

        return TeacherNoteResource::collection($notes);
    }

    public function store(StoreNoteRequest $request, Teacher $teacher): TeacherNoteResource
    {
        $this->authorize('create', TeacherNote::class);

        $note = TeacherNote::create([
            'teacher_id'     => $teacher->id,
            'author_user_id' => auth()->id(),
            'body'           => $request->body,
            'note_type'      => $request->input('note_type', 'general'),
            'pinned'         => $request->boolean('pinned', false),
        ]);

        return new TeacherNoteResource($note->load('author'));
    }

    public function update(UpdateNoteRequest $request, TeacherNote $note): TeacherNoteResource
    {
        $this->authorize('update', $note);
        $note->update(array_filter([
            'body'      => $request->body,
            'note_type' => $request->note_type,
            'pinned'    => $request->has('pinned') ? $request->boolean('pinned') : null,
        ], fn($v) => $v !== null));

        return new TeacherNoteResource($note->load('author'));
    }

    public function destroy(TeacherNote $note): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $note);
        $note->delete();

        return response()->json(['deleted' => true]);
    }
}

<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\GuardianResource;
use App\Models\System\Guardian;
use Illuminate\Http\Request;

class GuardianController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('viewAny', \App\Models\System\Student::class);

        $query = Guardian::with('students');

        if ($wa = $request->query('whatsapp')) {
            $query->where('whatsapp', 'like', '%' . $wa . '%');
        }

        $guardians = $query->limit(10)->get();

        return GuardianResource::collection($guardians);
    }

    public function store(Request $request): GuardianResource
    {
        $this->authorize('create', \App\Models\System\Student::class);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'whatsapp' => ['nullable', 'string', 'max:64'],
        ]);

        $guardian = Guardian::create($data);
        $guardian->load('students');

        return new GuardianResource($guardian);
    }
}

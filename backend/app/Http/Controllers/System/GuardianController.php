<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\GuardianResource;
use App\Models\System\Guardian;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GuardianController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $guardians = Guardian::query()
            ->when($request->whatsapp, fn($q) =>
                $q->where('whatsapp', 'like', '%' . $request->whatsapp . '%')
            )
            ->with(['students:id,name,status,guardian_id'])
            ->limit(10)
            ->get();

        return GuardianResource::collection($guardians);
    }

    public function store(Request $request): GuardianResource
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'whatsapp' => ['required', 'string', 'max:32'],
        ]);

        $guardian = Guardian::create($request->only('name', 'whatsapp'));

        return new GuardianResource($guardian->load('students'));
    }
}

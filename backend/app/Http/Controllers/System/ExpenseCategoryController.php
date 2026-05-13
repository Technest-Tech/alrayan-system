<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ExpenseCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = ExpenseCategory::orderBy('name')->get();
        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $slug = Str::slug($data['name']);

        if (ExpenseCategory::where('slug', $slug)->exists()) {
            throw ValidationException::withMessages(['name' => 'A category with this name already exists.']);
        }

        $category = ExpenseCategory::create([
            'name'       => $data['name'],
            'slug'       => $slug,
            'is_default' => false,
            'is_active'  => true,
        ]);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = ExpenseCategory::findOrFail($id);
        $data = $request->validate([
            'name'      => ['sometimes', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);
        return response()->json(['data' => $category]);
    }

    public function deactivate(int $id): JsonResponse
    {
        $category = ExpenseCategory::findOrFail($id);
        $category->update(['is_active' => false]);
        return response()->json(['data' => $category]);
    }
}

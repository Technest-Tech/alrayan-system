<?php

namespace App\Support\System;

use App\Models\Course;
use Illuminate\Support\Collection;

/**
 * Resolves lesson subject ids (course ids) to names.
 *
 * Bound as a scoped singleton so a list of 200 lessons costs one `courses` query
 * for the whole request instead of one per lesson.
 */
class SubjectCatalog
{
    /** @var Collection<int, string>|null id => name, loaded on first use. */
    private ?Collection $names = null;

    /** @return Collection<int, string> */
    public function all(): Collection
    {
        return $this->names ??= Course::orderBy('sort_order')->pluck('title', 'id');
    }

    public function name(int|string $id): ?string
    {
        return $this->all()[(int) $id] ?? null;
    }

    /**
     * Expand stored ids into {id, name} pairs, dropping ids whose course is gone.
     *
     * @param  array<int, int|string>|null  $ids
     * @return array<int, array{id: int, name: string}>
     */
    public function expand(?array $ids): array
    {
        $out = [];
        foreach ($ids ?? [] as $id) {
            if ($name = $this->name($id)) {
                $out[] = ['id' => (int) $id, 'name' => $name];
            }
        }

        return $out;
    }

    /** Human-readable joined list, e.g. "Tajweed Course, Tafseer". Null when empty. */
    public function label(?array $ids, string $separator = ', '): ?string
    {
        $names = array_column($this->expand($ids), 'name');

        return $names ? implode($separator, $names) : null;
    }
}

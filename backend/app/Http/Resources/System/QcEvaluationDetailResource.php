<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class QcEvaluationDetailResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                   => $this->id,
            'teacher_id'           => $this->teacher_id,
            'teacher_name'         => $this->whenLoaded('teacher', fn () => $this->teacher?->user?->name),
            'student_id'           => $this->student_id,
            'student_name'         => $this->whenLoaded('student', fn () => $this->student?->name),
            'quality_manager_id'   => $this->quality_manager_id,
            'quality_manager_name' => $this->whenLoaded('qualityManager', fn () => $this->qualityManager?->name),
            'duration_minutes'     => (int) $this->duration_minutes,
            'score'                => (float) $this->score,
            'general_notes'        => $this->general_notes,
            'evaluated_at'         => $this->evaluated_at?->toISOString(),
            'created_at'           => $this->created_at?->toISOString(),
            'updated_at'           => $this->updated_at?->toISOString(),
            'items'                => $this->whenLoaded('items', fn () => $this->items->map(fn ($i) => [
                'id'               => $i->id,
                'category_item_id' => $i->category_item_id,
                'category_name'    => $i->category_name,
                'item_label'       => $i->item_label,
                'penalty'          => (int) $i->penalty,
                'special_rule_key' => $i->special_rule_key,
                'checked'          => (bool) $i->checked,
            ])->values()),
            // ids of the ticked items, for pre-populating the edit modal's checklist
            'checked_item_ids'     => $this->whenLoaded('items', fn () => $this->items
                ->where('checked', true)
                ->pluck('category_item_id')
                ->filter()
                ->values()),
        ];
    }
}

<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Resources\Json\JsonResource;

class QcCategoryResource extends JsonResource
{
    public function toArray($request): array
    {
        $items = $this->whenLoaded('items');

        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'weight'        => $this->weight,
            'sort_order'    => $this->sort_order,
            'is_active'     => (bool) $this->is_active,
            'items'         => QcCategoryItemResource::collection($items),
            'items_count'   => $this->whenLoaded('items', fn () => $this->items->count()),
            'penalties_sum' => $this->whenLoaded('items', fn () => (int) $this->items->sum('penalty')),
            'created_at'    => $this->created_at?->toISOString(),
            'updated_at'    => $this->updated_at?->toISOString(),
        ];
    }
}

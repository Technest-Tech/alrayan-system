<?php

namespace App\Http\Resources\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return array_merge((new SessionResource($this->resource))->toArray($request), [
            'zoom_start_url' => $this->zoom_start_url,
            'pattern'        => $this->whenLoaded('pattern', fn () =>
                $this->pattern ? new SchedulePatternResource($this->pattern) : null
            ),
            'original_session' => $this->whenLoaded('originalSession', fn () =>
                $this->originalSession ? new SessionResource($this->originalSession) : null
            ),
        ]);
    }
}

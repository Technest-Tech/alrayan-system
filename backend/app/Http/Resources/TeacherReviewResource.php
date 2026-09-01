<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $fr = $request->query('locale') === 'fr';

        return [
            'id'     => $this->id,
            'author' => $this->author,
            'rating' => $this->rating,
            'text'   => $fr && filled($this->text_fr) ? $this->text_fr : $this->text,
        ];
    }
}

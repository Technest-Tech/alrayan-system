<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serializes a public marketing Teacher for the site API. When the request
 * carries `?locale=fr`, French (`*_fr`) values are used wherever they are
 * present, falling back to English so a field is never blank. Field NAMES stay
 * the same in both locales, so the Next.js consumer needs no per-locale mapping.
 */
class TeacherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $fr = $request->query('locale') === 'fr';

        // Pick the French value when requested and non-empty, else English.
        $t = fn (string $en, string $frCol) => $fr && filled($this->{$frCol})
            ? $this->{$frCol}
            : $this->{$en};

        // `title` is the hook shown under the teacher's name, and it is the one
        // field an admin routinely saves without a French version. Falling back
        // to the English string would print English on the French site, so try
        // the translated role first — that one is always filled. English stays
        // the last resort rather than the first.
        $title = $fr && blank($this->title_fr) && filled($this->role_fr)
            ? $this->role_fr
            : $t('title', 'title_fr');

        return [
            'id'               => $this->id,
            'slug'             => $this->slug,
            'name'             => $this->name,
            'name_arabic'      => $this->name_arabic,
            'role'             => $t('role', 'role_fr'),
            'title'            => $title,
            'country'          => $t('country', 'country_fr'),
            'bio'              => $t('bio', 'bio_fr'),
            'image'            => $this->image,
            'specialties'      => $t('specialties', 'specialties_fr'),
            'languages'        => $t('languages', 'languages_fr'),
            'tags'             => $t('tags', 'tags_fr'),
            'credentials'      => $t('credentials', 'credentials_fr'),
            'is_female'        => $this->is_female,
            'years_experience' => $this->years_experience,
            'students_count'   => $this->students_count,
            'rating'           => $this->rating,
            'reviews_count'    => $this->reviews_count,
            'hourly_rate'      => $this->hourly_rate,
            'currency'         => $this->currency,
            'elite'            => $this->elite,
            'for_children'     => $this->for_children,
            'free_trial'       => $this->free_trial,
            'courses_given'    => $this->courses_given,
            'teaching_hours'   => $this->teaching_hours,
            'quote'            => $t('quote', 'quote_fr'),
            'about'            => $t('about', 'about_fr'),
            'teaching_style'   => $t('teaching_style', 'teaching_style_fr'),
            'strengths'        => $t('strengths', 'strengths_fr'),
            'reviews'          => TeacherReviewResource::collection($this->whenLoaded('reviews')),
        ];
    }
}

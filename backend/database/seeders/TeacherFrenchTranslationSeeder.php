<?php

namespace Database\Seeders;

use App\Models\Teacher;
use Illuminate\Database\Seeder;

/**
 * Backfills the French (_fr) columns on the public marketing teachers and
 * their reviews.
 *
 * This seeder is IDEMPOTENT and NON-DESTRUCTIVE: it only writes a `_fr`
 * column when that column is currently NULL. It never overwrites existing
 * French content and never touches the English source columns. Re-running it
 * therefore changes nothing once every teacher has been translated.
 */
class TeacherFrenchTranslationSeeder extends Seeder
{
    /** Shared closing sentence appended to every French "about" text. */
    private const ABOUT_SUFFIX = 'Les cours ont lieu en tête-à-tête par webcam, à votre rythme, où que vous soyez dans le monde — du grand débutant au niveau avancé.';

    /** Identical teaching-style paragraph for every teacher (matches the English seeder). */
    private const TEACHING_STYLE_FR = 'Une approche chaleureuse et interactive qui met l’accent sur la pratique et l’apprentissage actif. Chaque séance alterne explication claire, correction ciblée et accompagnement personnalisé, en suivant un parcours adapté à votre niveau et à vos objectifs — toujours en commençant par un cours d’essai gratuit.';

    public function run(): void
    {
        $translations = $this->translations();
        $reviewsFr    = $this->reviewsFr();

        $teachersUpdated = 0;
        $reviewsUpdated  = 0;

        foreach ($translations as $slug => $fr) {
            /** @var Teacher|null $teacher */
            $teacher = Teacher::where('slug', $slug)->first();
            if (! $teacher) {
                continue;
            }

            $first = $this->firstName($teacher->name);

            // Derive the composite fields exactly like the English seeder does,
            // but from the French parts.
            $fr['about_fr']          = $fr['bio_fr'] . ' ' . self::ABOUT_SUFFIX;
            $fr['teaching_style_fr'] = self::TEACHING_STYLE_FR;
            $fr['strengths_fr']      = implode(', ', array_slice($fr['tags_fr'], 0, 3))
                . ". {$first} adapte chaque séance à l’élève, en suivant une progression claire et motivante qui vous fait avancer avec confiance.";

            // Only set columns that are currently NULL — never overwrite.
            $update = [];
            foreach ($fr as $column => $value) {
                if ($teacher->{$column} === null) {
                    $update[$column] = $value;
                }
            }

            if ($update) {
                $teacher->fill($update)->save();
                $teachersUpdated++;
            }

            // Reviews: match by author within this teacher, fill text_fr when null.
            $authorMap = $reviewsFr[$slug] ?? [];
            foreach ($teacher->reviews as $review) {
                if ($review->text_fr === null && isset($authorMap[$review->author])) {
                    $review->text_fr = $authorMap[$review->author];
                    $review->save();
                    $reviewsUpdated++;
                }
            }
        }

        $this->command?->info("French backfill: {$teachersUpdated} teacher(s) and {$reviewsUpdated} review(s) updated.");
    }

    private function firstName(string $name): string
    {
        $clean = preg_replace('/^(Sheikh|Sister|Dr\.?)\s+/i', '', $name);
        return explode(' ', $clean)[0];
    }

    /**
     * slug => [ _fr column => French value ].
     * about_fr, teaching_style_fr and strengths_fr are derived in run().
     */
    private function translations(): array
    {
        return [
            'sheikh-ibrahim' => [
                'role_fr'        => 'Responsable des études coraniques',
                'title_fr'       => 'Professeur de Coran et d’Ijazah — diplômé d’Al-Azhar',
                'country_fr'     => 'Égypte',
                'bio_fr'         => 'Cheikh Ibrahim a consacré plus de 15 ans à l’enseignement du Coran à l’international. Diplômé d’Al-Azhar et titulaire d’une chaîne de transmission directe (sanad), il a accompagné des centaines d’élèves jusqu’au Hifz complet et à la certification Ijazah.',
                'credentials_fr' => 'Université Al-Azhar — Licence et Master en sciences coraniques. Ijazah en Hafs ‘an ‘Asim et dans les dix Qira’at.',
                'quote_fr'       => 'Coran et Tajwid avec une chaîne de transmission authentique',
                'specialties_fr' => ['Tajwid', 'Hifz', 'Ijazah', 'Les dix Qira’at'],
                'languages_fr'   => ['Arabe', 'Anglais'],
                'tags_fr'        => ['Rigoureux', 'Diplômé d’Al-Azhar', 'Patient', 'Ijazah'],
            ],
            'sister-aisha' => [
                'role_fr'        => 'Professeure de Coran senior',
                'title_fr'       => 'Coran pour enfants et débutants — douce et structurée',
                'country_fr'     => 'Égypte',
                'bio_fr'         => 'Sœur Aisha est appréciée des élèves et des familles au Royaume-Uni, aux États-Unis et au Canada. Son approche patiente et structurée en fait le premier choix pour les débutants et les enfants. Elle est titulaire de l’Ijazah et certifiée pour délivrer l’Ijazah à ses élèves.',
                'credentials_fr' => 'Université islamique de Médine — études coraniques. Ijazah en Hafs ‘an ‘Asim. Plus de 12 ans d’enseignement.',
                'quote_fr'       => 'Un parcours bienveillant et structuré pour les enfants et les débutants',
                'specialties_fr' => ['Coran pour enfants', 'Tajwid', 'Qaïda Nourania', 'Hifz'],
                'languages_fr'   => ['Arabe', 'Anglais', 'Ourdou'],
                'tags_fr'        => ['Bienveillante', 'Patiente', 'À l’aise avec les enfants', 'Ijazah'],
            ],
            'sheikh-omar' => [
                'role_fr'        => 'Directeur du programme Ijazah',
                'title_fr'       => 'Ijazah et les dix Qira’at — récitation avancée',
                'country_fr'     => 'Égypte',
                'bio_fr'         => 'Dr Omar dirige notre programme Ijazah rigoureux, garantissant à chaque élève une chaîne authentique et ininterrompue remontant jusqu’au Prophète ﷺ. Il a délivré l’Ijazah à plus de 60 élèves dans le monde et enseigne les Qira’at avancées.',
                'credentials_fr' => 'Université Al-Azhar — Doctorat en sciences islamiques. Ijazah dans les dix Qira’at avec chaîne moutawâtir.',
                'quote_fr'       => 'Une Ijazah authentique avec une chaîne ininterrompue jusqu’au Prophète ﷺ',
                'specialties_fr' => ['Ijazah', 'Les dix Qira’at', 'Tajwid', 'Tafsir'],
                'languages_fr'   => ['Arabe', 'Anglais', 'Français'],
                'tags_fr'        => ['Rigoureux', 'Diplômé d’Al-Azhar', 'Attentif', 'Ijazah'],
            ],
            'sister-fatima' => [
                'role_fr'        => 'Spécialiste de la langue arabe',
                'title_fr'       => 'Arabe pour non-arabophones — de l’alphabet à l’aisance',
                'country_fr'     => 'Égypte',
                'bio_fr'         => 'Sœur Fatima rend l’arabe accessible aux grands débutants. Son programme structuré amène les élèves de l’alphabet à l’arabe conversationnel. Elle enseigne également la grammaire coranique pour aider les élèves à comprendre le Coran directement.',
                'credentials_fr' => 'Université du Caire — Licence de littérature arabe. Enseignante certifiée par Al-Azhar. 10 ans d’enseignement de l’arabe en ligne.',
                'quote_fr'       => 'Rendre l’arabe simple, une étape à la fois',
                'specialties_fr' => ['Arabe pour non-arabophones', 'Arabe coranique', 'Sciences islamiques'],
                'languages_fr'   => ['Arabe', 'Anglais', 'Français'],
                'tags_fr'        => ['Bienveillante', 'Claire', 'Structurée'],
            ],
            'sheikh-yusuf' => [
                'role_fr'        => 'Professeur de Coran et de sciences islamiques',
                'title_fr'       => 'Tafsir et sciences islamiques — comprendre le Coran',
                'country_fr'     => 'Égypte',
                'bio_fr'         => 'Cheikh Yusuf fait vivre le Coran à travers une étude approfondie du Tafsir. Ses cours aident les élèves non seulement à réciter, mais aussi à comprendre la sagesse et la guidance derrière chaque verset. Les élèves décrivent ses cours comme transformateurs.',
                'credentials_fr' => 'Université Al-Azhar — Licence en sciences islamiques. Spécialiste du Tafsir et de l’Aqida. 8 ans d’enseignement.',
                'quote_fr'       => 'Donner vie aux sens du Coran',
                'specialties_fr' => ['Tafsir', 'Sciences islamiques', 'Sîra', 'Aqida'],
                'languages_fr'   => ['Arabe', 'Anglais'],
                'tags_fr'        => ['Captivant', 'Érudit', 'Patient'],
            ],
            'sister-maryam' => [
                'role_fr'        => 'Spécialiste du Coran pour enfants',
                'title_fr'       => 'Coran pour enfants — ludique et encourageante',
                'country_fr'     => 'Égypte',
                'bio_fr'         => 'Sœur Maryam a un don pour enseigner aux enfants. Son style ludique et encourageant donne envie aux apprenants les plus réticents d’attendre leur prochain cours avec impatience. Elle est spécialisée auprès des 5 à 14 ans et a aidé des centaines d’enfants à terminer leur Qaïda Nourania et à débuter le Tajwid.',
                'credentials_fr' => 'Institut éducatif islamique — Coran et pédagogie. Spécialiste certifiée de l’apprentissage des enfants. 9 ans d’expérience.',
                'quote_fr'       => 'Chaque enfant mérite d’aimer son cours de Coran',
                'specialties_fr' => ['Coran pour enfants', 'Qaïda Nourania', 'Tajwid', 'Sciences islamiques pour enfants'],
                'languages_fr'   => ['Arabe', 'Anglais', 'Turc'],
                'tags_fr'        => ['Bienveillante', 'À l’aise avec les enfants', 'Amusante', 'Patiente'],
            ],
            'sheikh-khalid' => [
                'role_fr'        => 'Coordinateur du programme Hifz',
                'title_fr'       => 'Hifz et mémorisation — une méthodologie éprouvée',
                'country_fr'     => 'Égypte',
                'bio_fr'         => 'Cheikh Khalid a aidé plus de 200 élèves à achever leur Hifz complet du Coran. Son approche systématique de la mémorisation — fractionner, réviser et consolider — produit des résultats durables. Son élève le plus âgé à avoir terminé le Hifz avait 67 ans.',
                'credentials_fr' => 'Université Al-Azhar — certification Hifz avec chaîne complète. Spécialisé dans la méthodologie de mémorisation. 14 ans.',
                'quote_fr'       => 'Un système clair pour mémoriser — et ne jamais oublier',
                'specialties_fr' => ['Hifz / Mémorisation', 'Tajwid', 'Techniques de révision'],
                'languages_fr'   => ['Arabe', 'Anglais'],
                'tags_fr'        => ['Rigoureux', 'Structuré', 'Motivant', 'Ijazah'],
            ],
            'sister-nour' => [
                'role_fr'        => 'Professeure de Coran et de Tajwid pour adultes',
                'title_fr'       => 'Tajwid pour adultes — commencez en confiance',
                'country_fr'     => 'Égypte',
                'bio_fr'         => 'Sœur Nour est spécialisée dans l’accompagnement des adultes — en particulier ceux qui ont grandi sans éducation coranique — pour commencer ou reprendre leur parcours en confiance. Son approche structurée et sans jugement lui a valu des avis exceptionnels d’élèves à travers l’Europe et l’Amérique du Nord.',
                'credentials_fr' => 'Université Umm Al-Qura — récitation coranique et Tajwid. Ijazah en Hafs ‘an ‘Asim. 7 ans d’enseignement auprès des adultes.',
                'quote_fr'       => 'Il n’est jamais trop tard pour commencer votre parcours coranique',
                'specialties_fr' => ['Tajwid', 'Coran pour adultes', 'Arabe', 'Hifz'],
                'languages_fr'   => ['Arabe', 'Anglais', 'Allemand'],
                'tags_fr'        => ['Bienveillante', 'Sans jugement', 'Encourageante'],
            ],
        ];
    }

    /**
     * slug => [ review author => text_fr ].
     * Keyed by teacher slug + author so it survives review id changes; within a
     * single teacher each author appears at most once.
     */
    private function reviewsFr(): array
    {
        return [
            'sheikh-ibrahim' => [
                'Bilal S.'  => 'Ponctualité, professionnalisme et gentillesse. Je recommande vivement les cours d’Ibrahim.',
                'Nadia K.'  => 'Excellent professeur. Ibrahim explique avec une clarté remarquable ; je progresse à chaque cours.',
                'Idriss N.' => 'Ibrahim est un professeur exceptionnel — pédagogue, attentif et toujours bien préparé.',
                'Tarek M.'  => 'Parfait pour les plus jeunes enfants. Ibrahim est gentil, encourageant et très professionnel.',
                'Nour S.'   => 'J’ai commencé de zéro et grâce à Ibrahim je sais maintenant lire l’arabe. Je recommande vivement !',
            ],
            'sister-aisha' => [
                'Nadia K.'   => 'Excellent professeur. Aisha explique avec une clarté remarquable ; je progresse à chaque cours.',
                'Idriss N.'  => 'Aisha est une enseignante exceptionnelle — pédagogue, attentive et toujours bien préparée.',
                'Tarek M.'   => 'Parfait pour les plus jeunes enfants. Aisha est gentille, encourageante et très professionnelle.',
                'Nour S.'    => 'J’ai commencé de zéro et grâce à Aisha je sais maintenant lire l’arabe. Je recommande vivement !',
                'Yasmine B.' => 'Alhamdulillah, Aisha est patiente et se soucie sincèrement de nos progrès. La meilleure.',
            ],
            'sheikh-omar' => [
                'Idriss N.'  => 'Omar est un professeur exceptionnel — pédagogue, attentif et toujours bien préparé.',
                'Tarek M.'   => 'Parfait pour les plus jeunes enfants. Omar est gentil, encourageant et très professionnel.',
                'Nour S.'    => 'J’ai commencé de zéro et grâce à Omar je sais maintenant lire l’arabe. Je recommande vivement !',
                'Yasmine B.' => 'Alhamdulillah, Omar est patient et se soucie sincèrement de nos progrès. Le meilleur.',
                'Hassan A.'  => 'Cours très structurés. Omar sait toujours exactement quoi travailler ensuite.',
            ],
            'sister-fatima' => [
                'Tarek M.'   => 'Parfait pour les plus jeunes enfants. Fatima est gentille, encourageante et très professionnelle.',
                'Nour S.'    => 'J’ai commencé de zéro et grâce à Fatima je sais maintenant lire l’arabe. Je recommande vivement !',
                'Yasmine B.' => 'Alhamdulillah, Fatima est patiente et se soucie sincèrement de nos progrès. La meilleure.',
                'Hassan A.'  => 'Cours très structurés. Fatima sait toujours exactement quoi travailler ensuite.',
                'Bilal S.'   => 'Ponctualité, professionnalisme et gentillesse. Je recommande vivement les cours de Fatima.',
            ],
            'sheikh-yusuf' => [
                'Nour S.'    => 'J’ai commencé de zéro et grâce à Yusuf je sais maintenant lire l’arabe. Je recommande vivement !',
                'Yasmine B.' => 'Alhamdulillah, Yusuf est patient et se soucie sincèrement de nos progrès. Le meilleur.',
                'Hassan A.'  => 'Cours très structurés. Yusuf sait toujours exactement quoi travailler ensuite.',
                'Bilal S.'   => 'Ponctualité, professionnalisme et gentillesse. Je recommande vivement les cours de Yusuf.',
                'Nadia K.'   => 'Excellent professeur. Yusuf explique avec une clarté remarquable ; je progresse à chaque cours.',
            ],
            'sister-maryam' => [
                'Yasmine B.' => 'Alhamdulillah, Maryam est patiente et se soucie sincèrement de nos progrès. La meilleure.',
                'Hassan A.'  => 'Cours très structurés. Maryam sait toujours exactement quoi travailler ensuite.',
                'Bilal S.'   => 'Ponctualité, professionnalisme et gentillesse. Je recommande vivement les cours de Maryam.',
                'Nadia K.'   => 'Excellent professeur. Maryam explique avec une clarté remarquable ; je progresse à chaque cours.',
                'Idriss N.'  => 'Maryam est une enseignante exceptionnelle — pédagogue, attentive et toujours bien préparée.',
            ],
            'sheikh-khalid' => [
                'Hassan A.'  => 'Cours très structurés. Khalid sait toujours exactement quoi travailler ensuite.',
                'Bilal S.'   => 'Ponctualité, professionnalisme et gentillesse. Je recommande vivement les cours de Khalid.',
                'Nadia K.'   => 'Excellent professeur. Khalid explique avec une clarté remarquable ; je progresse à chaque cours.',
                'Idriss N.'  => 'Khalid est un professeur exceptionnel — pédagogue, attentif et toujours bien préparé.',
                'Tarek M.'   => 'Parfait pour les plus jeunes enfants. Khalid est gentil, encourageant et très professionnel.',
            ],
            'sister-nour' => [
                'Bilal S.'   => 'Ponctualité, professionnalisme et gentillesse. Je recommande vivement les cours de Nour.',
                'Nadia K.'   => 'Excellent professeur. Nour explique avec une clarté remarquable ; je progresse à chaque cours.',
                'Idriss N.'  => 'Nour est une enseignante exceptionnelle — pédagogue, attentive et toujours bien préparée.',
                'Tarek M.'   => 'Parfait pour les plus jeunes enfants. Nour est gentille, encourageante et très professionnelle.',
                'Nour S.'    => 'J’ai commencé de zéro et grâce à Nour je sais maintenant lire l’arabe. Je recommande vivement !',
            ],
        ];
    }
}

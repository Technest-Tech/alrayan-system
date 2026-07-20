<?php

namespace Tests\Feature\System;

use App\Models\System\QcCategory;
use App\Models\System\QcSpecialRule;
use App\Services\System\QcScorer;
use Tests\SystemTestCase;

class QcScorerTest extends SystemTestCase
{
    /** @return array{i1: int, i2: int, cam: int} */
    private function seedChecklist(): array
    {
        QcSpecialRule::create([
            'rule_key' => 'camera_cap', 'rule_type' => 'score_cap',
            'label' => 'Camera cap', 'cap_value' => 30, 'is_active' => true,
        ]);

        $catA = QcCategory::create(['name' => 'Clarity', 'weight' => 10, 'sort_order' => 0, 'is_active' => true]);
        $i1 = $catA->items()->create(['label' => 'A1', 'penalty' => 8, 'sort_order' => 0, 'is_active' => true]);
        $i2 = $catA->items()->create(['label' => 'A2', 'penalty' => 7, 'sort_order' => 1, 'is_active' => true]);

        $catCam = QcCategory::create(['name' => 'Camera', 'weight' => 10, 'sort_order' => 1, 'is_active' => true]);
        $cam = $catCam->items()->create(['label' => 'Camera on', 'penalty' => 10, 'special_rule_key' => 'camera_cap', 'sort_order' => 0, 'is_active' => true]);

        return ['i1' => $i1->id, 'i2' => $i2->id, 'cam' => $cam->id];
    }

    public function test_all_checked_scores_100(): void
    {
        $ids = $this->seedChecklist();
        $result = app(QcScorer::class)->build([$ids['i1'], $ids['i2'], $ids['cam']]);

        $this->assertSame(100.0, $result['score']);
        $this->assertCount(3, $result['items']);
    }

    public function test_unchecked_items_subtract_their_penalties(): void
    {
        $ids = $this->seedChecklist();
        // i2 (7%) left unchecked, camera on.
        $result = app(QcScorer::class)->build([$ids['i1'], $ids['cam']]);

        $this->assertSame(93.0, $result['score']);
    }

    public function test_camera_off_caps_score_at_30(): void
    {
        $ids = $this->seedChecklist();
        // Everything ticked except the camera item → its cap rule dominates.
        $result = app(QcScorer::class)->build([$ids['i1'], $ids['i2']]);

        $this->assertSame(30.0, $result['score']);
    }

    public function test_inactive_items_are_ignored(): void
    {
        $ids = $this->seedChecklist();
        \App\Models\System\QcCategoryItem::whereKey($ids['i2'])->update(['is_active' => false]);

        // Only i1 + camera remain active; both ticked → full score.
        $result = app(QcScorer::class)->build([$ids['i1'], $ids['cam']]);

        $this->assertSame(100.0, $result['score']);
        $this->assertCount(2, $result['items']);
    }
}

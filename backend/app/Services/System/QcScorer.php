<?php

namespace App\Services\System;

use App\Models\System\QcCategory;
use App\Models\System\QcSpecialRule;

/**
 * Authoritative Quality-Control scorer.
 *
 * Score starts at 100 and every UNCHECKED active checklist item subtracts its
 * penalty. Active `score_cap` special rules then cap the score whenever the item
 * they are linked to is left unchecked (e.g. camera off → score ≤ 30%). The same
 * math is mirrored client-side in `computeScore()` (types/system/qualityControl.ts)
 * for the live gauge, but this server result is the one that gets persisted.
 */
class QcScorer
{
    /**
     * Build the score + a full snapshot of every active item's state.
     *
     * @param  array<int,int|string>  $checkedItemIds  ids of the ticked category items
     * @return array{score: float, items: array<int,array<string,mixed>>}
     */
    public function build(array $checkedItemIds): array
    {
        $checked = array_map('intval', $checkedItemIds);

        $categories = QcCategory::query()
            ->where('is_active', true)
            ->with(['items' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')->orderBy('id')
            ->get();

        $rules = QcSpecialRule::query()->where('is_active', true)->get()->keyBy('rule_key');

        $rows              = [];
        $score             = 100.0;
        $uncheckedRuleKeys = [];

        foreach ($categories as $category) {
            foreach ($category->items as $item) {
                $isChecked = in_array($item->id, $checked, true);

                if (! $isChecked) {
                    $score -= $item->penalty;
                    if ($item->special_rule_key) {
                        $uncheckedRuleKeys[$item->special_rule_key] = true;
                    }
                }

                $rows[] = [
                    'category_item_id' => $item->id,
                    'category_name'    => $category->name,
                    'item_label'       => $item->label,
                    'penalty'          => $item->penalty,
                    'special_rule_key' => $item->special_rule_key,
                    'checked'          => $isChecked,
                ];
            }
        }

        // Apply score caps for any unchecked item linked to an active score_cap rule.
        foreach (array_keys($uncheckedRuleKeys) as $ruleKey) {
            $rule = $rules->get($ruleKey);
            if ($rule && $rule->rule_type === 'score_cap') {
                $score = min($score, (float) $rule->cap_value);
            }
        }

        $score = max(0.0, min(100.0, $score));

        return [
            'score' => round($score, 2),
            'items' => $rows,
        ];
    }
}

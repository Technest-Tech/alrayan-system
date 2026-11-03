<?php

namespace Tests\Feature\System;

use App\Models\System\Expense;
use App\Models\System\ExpenseCategory;
use App\Models\System\ExpenseItem;
use App\Models\System\TreasuryAccount;
use App\Models\System\TreasuryTransaction;
use App\Services\System\ProfitLossCalculator;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\SystemTestCase;

class TreasuryEndpointsTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-06-15 12:00:00');

        // Deterministic FX: 1 USD = 50 EGP.
        Cache::flush();
        Http::fake([
            '*' => Http::response(['date' => '2026-06-01', 'egp' => ['usd' => 0.02, 'eur' => 1 / 55]], 200),
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function account(array $attrs = []): TreasuryAccount
    {
        return TreasuryAccount::factory()->create($attrs);
    }

    private function balanceOf(TreasuryAccount $account): int
    {
        return $this->asAdmin()
            ->getJson("/api/system/treasury/accounts/{$account->id}")
            ->assertOk()
            ->json('data.balance_minor');
    }

    private function movement(TreasuryAccount $account, array $overrides = []): array
    {
        return array_merge([
            'account_id'   => $account->id,
            'direction'    => 'in',
            'kind'         => 'income',
            'amount_minor' => 10_000,
            'occurred_on'  => '2026-06-01',
            'description'  => 'Payment',
        ], $overrides);
    }

    // ── Accounts ─────────────────────────────────────────────────────────────

    public function test_new_account_opens_at_its_opening_balance(): void
    {
        $response = $this->asAdmin()->postJson('/api/system/treasury/accounts', [
            'name'                  => 'PayPal',
            'type'                  => 'paypal',
            'currency'              => 'USD',
            'opening_balance_minor' => 250_000,
            'opening_date'          => '2026-01-01',
        ])->assertCreated();

        $this->assertSame(250_000, $response->json('data.balance_minor'));
    }

    public function test_an_account_can_open_overdrawn(): void
    {
        $this->asAdmin()->postJson('/api/system/treasury/accounts', [
            'name'                  => 'Overdraft',
            'type'                  => 'bank',
            'currency'              => 'EGP',
            'opening_balance_minor' => -5_000,
            'opening_date'          => '2026-01-01',
        ])->assertCreated()->assertJsonPath('data.balance_minor', -5_000);
    }

    public function test_balance_is_opening_plus_in_minus_out(): void
    {
        $account = $this->account(['opening_balance_minor' => 100_000]);

        $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($account, ['amount_minor' => 40_000]))->assertCreated();
        $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($account, [
            'direction' => 'out', 'kind' => 'withdrawal', 'amount_minor' => 15_000,
        ]))->assertCreated();

        $this->assertSame(125_000, $this->balanceOf($account));
    }

    public function test_changing_the_opening_balance_moves_the_balance_and_is_audited(): void
    {
        $account = $this->account(['opening_balance_minor' => 100_000]);

        $this->asAdmin()->patchJson("/api/system/treasury/accounts/{$account->id}", ['opening_balance_minor' => 70_000])
            ->assertOk()
            ->assertJsonPath('data.balance_minor', 70_000);

        $this->assertDatabaseHas('sys_audit_logs', ['action' => 'treasury.opening_balance_changed']);
    }

    public function test_currency_is_locked_once_the_account_has_transactions(): void
    {
        $account = $this->account(['currency' => 'USD']);
        TreasuryTransaction::factory()->create(['account_id' => $account->id]);

        $this->asAdmin()->patchJson("/api/system/treasury/accounts/{$account->id}", ['currency' => 'EGP'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('currency');
    }

    public function test_opening_date_cannot_move_past_existing_transactions(): void
    {
        $account = $this->account(['opening_date' => '2026-01-01']);
        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-02-01']);

        $this->asAdmin()->patchJson("/api/system/treasury/accounts/{$account->id}", ['opening_date' => '2026-03-01'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('opening_date');
    }

    public function test_account_with_transactions_cannot_be_deleted(): void
    {
        $account = $this->account();
        TreasuryTransaction::factory()->create(['account_id' => $account->id]);

        $this->asAdmin()->deleteJson("/api/system/treasury/accounts/{$account->id}")
            ->assertUnprocessable();

        $this->assertNotSoftDeleted($account);
    }

    public function test_account_with_money_in_it_cannot_be_archived(): void
    {
        $account = $this->account(['opening_balance_minor' => 100]);

        $this->asAdmin()->patchJson("/api/system/treasury/accounts/{$account->id}", ['is_active' => false])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('is_active');

        $empty = $this->account(['opening_balance_minor' => 0]);

        $this->asAdmin()->patchJson("/api/system/treasury/accounts/{$empty->id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_archived_account_refuses_movements(): void
    {
        $account = $this->account(['is_active' => false, 'opening_balance_minor' => 0]);

        $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($account))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('account_id');
    }

    public function test_index_totals_group_by_currency_and_ignore_transfers(): void
    {
        $usdA = $this->account(['currency' => 'USD', 'opening_balance_minor' => 100_000]);
        $usdB = $this->account(['currency' => 'USD', 'opening_balance_minor' => 50_000]);
        $this->account(['currency' => 'EGP', 'opening_balance_minor' => 500_000]);

        $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($usdA, ['amount_minor' => 30_000]))->assertCreated();
        $this->asAdmin()->postJson('/api/system/treasury/transfers', [
            'from_account_id' => $usdA->id,
            'to_account_id'   => $usdB->id,
            'amount_minor'    => 20_000,
            'occurred_on'     => '2026-06-02',
            'description'     => 'Move',
        ])->assertCreated();

        $response = $this->asAdmin()->getJson('/api/system/treasury/accounts')->assertOk();

        $usd = collect($response->json('totals'))->firstWhere('currency', 'USD');
        $this->assertSame(180_000, $usd['balance_minor']);
        $this->assertSame(30_000, $usd['month_in_minor']);
        $this->assertSame(0, $usd['month_out_minor']);

        // Each account's own card does count the transfer: it really left that account.
        $rowA = collect($response->json('data'))->firstWhere('id', $usdA->id);
        $this->assertSame(30_000, $rowA['month_in_minor']);
        $this->assertSame(20_000, $rowA['month_out_minor']);
    }

    public function test_grand_total_converts_across_currencies(): void
    {
        $this->account(['currency' => 'USD', 'opening_balance_minor' => 100_00]);
        $this->account(['currency' => 'EGP', 'opening_balance_minor' => 500_00]);

        $this->asAdmin()->getJson('/api/system/treasury/accounts')
            ->assertOk()
            ->assertJsonPath('grand_total.currency', 'EGP')
            ->assertJsonPath('grand_total.balance_minor', 5500_00)
            ->assertJsonPath('grand_total.partial', false);
    }

    public function test_grand_total_is_omitted_for_a_single_currency_and_skips_the_rate_api(): void
    {
        $this->account(['currency' => 'USD']);

        $this->asAdmin()->getJson('/api/system/treasury/accounts')
            ->assertOk()
            ->assertJsonPath('grand_total', null);

        Http::assertNothingSent();
    }

    public function test_grand_total_flags_a_currency_with_no_rate_instead_of_counting_it_as_zero(): void
    {
        $this->account(['currency' => 'USD', 'opening_balance_minor' => 100_00]);
        $this->account(['currency' => 'SAR', 'opening_balance_minor' => 999_00]);

        $this->asAdmin()->getJson('/api/system/treasury/accounts')
            ->assertOk()
            ->assertJsonPath('grand_total.partial', true)
            ->assertJsonPath('grand_total.balance_minor', 5000_00);
    }

    // ── Movements ────────────────────────────────────────────────────────────

    public function test_movement_cannot_predate_the_opening_date(): void
    {
        $account = $this->account(['opening_date' => '2026-03-01']);

        $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($account, ['occurred_on' => '2026-02-28']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('occurred_on');
    }

    public function test_movement_cannot_be_in_the_future_but_tomorrow_is_tolerated(): void
    {
        $account = $this->account();

        $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($account, ['occurred_on' => '2026-06-16']))
            ->assertCreated();

        $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($account, ['occurred_on' => '2026-06-17']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('occurred_on');
    }

    public function test_income_cannot_go_out(): void
    {
        $account = $this->account();

        $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($account, ['direction' => 'out', 'kind' => 'income']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('kind');
    }

    public function test_expense_and_transfer_kinds_cannot_be_entered_by_hand(): void
    {
        $account = $this->account();

        foreach (['expense', 'transfer'] as $kind) {
            $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($account, ['direction' => 'out', 'kind' => $kind]))
                ->assertUnprocessable()
                ->assertJsonValidationErrors('kind');
        }
    }

    public function test_editing_and_deleting_a_movement_changes_the_balance(): void
    {
        $account = $this->account(['opening_balance_minor' => 0]);
        $id = $this->asAdmin()->postJson('/api/system/treasury/transactions', $this->movement($account))->json('data.id');

        $this->asAdmin()->patchJson("/api/system/treasury/transactions/{$id}", ['amount_minor' => 25_000])->assertOk();
        $this->assertSame(25_000, $this->balanceOf($account));

        $this->asAdmin()->deleteJson("/api/system/treasury/transactions/{$id}")->assertNoContent();
        $this->assertSame(0, $this->balanceOf($account));
    }

    // ── Statement ────────────────────────────────────────────────────────────

    public function test_statement_running_balance_follows_dates_not_entry_order(): void
    {
        $account = $this->account(['opening_balance_minor' => 1_000]);

        // Entered out of order: the back-dated row must slot in beneath the later one.
        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-03-01', 'direction' => 'out', 'kind' => 'withdrawal', 'amount_minor' => 200]);
        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-02-01', 'direction' => 'in', 'amount_minor' => 500]);

        $rows = $this->asAdmin()->getJson("/api/system/treasury/accounts/{$account->id}/transactions")
            ->assertOk()
            ->json('data');

        $this->assertSame('2026-03-01', $rows[0]['occurred_on']);
        $this->assertSame(1_300, $rows[0]['balance_after_minor']);
        $this->assertSame('2026-02-01', $rows[1]['occurred_on']);
        $this->assertSame(1_500, $rows[1]['balance_after_minor']);
    }

    public function test_statement_running_balance_stays_true_when_filtered(): void
    {
        $account = $this->account(['opening_balance_minor' => 0]);

        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-02-01', 'amount_minor' => 1_000]);
        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-03-01', 'direction' => 'out', 'kind' => 'withdrawal', 'amount_minor' => 300]);

        $rows = $this->asAdmin()->getJson("/api/system/treasury/accounts/{$account->id}/transactions?filter[direction]=out")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame(700, $rows[0]['balance_after_minor']);
    }

    public function test_statement_running_balance_ignores_deleted_rows_and_other_accounts(): void
    {
        $account = $this->account(['opening_balance_minor' => 0]);
        $other   = $this->account(['opening_balance_minor' => 0]);

        TreasuryTransaction::factory()->create(['account_id' => $other->id, 'occurred_on' => '2026-01-15', 'amount_minor' => 9_999]);
        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-01-20', 'amount_minor' => 7_777])->delete();
        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-02-01', 'amount_minor' => 100]);

        $rows = $this->asAdmin()->getJson("/api/system/treasury/accounts/{$account->id}/transactions")->json('data');

        $this->assertCount(1, $rows);
        $this->assertSame(100, $rows[0]['balance_after_minor']);
    }

    public function test_statement_summary_reconciles_over_a_period(): void
    {
        $account = $this->account(['opening_balance_minor' => 1_000]);

        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-01-10', 'amount_minor' => 500]);
        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-02-10', 'amount_minor' => 200]);
        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-02-20', 'direction' => 'out', 'kind' => 'withdrawal', 'amount_minor' => 50]);
        TreasuryTransaction::factory()->create(['account_id' => $account->id, 'occurred_on' => '2026-03-10', 'amount_minor' => 900]);

        $this->asAdmin()
            ->getJson("/api/system/treasury/accounts/{$account->id}/transactions?filter[from]=2026-02-01&filter[to]=2026-02-28")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('summary.balance_at_start', 1_500)
            ->assertJsonPath('summary.total_in', 200)
            ->assertJsonPath('summary.total_out', 50)
            ->assertJsonPath('summary.balance_at_end', 1_650);
    }

    // ── Transfers ────────────────────────────────────────────────────────────

    public function test_transfer_moves_money_without_changing_the_total(): void
    {
        $from = $this->account(['opening_balance_minor' => 100_000]);
        $to   = $this->account(['opening_balance_minor' => 0]);

        $this->asAdmin()->postJson('/api/system/treasury/transfers', [
            'from_account_id' => $from->id,
            'to_account_id'   => $to->id,
            'amount_minor'    => 30_000,
            'occurred_on'     => '2026-06-01',
            'description'     => 'Move',
        ])->assertCreated();

        $this->assertSame(70_000, $this->balanceOf($from));
        $this->assertSame(30_000, $this->balanceOf($to));
    }

    public function test_cross_currency_transfer_uses_the_amounts_that_actually_moved(): void
    {
        $paypal = $this->account(['currency' => 'USD', 'opening_balance_minor' => 100_000]);
        $bank   = $this->account(['currency' => 'EGP', 'opening_balance_minor' => 0]);

        $payload = [
            'from_account_id' => $paypal->id,
            'to_account_id'   => $bank->id,
            'amount_minor'    => 10_000,
            'occurred_on'     => '2026-06-01',
            'description'     => 'Withdraw to bank',
        ];

        // The amount received is mandatory across currencies: we never guess a rate.
        $this->asAdmin()->postJson('/api/system/treasury/transfers', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('received_amount_minor');

        $this->asAdmin()->postJson('/api/system/treasury/transfers', $payload + ['received_amount_minor' => 480_000])
            ->assertCreated();

        $this->assertSame(90_000, $this->balanceOf($paypal));
        $this->assertSame(480_000, $this->balanceOf($bank));
    }

    public function test_transfer_to_the_same_account_is_refused(): void
    {
        $account = $this->account();

        $this->asAdmin()->postJson('/api/system/treasury/transfers', [
            'from_account_id' => $account->id,
            'to_account_id'   => $account->id,
            'amount_minor'    => 100,
            'occurred_on'     => '2026-06-01',
            'description'     => 'Loop',
        ])->assertUnprocessable()->assertJsonValidationErrors('to_account_id');
    }

    public function test_deleting_either_leg_removes_the_whole_transfer(): void
    {
        $from = $this->account(['opening_balance_minor' => 100_000]);
        $to   = $this->account(['opening_balance_minor' => 0]);

        $legs = $this->asAdmin()->postJson('/api/system/treasury/transfers', [
            'from_account_id' => $from->id,
            'to_account_id'   => $to->id,
            'amount_minor'    => 30_000,
            'occurred_on'     => '2026-06-01',
            'description'     => 'Move',
        ])->json('data');

        $this->asAdmin()->deleteJson("/api/system/treasury/transactions/{$legs[1]['id']}")->assertNoContent();

        $this->assertSame(100_000, $this->balanceOf($from));
        $this->assertSame(0, $this->balanceOf($to));
    }

    public function test_a_transfer_cannot_be_edited(): void
    {
        $from = $this->account();
        $to   = $this->account();

        $legs = $this->asAdmin()->postJson('/api/system/treasury/transfers', [
            'from_account_id' => $from->id,
            'to_account_id'   => $to->id,
            'amount_minor'    => 100,
            'occurred_on'     => '2026-06-01',
            'description'     => 'Move',
        ])->json('data');

        $this->asAdmin()->patchJson("/api/system/treasury/transactions/{$legs[0]['id']}", ['amount_minor' => 999])
            ->assertUnprocessable();
    }

    // ── Expenses paid from an account ────────────────────────────────────────

    private function expensePayload(array $overrides = []): array
    {
        return array_merge([
            'category_id'  => ExpenseCategory::factory()->create()->id,
            'amount_minor' => 5_000,
            'description'  => 'Zoom',
            'occurred_on'  => '2026-06-01',
        ], $overrides);
    }

    public function test_expense_with_an_account_reduces_its_balance_and_takes_its_currency(): void
    {
        $account = $this->account(['currency' => 'EUR', 'opening_balance_minor' => 20_000]);

        $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $account->id]))
            ->assertCreated()
            ->assertJsonPath('data.currency', 'EUR')
            ->assertJsonPath('data.account.id', $account->id);

        $this->assertSame(15_000, $this->balanceOf($account));
    }

    public function test_expense_without_an_account_touches_no_balance(): void
    {
        $account = $this->account(['opening_balance_minor' => 20_000]);

        $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['currency' => 'USD']))
            ->assertCreated();

        $this->assertSame(20_000, $this->balanceOf($account));
        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_expense_in_another_currency_than_its_account_is_refused(): void
    {
        $account = $this->account(['currency' => 'EGP']);

        $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $account->id, 'currency' => 'USD']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('currency');

        $this->assertSame(0, Expense::count());
    }

    public function test_expense_before_the_account_opened_is_refused(): void
    {
        $account = $this->account(['opening_date' => '2026-06-01']);

        $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $account->id, 'occurred_on' => '2026-05-31']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('occurred_on');

        $this->assertSame(0, Expense::count());
    }

    public function test_editing_an_expense_updates_its_movement(): void
    {
        $account = $this->account(['opening_balance_minor' => 20_000]);
        $id = $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $account->id]))->json('data.id');

        $this->asAdmin()->patchJson("/api/system/expenses/{$id}", [
            'amount_minor' => 8_000,
            'description'  => 'Zoom annual',
            'occurred_on'  => '2026-06-05',
        ])->assertOk();

        $this->assertSame(12_000, $this->balanceOf($account));

        $tx = TreasuryTransaction::where('expense_id', $id)->firstOrFail();
        $this->assertSame('Zoom annual', $tx->description);
        $this->assertSame('2026-06-05', $tx->occurred_on->toDateString());
    }

    public function test_moving_an_expense_between_accounts_moves_the_money(): void
    {
        $a = $this->account(['opening_balance_minor' => 20_000]);
        $b = $this->account(['opening_balance_minor' => 20_000]);
        $id = $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $a->id]))->json('data.id');

        $this->asAdmin()->patchJson("/api/system/expenses/{$id}", ['account_id' => $b->id])->assertOk();

        $this->assertSame(20_000, $this->balanceOf($a));
        $this->assertSame(15_000, $this->balanceOf($b));
    }

    public function test_detaching_an_expense_from_its_account_gives_the_money_back(): void
    {
        $account = $this->account(['opening_balance_minor' => 20_000]);
        $id = $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $account->id]))->json('data.id');

        $this->asAdmin()->patchJson("/api/system/expenses/{$id}", ['account_id' => null])->assertOk();

        $this->assertSame(20_000, $this->balanceOf($account));
    }

    public function test_attaching_an_old_expense_to_an_account_debits_it(): void
    {
        $account = $this->account(['currency' => 'USD', 'opening_balance_minor' => 20_000]);
        $expense = Expense::factory()->create(['currency' => 'USD', 'amount_minor' => 1_000, 'occurred_on' => '2026-05-01']);

        $this->asAdmin()->patchJson("/api/system/expenses/{$expense->id}", ['account_id' => $account->id])->assertOk();

        $this->assertSame(19_000, $this->balanceOf($account));
    }

    public function test_moving_an_expense_to_an_account_in_another_currency_is_refused(): void
    {
        $usd = $this->account(['currency' => 'USD']);
        $egp = $this->account(['currency' => 'EGP']);
        $id = $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $usd->id]))->json('data.id');

        $this->asAdmin()->patchJson("/api/system/expenses/{$id}", ['account_id' => $egp->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('currency');

        // Sending the new currency alongside it is the deliberate, allowed form.
        $this->asAdmin()->patchJson("/api/system/expenses/{$id}", [
            'account_id' => $egp->id, 'currency' => 'EGP', 'amount_minor' => 250_000,
        ])->assertOk();
    }

    public function test_deleting_an_expense_gives_the_money_back(): void
    {
        $account = $this->account(['opening_balance_minor' => 20_000]);
        $id = $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $account->id]))->json('data.id');

        $this->asAdmin()->deleteJson("/api/system/expenses/{$id}")->assertNoContent();

        $this->assertSame(20_000, $this->balanceOf($account));
    }

    public function test_an_expense_movement_cannot_be_edited_or_deleted_directly(): void
    {
        $account = $this->account();
        $id = $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $account->id]))->json('data.id');
        $txId = TreasuryTransaction::where('expense_id', $id)->value('id');

        $this->asAdmin()->patchJson("/api/system/treasury/transactions/{$txId}", ['amount_minor' => 1])->assertUnprocessable();
        $this->asAdmin()->deleteJson("/api/system/treasury/transactions/{$txId}")->assertUnprocessable();
    }

    public function test_an_expense_on_an_archived_account_cannot_be_deleted(): void
    {
        $account = $this->account();
        $id = $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $account->id]))->json('data.id');
        $account->update(['is_active' => false]);

        $this->asAdmin()->deleteJson("/api/system/expenses/{$id}")->assertUnprocessable();

        $this->assertNotSoftDeleted(Expense::find($id));
    }

    // ── Expense items ────────────────────────────────────────────────────────

    public function test_fixed_item_needs_an_amount_and_variable_does_not(): void
    {
        $category = ExpenseCategory::factory()->create();

        $this->asAdmin()->postJson('/api/system/expense-items', [
            'name' => 'Rent', 'category_id' => $category->id, 'type' => 'fixed', 'currency' => 'EGP',
        ])->assertUnprocessable()->assertJsonValidationErrors('default_amount_minor');

        $this->asAdmin()->postJson('/api/system/expense-items', [
            'name' => 'Ads', 'category_id' => $category->id, 'type' => 'variable', 'currency' => 'EGP',
        ])->assertCreated();
    }

    public function test_item_with_a_default_account_is_priced_in_its_currency(): void
    {
        $account = $this->account(['currency' => 'EUR']);

        $this->asAdmin()->postJson('/api/system/expense-items', [
            'name' => 'Rent', 'category_id' => ExpenseCategory::factory()->create()->id, 'type' => 'fixed',
            'default_amount_minor' => 1_000, 'default_account_id' => $account->id,
        ])->assertCreated()->assertJsonPath('data.currency', 'EUR');
    }

    public function test_recording_a_fixed_item_debits_its_default_account_at_its_amount(): void
    {
        $account = $this->account(['opening_balance_minor' => 100_000]);
        $item = ExpenseItem::factory()->create(['default_amount_minor' => 30_000, 'default_account_id' => $account->id]);

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-03',
        ])->assertCreated()
            ->assertJsonPath('data.amount_minor', 30_000)
            ->assertJsonPath('data.period', '2026-06')
            ->assertJsonPath('data.description', $item->name);

        $this->assertSame(70_000, $this->balanceOf($account));
    }

    public function test_a_fixed_item_records_only_once_a_month_even_when_paid_in_the_next(): void
    {
        $item = ExpenseItem::factory()->create();

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-05', 'occurred_on' => '2026-06-02',
        ])->assertCreated();

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-05', 'occurred_on' => '2026-06-03',
        ])->assertUnprocessable()->assertJsonValidationErrors('item_id');

        // June is a different month, even though May's was also paid in June.
        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-03',
        ])->assertCreated();
    }

    public function test_deleting_a_recorded_fixed_expense_makes_the_item_due_again(): void
    {
        $item = ExpenseItem::factory()->create();

        $id = $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-03',
        ])->json('data.id');

        $this->asAdmin()->deleteJson("/api/system/expenses/{$id}")->assertNoContent();

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-04',
        ])->assertCreated();
    }

    public function test_a_variable_item_needs_an_amount_and_can_repeat_in_a_month(): void
    {
        $item = ExpenseItem::factory()->variable()->create();

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-03',
        ])->assertUnprocessable()->assertJsonValidationErrors('amount_minor');

        foreach ([1_000, 2_500] as $amount) {
            $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
                'month' => '2026-06', 'occurred_on' => '2026-06-03', 'amount_minor' => $amount,
            ])->assertCreated();
        }

        $row = collect($this->asAdmin()->getJson('/api/system/expense-items?month=2026-06')->json('data'))
            ->firstWhere('id', $item->id);

        $this->assertSame([['currency' => 'USD', 'total_minor' => 3_500]], $row['recorded']);
        $this->assertCount(2, $row['expenses']);
    }

    public function test_paying_a_fixed_item_from_another_currency_requires_a_typed_amount(): void
    {
        $egp = $this->account(['currency' => 'EGP', 'opening_balance_minor' => 1_000_000]);
        $item = ExpenseItem::factory()->create(['currency' => 'USD', 'default_amount_minor' => 10_000]);

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-03', 'account_id' => $egp->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('amount_minor');

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-03', 'account_id' => $egp->id, 'amount_minor' => 500_000,
        ])->assertCreated()->assertJsonPath('data.currency', 'EGP');

        $this->assertSame(500_000, $this->balanceOf($egp));
    }

    public function test_an_explicit_null_account_overrides_the_items_default(): void
    {
        $account = $this->account(['opening_balance_minor' => 100_000]);
        $item = ExpenseItem::factory()->create(['default_account_id' => $account->id]);

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-03', 'account_id' => null,
        ])->assertCreated()->assertJsonPath('data.account', null);

        $this->assertSame(100_000, $this->balanceOf($account));
    }

    public function test_changing_a_fixed_items_amount_leaves_past_expenses_alone(): void
    {
        $item = ExpenseItem::factory()->create(['default_amount_minor' => 10_000]);

        $id = $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-05', 'occurred_on' => '2026-05-03',
        ])->json('data.id');

        $this->asAdmin()->patchJson("/api/system/expense-items/{$item->id}", ['default_amount_minor' => 12_000])->assertOk();

        $this->assertSame(10_000, Expense::find($id)->amount_minor);
    }

    public function test_monthly_view_reports_due_overdue_and_totals(): void
    {
        $paid    = ExpenseItem::factory()->create(['name' => 'Paid', 'default_amount_minor' => 1_000, 'due_day' => 1]);
        $overdue = ExpenseItem::factory()->create(['name' => 'Late', 'default_amount_minor' => 2_000, 'due_day' => 10]);
        $notYet  = ExpenseItem::factory()->create(['name' => 'Soon', 'default_amount_minor' => 4_000, 'due_day' => 31]);

        $this->asAdmin()->postJson("/api/system/expense-items/{$paid->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-01',
        ])->assertCreated();

        // One-off spending in the month, belonging to no item.
        Expense::factory()->create(['currency' => 'USD', 'amount_minor' => 700, 'occurred_on' => '2026-06-20']);

        $response = $this->asAdmin()->getJson('/api/system/expense-items?month=2026-06')->assertOk();
        $rows = collect($response->json('data'));

        $this->assertTrue($rows->firstWhere('id', $paid->id)['is_recorded']);
        $this->assertFalse($rows->firstWhere('id', $paid->id)['is_overdue']);
        $this->assertTrue($rows->firstWhere('id', $overdue->id)['is_overdue']);
        $this->assertFalse($rows->firstWhere('id', $notYet->id)['is_overdue']);
        // June has 30 days, so a due day of 31 clamps to the 30th.
        $this->assertSame('2026-06-30', $rows->firstWhere('id', $notYet->id)['due_on']);

        $response
            ->assertJsonPath('summary.fixed_expected.0.total_minor', 7_000)
            ->assertJsonPath('summary.fixed_outstanding.0.total_minor', 6_000)
            ->assertJsonPath('summary.recorded.0.total_minor', 1_000)
            ->assertJsonPath('summary.one_off.0.total_minor', 700);
    }

    public function test_a_new_item_is_not_due_in_months_before_it_existed_but_can_be_backfilled(): void
    {
        $item = ExpenseItem::factory()->create(['default_amount_minor' => 2_000, 'due_day' => 1]);

        $response = $this->asAdmin()->getJson('/api/system/expense-items?month=2026-04')->assertOk();
        $row = collect($response->json('data'))->firstWhere('id', $item->id);

        $this->assertFalse($row['is_expected']);
        $this->assertFalse($row['is_overdue']);
        $this->assertSame([], $response->json('summary.fixed_outstanding'));

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-04', 'occurred_on' => '2026-06-03',
        ])->assertCreated();

        $row = collect($this->asAdmin()->getJson('/api/system/expense-items?month=2026-04')->json('data'))
            ->firstWhere('id', $item->id);

        $this->assertTrue($row['is_expected']);
        $this->assertTrue($row['is_recorded']);
    }

    public function test_deleted_item_keeps_its_name_on_past_expenses(): void
    {
        $item = ExpenseItem::factory()->create(['name' => 'Old rent']);

        $id = $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-03',
        ])->json('data.id');

        $this->asAdmin()->deleteJson("/api/system/expense-items/{$item->id}")->assertNoContent();

        $this->asAdmin()->getJson("/api/system/expenses/{$id}")
            ->assertOk()
            ->assertJsonPath('data.item.name', 'Old rent');
    }

    public function test_profit_and_loss_counts_an_account_expense_exactly_once(): void
    {
        $account = $this->account(['currency' => 'EGP', 'opening_balance_minor' => 1_000_000]);

        $this->asAdmin()->postJson('/api/system/expenses', $this->expensePayload([
            'account_id' => $account->id, 'amount_minor' => 5_000, 'occurred_on' => '2026-06-01',
        ]))->assertCreated();

        $statement = app(ProfitLossCalculator::class)
            ->statement(Carbon::parse('2026-06-01'), Carbon::parse('2026-06-30'), 'EGP');

        $this->assertSame(5_000, $statement->expenses);
    }

    // ── Permissions ──────────────────────────────────────────────────────────

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/system/treasury/accounts')->assertUnauthorized();
    }

    public function test_supervisor_cannot_see_treasury(): void
    {
        $this->actingAs($this->staffUser('supervisor'), 'sanctum')
            ->getJson('/api/system/treasury/accounts')
            ->assertForbidden();
    }

    public function test_accountant_can_post_movements_but_not_manage_accounts(): void
    {
        $account = $this->account();
        $accountant = $this->staffUser('accountant');

        $this->actingAs($accountant, 'sanctum')->getJson('/api/system/treasury/accounts')->assertOk();
        $this->actingAs($accountant, 'sanctum')
            ->postJson('/api/system/treasury/transactions', $this->movement($account))
            ->assertCreated();

        $this->actingAs($accountant, 'sanctum')
            ->patchJson("/api/system/treasury/accounts/{$account->id}", ['opening_balance_minor' => 999])
            ->assertForbidden();
        $this->actingAs($accountant, 'sanctum')
            ->deleteJson("/api/system/treasury/accounts/{$account->id}")
            ->assertForbidden();
    }

    public function test_expense_rights_alone_cannot_move_money_on_an_account(): void
    {
        $account = $this->account(['opening_balance_minor' => 20_000]);

        $user = $this->staffUser('supervisor');
        $user->givePermissionTo('expenses.create');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/system/expenses', $this->expensePayload(['account_id' => $account->id]))
            ->assertForbidden();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/system/expenses', $this->expensePayload(['currency' => 'USD']))
            ->assertCreated();

        $this->assertSame(20_000, $this->balanceOf($account));
    }

    public function test_expense_rights_alone_cannot_record_an_item_onto_its_default_account(): void
    {
        $account = $this->account(['opening_balance_minor' => 20_000]);
        $item = ExpenseItem::factory()->create(['default_account_id' => $account->id]);

        $user = $this->staffUser('supervisor');
        $user->givePermissionTo('expenses.create');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/system/expense-items/{$item->id}/record", ['month' => '2026-06', 'occurred_on' => '2026-06-03'])
            ->assertForbidden();

        $this->assertSame(0, Expense::count());
    }

    public function test_managing_items_is_not_part_of_the_accountant_defaults(): void
    {
        $this->actingAs($this->staffUser('accountant'), 'sanctum')
            ->postJson('/api/system/expense-items', [
                'name' => 'Rent', 'category_id' => ExpenseCategory::factory()->create()->id,
                'type' => 'fixed', 'default_amount_minor' => 100, 'currency' => 'EGP',
            ])->assertForbidden();
    }
}

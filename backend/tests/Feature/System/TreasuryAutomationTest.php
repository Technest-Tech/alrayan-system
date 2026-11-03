<?php

namespace Tests\Feature\System;

use App\Models\System\Expense;
use App\Models\System\ExpenseCategory;
use App\Models\System\ExpenseItem;
use App\Models\System\Lead;
use App\Models\System\Payroll;
use App\Models\System\Student;
use App\Models\System\StudentPackage;
use App\Models\System\TreasuryAccount;
use App\Models\System\TreasuryTransaction;
use App\Services\System\FixedExpenseAutoRecorder;
use App\Services\System\LeadToStudentConverter;
use App\Support\System\TreasuryRouting;
use Carbon\Carbon;
use Tests\SystemTestCase;

class TreasuryAutomationTest extends SystemTestCase
{
    private TreasuryAccount $usd;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-06-15 12:00:00');

        $this->usd = TreasuryAccount::factory()->create([
            'currency' => 'USD', 'opening_balance_minor' => 100_000, 'opening_date' => '2026-01-01',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function routeTo(TreasuryAccount $account, string $audience = TreasuryRouting::STUDENTS): void
    {
        TreasuryRouting::save(array_replace_recursive(TreasuryRouting::all(), [
            $audience => [$account->currency => $account->id],
        ]));
    }

    private function package(array $attrs = []): StudentPackage
    {
        return StudentPackage::create(array_merge([
            'student_id'     => Student::factory()->create()->id,
            'package_number' => 1,
            'package_hours'  => 8,
            'tariff_at_time' => 40_000,
            'currency'       => 'USD',
            'status'         => 'pending',
        ], $attrs));
    }

    private function balance(TreasuryAccount $account): int
    {
        return $this->asAdmin()
            ->getJson("/api/system/treasury/accounts/{$account->id}")
            ->json('data.balance_minor');
    }

    // ── Student payments ─────────────────────────────────────────────────────

    public function test_paying_a_package_deposits_its_price_into_the_routed_account(): void
    {
        $this->routeTo($this->usd);
        $package = $this->package();

        $package->update(['status' => 'paid', 'paid_at' => '2026-06-10 09:00:00']);

        $this->assertSame(140_000, $this->balance($this->usd));

        $row = TreasuryTransaction::firstOrFail();
        $this->assertSame('in', $row->direction);
        $this->assertSame('student_payment', $row->kind);
        $this->assertSame('2026-06-10', $row->occurred_on->toDateString());
        $this->assertSame($package->student->name, $row->counterparty);
    }

    public function test_paying_through_the_api_deposits_too(): void
    {
        $this->routeTo($this->usd);
        $package = $this->package();

        $this->asAdmin()->postJson("/api/system/student-packages/{$package->id}/confirm")->assertOk();

        $this->assertSame(140_000, $this->balance($this->usd));
    }

    public function test_no_account_for_the_currency_means_no_movement_and_the_payment_still_succeeds(): void
    {
        $this->routeTo($this->usd);
        $package = $this->package(['currency' => 'EUR']);

        $package->update(['status' => 'paid', 'paid_at' => now()]);

        $this->assertSame('paid', $package->fresh()->status);
        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_nothing_is_posted_until_an_account_is_chosen(): void
    {
        $this->package()->update(['status' => 'paid', 'paid_at' => now()]);

        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_an_archived_routed_account_receives_nothing(): void
    {
        $this->routeTo($this->usd);
        $this->usd->update(['is_active' => false]);

        $this->package()->update(['status' => 'paid', 'paid_at' => now()]);

        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_a_package_created_paid_is_not_money_received(): void
    {
        $this->routeTo($this->usd);

        // The down payment #0 opens paid at a trial lesson, before anything is collected.
        $this->package(['package_number' => 0, 'status' => 'paid', 'paid_at' => now()]);

        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_renumbering_a_legacy_package_into_the_down_payment_is_not_a_payment(): void
    {
        $this->routeTo($this->usd);
        $package = $this->package();

        $package->update(['package_number' => 0, 'status' => 'paid', 'paid_at' => now()]);

        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_closing_a_lead_deposits_the_down_payment_once(): void
    {
        $this->routeTo($this->usd);

        $lead = Lead::create([
            'name'     => 'Paying Lead',
            'email'    => 'paying-lead@example.test',
            'whatsapp' => '+100000001',
            'country'  => 'EG',
            'status'   => 'new_lead',
            'source'   => 'manual',
        ]);
        $lead->forceFill(['student_id' => null])->saveQuietly();

        app(LeadToStudentConverter::class)->convert($lead->fresh(), [
            'student_type'        => 'adult',
            'timezone'            => 'UTC',
            'currency'            => 'USD',
            'package_hours'       => 4,
            'package_price_minor' => 25_000,
        ]);

        $this->assertSame(125_000, $this->balance($this->usd));
        $this->assertSame(1, TreasuryTransaction::count());
    }

    public function test_paying_a_free_package_posts_nothing(): void
    {
        $this->routeTo($this->usd);

        $this->package(['tariff_at_time' => 0])->update(['status' => 'paid', 'paid_at' => now()]);

        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_money_paid_before_the_account_opened_is_already_in_its_opening_balance(): void
    {
        $this->routeTo($this->usd);

        $this->package()->update(['status' => 'paid', 'paid_at' => '2025-12-31 09:00:00']);

        $this->assertSame(100_000, $this->balance($this->usd));
    }

    public function test_sending_a_package_back_to_pending_takes_the_money_out_again(): void
    {
        $this->routeTo($this->usd);
        $package = $this->package();
        $package->update(['status' => 'paid', 'paid_at' => now()]);

        $package->update(['status' => 'pending', 'paid_at' => null]);

        $this->assertSame(100_000, $this->balance($this->usd));
    }

    public function test_paying_again_after_going_back_to_pending_deposits_once(): void
    {
        $this->routeTo($this->usd);
        $package = $this->package();

        $package->update(['status' => 'paid', 'paid_at' => now()]);
        $package->update(['status' => 'pending', 'paid_at' => null]);
        $package->update(['status' => 'paid', 'paid_at' => now()]);

        $this->assertSame(140_000, $this->balance($this->usd));
    }

    public function test_correcting_a_paid_packages_price_and_date_updates_its_movement(): void
    {
        $this->routeTo($this->usd);
        $package = $this->package();
        $package->update(['status' => 'paid', 'paid_at' => '2026-06-10 09:00:00']);

        $package->update(['tariff_at_time' => 50_000, 'paid_at' => '2026-06-12 09:00:00']);

        $this->assertSame(150_000, $this->balance($this->usd));
        $this->assertSame('2026-06-12', TreasuryTransaction::firstOrFail()->occurred_on->toDateString());
    }

    public function test_correcting_a_package_paid_before_routing_existed_does_not_deposit_it(): void
    {
        $package = $this->package();
        $package->update(['status' => 'paid', 'paid_at' => '2026-03-01 09:00:00']);

        $this->routeTo($this->usd);
        $package->update(['tariff_at_time' => 50_000]);

        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_later_routing_changes_leave_existing_movements_where_they_are(): void
    {
        $this->routeTo($this->usd);
        $package = $this->package();
        $package->update(['status' => 'paid', 'paid_at' => now()]);

        $other = TreasuryAccount::factory()->create(['currency' => 'USD', 'opening_balance_minor' => 0]);
        $this->routeTo($other);
        $package->update(['tariff_at_time' => 50_000]);

        $this->assertSame(150_000, $this->balance($this->usd));
        $this->assertSame(0, $this->balance($other));
    }

    public function test_deleting_a_paid_package_removes_the_money_and_restoring_brings_it_back(): void
    {
        $this->routeTo($this->usd);
        $package = $this->package();
        $package->update(['status' => 'paid', 'paid_at' => now()]);

        $package->delete();
        $this->assertSame(100_000, $this->balance($this->usd));

        $package->restore();
        $this->assertSame(140_000, $this->balance($this->usd));
        $this->assertSame(1, TreasuryTransaction::count());
    }

    public function test_an_automatic_movement_cannot_be_edited_or_deleted_from_the_ledger(): void
    {
        $this->routeTo($this->usd);
        $this->package()->update(['status' => 'paid', 'paid_at' => now()]);
        $id = TreasuryTransaction::firstOrFail()->id;

        $this->asAdmin()->patchJson("/api/system/treasury/transactions/{$id}", ['amount_minor' => 1])->assertUnprocessable();
        $this->asAdmin()->deleteJson("/api/system/treasury/transactions/{$id}")->assertUnprocessable();
    }

    // ── Teacher salaries ─────────────────────────────────────────────────────

    private function approvedPayroll(array $attrs = []): Payroll
    {
        return Payroll::factory()->create(array_merge([
            'status'           => 'approved',
            'currency'         => 'USD',
            'net_salary_minor' => 30_000,
            'period_year'      => 2026,
            'period_month'     => 5,
        ], $attrs));
    }

    public function test_transferring_a_payroll_takes_the_salary_out_of_the_routed_account(): void
    {
        $this->routeTo($this->usd, TreasuryRouting::TEACHERS);
        $payroll = $this->approvedPayroll();

        $this->asAdmin()
            ->postJson("/api/system/payrolls/{$payroll->id}/mark-transferred", ['transfer_reference' => 'WISE-1'])
            ->assertOk();

        $this->assertSame(70_000, $this->balance($this->usd));

        $row = TreasuryTransaction::firstOrFail();
        $this->assertSame('out', $row->direction);
        $this->assertSame('teacher_salary', $row->kind);
        $this->assertSame('WISE-1', $row->reference);
    }

    public function test_a_bulk_transfer_posts_each_salary(): void
    {
        $this->routeTo($this->usd, TreasuryRouting::TEACHERS);
        $first  = $this->approvedPayroll();
        $second = $this->approvedPayroll(['period_month' => 4, 'net_salary_minor' => 10_000]);

        $this->asAdmin()->postJson('/api/system/payrolls/bulk-transfer', [
            'items' => [
                ['id' => $first->id, 'transfer_reference' => 'BATCH-1'],
                ['id' => $second->id, 'transfer_reference' => 'BATCH-1'],
            ],
        ])->assertOk();

        $this->assertSame(60_000, $this->balance($this->usd));
    }

    public function test_approving_a_payroll_moves_no_money(): void
    {
        $this->routeTo($this->usd, TreasuryRouting::TEACHERS);
        $payroll = $this->approvedPayroll(['status' => 'pending']);

        $payroll->update(['status' => 'approved', 'approved_at' => now()]);

        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_student_and_teacher_money_can_use_different_accounts(): void
    {
        $bank = TreasuryAccount::factory()->create(['currency' => 'USD', 'opening_balance_minor' => 100_000]);
        $this->routeTo($this->usd, TreasuryRouting::STUDENTS);
        $this->routeTo($bank, TreasuryRouting::TEACHERS);

        $this->package()->update(['status' => 'paid', 'paid_at' => now()]);
        $this->approvedPayroll()->update(['status' => 'transferred', 'transferred_at' => now()]);

        $this->assertSame(140_000, $this->balance($this->usd));
        $this->assertSame(70_000, $this->balance($bank));
    }

    public function test_a_payroll_with_nothing_to_pay_posts_nothing(): void
    {
        $this->routeTo($this->usd, TreasuryRouting::TEACHERS);

        $this->approvedPayroll(['net_salary_minor' => -500])
            ->update(['status' => 'transferred', 'transferred_at' => now()]);

        $this->assertSame(0, TreasuryTransaction::count());
    }

    public function test_salary_movements_do_not_add_to_profit_and_loss_expenses(): void
    {
        $this->routeTo($this->usd, TreasuryRouting::TEACHERS);

        $this->approvedPayroll()->update(['status' => 'transferred', 'transferred_at' => now()]);

        $this->assertSame(0, Expense::count());
    }

    // ── Choosing the accounts ────────────────────────────────────────────────

    public function test_admin_chooses_accounts_per_currency(): void
    {
        $egp = TreasuryAccount::factory()->create(['currency' => 'EGP']);

        $this->asAdmin()->putJson('/api/system/treasury/auto-posting', [
            'students' => ['USD' => $this->usd->id, 'EGP' => $egp->id],
            'teachers' => ['USD' => null],
        ])->assertOk()
            ->assertJsonPath('data.students.EGP', $egp->id)
            ->assertJsonPath('data.teachers', []);
    }

    public function test_an_account_in_the_wrong_currency_is_refused(): void
    {
        $this->asAdmin()->putJson('/api/system/treasury/auto-posting', [
            'students' => ['EGP' => $this->usd->id],
            'teachers' => [],
        ])->assertUnprocessable()->assertJsonValidationErrors('students.EGP');
    }

    public function test_an_archived_account_is_refused(): void
    {
        $this->usd->update(['is_active' => false]);

        $this->asAdmin()->putJson('/api/system/treasury/auto-posting', [
            'students' => ['USD' => $this->usd->id],
            'teachers' => [],
        ])->assertUnprocessable();
    }

    public function test_the_response_lists_currencies_in_use_even_without_an_account(): void
    {
        $this->package(['currency' => 'EUR']);

        $response = $this->asAdmin()->getJson('/api/system/treasury/auto-posting')->assertOk();

        $this->assertContains('EUR', $response->json('currencies.students'));
        $this->assertContains('USD', $response->json('currencies.teachers'));
    }

    public function test_accountant_can_see_but_not_change_the_routing(): void
    {
        $accountant = $this->staffUser('accountant');

        $this->actingAs($accountant, 'sanctum')->getJson('/api/system/treasury/auto-posting')->assertOk();
        $this->actingAs($accountant, 'sanctum')
            ->putJson('/api/system/treasury/auto-posting', ['students' => [], 'teachers' => []])
            ->assertForbidden();
    }

    // ── Automatic fixed expenses ─────────────────────────────────────────────

    private function autoItem(array $attrs = []): ExpenseItem
    {
        return ExpenseItem::factory()->create(array_merge([
            'default_account_id'   => $this->usd->id,
            'default_amount_minor' => 10_000,
            'due_day'              => 10,
            'auto_record'          => true,
            'auto_record_since'    => '2026-06-01',
        ], $attrs));
    }

    private function runRecorder(): int
    {
        return app(FixedExpenseAutoRecorder::class)->run();
    }

    public function test_a_due_automatic_item_is_recorded_on_its_due_date_from_its_account(): void
    {
        $item = $this->autoItem();

        $this->assertSame(1, $this->runRecorder());

        $expense = Expense::firstOrFail();
        $this->assertSame($item->id, $expense->item_id);
        $this->assertSame('2026-06', $expense->period);
        $this->assertSame('2026-06-10', $expense->occurred_on->toDateString());
        $this->assertSame(90_000, $this->balance($this->usd));
    }

    public function test_running_again_records_nothing_more(): void
    {
        $this->autoItem();

        $this->runRecorder();

        $this->assertSame(0, $this->runRecorder());
        $this->assertSame(1, Expense::count());
    }

    public function test_an_item_not_set_to_automatic_is_left_alone(): void
    {
        $this->autoItem(['auto_record' => false]);

        $this->assertSame(0, $this->runRecorder());
    }

    public function test_an_item_is_not_recorded_before_its_due_date(): void
    {
        $this->autoItem(['due_day' => 20]);

        $this->assertSame(0, $this->runRecorder());
    }

    public function test_turning_automatic_on_after_the_due_date_waits_for_next_month(): void
    {
        $this->autoItem(['auto_record_since' => '2026-06-15', 'due_day' => 10]);

        $this->assertSame(0, $this->runRecorder());

        Carbon::setTestNow('2026-07-10 12:00:00');
        $this->assertSame(1, $this->runRecorder());
        $this->assertSame('2026-07', Expense::firstOrFail()->period);
    }

    public function test_an_item_already_recorded_by_hand_is_not_recorded_again(): void
    {
        $item = $this->autoItem();

        $this->asAdmin()->postJson("/api/system/expense-items/{$item->id}/record", [
            'month' => '2026-06', 'occurred_on' => '2026-06-05',
        ])->assertCreated();

        $this->assertSame(0, $this->runRecorder());
        $this->assertSame(90_000, $this->balance($this->usd));
    }

    public function test_an_automatic_expense_someone_deleted_does_not_come_back(): void
    {
        $this->autoItem();
        $this->runRecorder();

        $this->asAdmin()->deleteJson('/api/system/expenses/' . Expense::firstOrFail()->id)->assertNoContent();

        $this->assertSame(0, $this->runRecorder());
        $this->assertSame(100_000, $this->balance($this->usd));
    }

    public function test_scheduler_downtime_across_the_new_month_is_caught_up(): void
    {
        $this->autoItem(['due_day' => 30]);

        Carbon::setTestNow('2026-07-02 12:00:00');

        $this->assertSame(1, $this->runRecorder());
        $this->assertSame('2026-06', Expense::firstOrFail()->period);
    }

    public function test_an_archived_account_is_skipped_without_stopping_the_other_items(): void
    {
        $closed = TreasuryAccount::factory()->create(['is_active' => false, 'opening_balance_minor' => 0]);
        $this->autoItem(['default_account_id' => $closed->id]);
        $this->autoItem();

        $this->assertSame(1, $this->runRecorder());
        $this->assertSame(1, Expense::count());
    }

    public function test_the_scheduled_command_runs(): void
    {
        $this->autoItem();

        $this->artisan('treasury:record-automatic-expenses')->assertSuccessful();

        $this->assertSame(1, Expense::count());
    }

    public function test_turning_automatic_on_stamps_today_and_off_clears_it(): void
    {
        $item = ExpenseItem::factory()->create(['default_account_id' => $this->usd->id]);

        $this->asAdmin()->patchJson("/api/system/expense-items/{$item->id}", ['auto_record' => true])->assertOk();
        $this->assertSame('2026-06-15', $item->fresh()->auto_record_since->toDateString());

        // Editing something else must not push the start date forward.
        Carbon::setTestNow('2026-06-20 12:00:00');
        $this->asAdmin()->patchJson("/api/system/expense-items/{$item->id}", ['name' => 'Renamed'])->assertOk();
        $this->assertSame('2026-06-15', $item->fresh()->auto_record_since->toDateString());

        $this->asAdmin()->patchJson("/api/system/expense-items/{$item->id}", ['auto_record' => false])->assertOk();
        $this->assertNull($item->fresh()->auto_record_since);
    }

    public function test_automatic_needs_an_account(): void
    {
        $this->asAdmin()->postJson('/api/system/expense-items', [
            'name' => 'Rent', 'category_id' => ExpenseCategory::factory()->create()->id, 'type' => 'fixed',
            'default_amount_minor' => 100, 'currency' => 'USD', 'auto_record' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('auto_record');
    }

    public function test_removing_the_account_from_an_automatic_item_is_refused(): void
    {
        $item = $this->autoItem();

        $this->asAdmin()->patchJson("/api/system/expense-items/{$item->id}", ['default_account_id' => null])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('auto_record');
    }

    public function test_a_variable_item_cannot_be_automatic(): void
    {
        $this->asAdmin()->postJson('/api/system/expense-items', [
            'name' => 'Ads', 'category_id' => ExpenseCategory::factory()->create()->id, 'type' => 'variable',
            'default_account_id' => $this->usd->id, 'auto_record' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('auto_record');
    }

    public function test_switching_an_item_to_variable_switches_automatic_off(): void
    {
        $item = $this->autoItem();

        $this->asAdmin()->patchJson("/api/system/expense-items/{$item->id}", ['type' => 'variable', 'default_amount_minor' => null])
            ->assertOk();

        $this->assertFalse($item->fresh()->auto_record);
    }
}

<?php

namespace Tests\Feature\System;

use App\Models\System\Expense;
use App\Models\System\ExpenseCategory;
use Illuminate\Support\Facades\Cache;
use Tests\SystemTestCase;

class ExpensesEndpointsTest extends SystemTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_admin_can_list_expenses(): void
    {
        Expense::factory()->count(3)->create();

        $this->asAdmin()
            ->getJson('/api/system/expenses')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_expenses_requires_auth(): void
    {
        $this->getJson('/api/system/expenses')
            ->assertUnauthorized();
    }

    public function test_list_expenses_filter_by_category_id(): void
    {
        $category = ExpenseCategory::factory()->create();
        Expense::factory()->create(['category_id' => $category->id]);
        Expense::factory()->create();

        $response = $this->asAdmin()
            ->getJson('/api/system/expenses?filter[category_id]=' . $category->id);

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($category->id, $data[0]['category']['id']);
    }

    public function test_list_expenses_filter_by_currency(): void
    {
        Expense::factory()->create(['currency' => 'USD']);
        Expense::factory()->create(['currency' => 'EGP']);

        $response = $this->asAdmin()
            ->getJson('/api/system/expenses?filter[currency]=USD');

        $response->assertOk();
        foreach ($response->json('data') as $item) {
            $this->assertEquals('USD', $item['currency']);
        }
    }

    public function test_list_expenses_filter_by_date_range(): void
    {
        Expense::factory()->create(['occurred_on' => '2026-01-15']);
        Expense::factory()->create(['occurred_on' => '2026-03-20']);

        $response = $this->asAdmin()
            ->getJson('/api/system/expenses?filter[from]=2026-01-01&filter[to]=2026-02-01');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('2026-01-15', substr($data[0]['occurred_on'], 0, 10));
    }

    public function test_list_expenses_filter_by_q_searches_description(): void
    {
        Expense::factory()->create(['description' => 'Unique zoom subscription cost']);
        Expense::factory()->create(['description' => 'Office supplies purchase']);

        $response = $this->asAdmin()
            ->getJson('/api/system/expenses?filter[q]=zoom');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertStringContainsString('zoom', strtolower($data[0]['description']));
    }

    public function test_admin_can_show_expense(): void
    {
        $expense = Expense::factory()->create();

        $this->asAdmin()
            ->getJson('/api/system/expenses/' . $expense->id)
            ->assertOk()
            ->assertJsonPath('data.id', $expense->id);
    }

    public function test_show_expense_returns_404_for_missing(): void
    {
        $this->asAdmin()
            ->getJson('/api/system/expenses/9999')
            ->assertNotFound();
    }

    public function test_admin_can_create_expense(): void
    {
        $category = ExpenseCategory::factory()->create();

        $payload = [
            'category_id'  => $category->id,
            'amount_minor' => 15000,
            'currency'     => 'EGP',
            'description'  => 'Test expense description',
            'occurred_on'  => '2026-05-01',
        ];

        $response = $this->asAdmin()
            ->postJson('/api/system/expenses', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.amount_minor', 15000)
            ->assertJsonPath('data.currency', 'EGP');

        $this->assertDatabaseHas('sys_expenses', [
            'category_id'  => $category->id,
            'amount_minor' => 15000,
            'currency'     => 'EGP',
        ]);
    }

    public function test_create_expense_validates_required_fields(): void
    {
        $this->asAdmin()
            ->postJson('/api/system/expenses', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['category_id', 'amount_minor', 'currency', 'occurred_on']);
    }

    public function test_admin_can_update_expense(): void
    {
        $expense = Expense::factory()->create(['amount_minor' => 5000]);

        $this->asAdmin()
            ->patchJson('/api/system/expenses/' . $expense->id, ['amount_minor' => 9999])
            ->assertOk()
            ->assertJsonPath('data.amount_minor', 9999);

        $this->assertDatabaseHas('sys_expenses', ['id' => $expense->id, 'amount_minor' => 9999]);
    }

    public function test_admin_can_delete_expense(): void
    {
        $expense = Expense::factory()->create();

        $this->asAdmin()
            ->deleteJson('/api/system/expenses/' . $expense->id)
            ->assertNoContent();

        $this->assertSoftDeleted('sys_expenses', ['id' => $expense->id]);
    }

    public function test_admin_can_list_expense_categories(): void
    {
        ExpenseCategory::factory()->count(2)->create();

        $this->asAdmin()
            ->getJson('/api/system/expense-categories')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_admin_can_create_expense_category(): void
    {
        $this->asAdmin()
            ->postJson('/api/system/expense-categories', ['name' => 'Travel Costs'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Travel Costs');

        $this->assertDatabaseHas('sys_expense_categories', ['name' => 'Travel Costs']);
    }

    public function test_create_category_validates_name_required(): void
    {
        $this->asAdmin()
            ->postJson('/api/system/expense-categories', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_admin_can_deactivate_expense_category(): void
    {
        $category = ExpenseCategory::factory()->create(['is_active' => true]);

        $this->asAdmin()
            ->postJson('/api/system/expense-categories/' . $category->id . '/deactivate')
            ->assertOk();

        $this->assertDatabaseHas('sys_expense_categories', [
            'id'        => $category->id,
            'is_active' => false,
        ]);
    }

    public function test_teacher_without_permission_cannot_list_expenses(): void
    {
        ['user' => $user] = $this->teacherUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/system/expenses')
            ->assertForbidden();
    }
}

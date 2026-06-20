<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\System\BillingSeeder;
use Database\Seeders\System\LeadSeeder;
use Database\Seeders\System\RolePermissionSeeder;
use Database\Seeders\System\ScheduleSessionSeeder;
use Database\Seeders\System\SystemDemoSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed roles + permissions first so the admin user gets the admin role
        $this->call([RolePermissionSeeder::class]);

        $admin = User::firstOrCreate(
            ['email' => 'admin@alrayan-academy.com'],
            [
                'name'      => 'Azhary Admin',
                'password'  => bcrypt('password'),
                'role'      => 'admin',
                'is_active' => true,
            ],
        );
        $admin->syncRoles(['admin']);

        $this->call([
            BlogCategorySeeder::class,
            BlogPostSeeder::class,
            CourseSeeder::class,
            TeacherSeeder::class,
            SystemDemoSeeder::class,
            LeadSeeder::class,
            ScheduleSessionSeeder::class,
            BillingSeeder::class,
        ]);
    }
}

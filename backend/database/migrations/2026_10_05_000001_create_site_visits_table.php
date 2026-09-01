<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        // First-party traffic analytics for the public marketing site.
        //
        // No IP address and no cookie is ever stored. A visitor is identified by
        // `visitor_hash` = sha256(ip + user agent + daily salt), so the same
        // person is one visitor for the rest of the day and becomes
        // unrecognisable tomorrow. That keeps "unique visitors" meaningful
        // without holding anything that identifies a person.
        Schema::create('site_visits', function (Blueprint $table) {
            $table->id();

            $table->char('visitor_hash', 64);
            $table->char('session_hash', 64);

            $table->string('path', 255);
            $table->string('locale', 5)->nullable();

            // Where they came from.
            $table->string('referrer_host', 255)->nullable();
            $table->string('referrer', 512)->nullable();
            $table->string('utm_source', 100)->nullable();
            $table->string('utm_medium', 100)->nullable();
            $table->string('utm_campaign', 100)->nullable();

            // Who they are, roughly. Country comes from the CDN/proxy header
            // when one is present — we do no GeoIP lookup of our own.
            $table->char('country', 2)->nullable();
            $table->string('device', 10)->nullable();   // desktop | mobile | tablet
            $table->string('browser', 40)->nullable();
            $table->string('os', 40)->nullable();
            $table->boolean('is_bot')->default(false);

            $table->timestamp('created_at')->nullable();

            // Every dashboard query is "a window of time, then group by X", so
            // each index leads with created_at. Names are given explicitly and
            // kept short — MySQL caps index names at 64 characters.
            $table->index('created_at', 'sv_created_idx');
            $table->index(['created_at', 'is_bot'], 'sv_created_bot_idx');
            $table->index(['created_at', 'path'], 'sv_created_path_idx');
            $table->index(['created_at', 'country'], 'sv_created_country_idx');
            $table->index(['created_at', 'referrer_host'], 'sv_created_ref_idx');
            $table->index(['created_at', 'visitor_hash'], 'sv_created_visitor_idx');
            $table->index('session_hash', 'sv_session_idx');
        });

        // Viewing site traffic is part of managing the site.
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        $perm = Permission::firstOrCreate(['name' => 'site.view_analytics', 'guard_name' => 'web']);
        if ($admin = Role::where('name', 'admin')->where('guard_name', 'web')->first()) {
            $admin->givePermissionTo($perm);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('site_visits');
        Permission::where('name', 'site.view_analytics')->where('guard_name', 'web')->delete();
    }
};

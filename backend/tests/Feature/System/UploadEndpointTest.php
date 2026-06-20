<?php

namespace Tests\Feature\System;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\SystemTestCase;

class UploadEndpointTest extends SystemTestCase
{
    public function test_admin_can_upload_a_photo_and_gets_a_url(): void
    {
        Storage::fake('public');

        $this->asAdmin()
            ->postJson('/api/system/uploads', [
                'file'   => UploadedFile::fake()->image('avatar.png'),
                'folder' => 'photos',
            ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['path', 'url']]);

        $this->assertCount(1, Storage::disk('public')->files('system/photos'));
    }

    public function test_upload_rejects_disallowed_file_types(): void
    {
        Storage::fake('public');

        $this->asAdmin()
            ->postJson('/api/system/uploads', [
                'file' => UploadedFile::fake()->create('malware.exe', 10, 'application/octet-stream'),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['file']);
    }

    public function test_guest_cannot_upload(): void
    {
        $this->postJson('/api/system/uploads', [
            'file' => UploadedFile::fake()->image('x.png'),
        ])->assertUnauthorized();
    }
}

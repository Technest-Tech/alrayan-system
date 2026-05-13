<?php

namespace App\Services\Integrations\Zoom;

use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\Client\Factory as HttpClient;
use Illuminate\Support\Facades\DB;

class ZoomClient
{
    public function __construct(
        private string          $accountId,
        private string          $clientId,
        private string          $clientSecret,
        private HttpClient      $http,
        private CacheRepository $cache,
    ) {}

    public function createMeeting(MeetingRequest $req): MeetingResponse
    {
        $token = $this->bearerToken();

        $res = $this->http->withToken($token)
            ->post('https://api.zoom.us/v2/users/me/meetings', [
                'topic'      => $req->topic,
                'type'       => 2,
                'start_time' => $req->startUtc->toIso8601String(),
                'duration'   => $req->durationMinutes,
                'timezone'   => 'UTC',
                'settings'   => [
                    'host_video'        => true,
                    'participant_video' => true,
                    'mute_upon_entry'   => true,
                    'waiting_room'      => true,
                    'auto_recording'    => 'none',
                ],
            ])->throw()->json();

        $this->recordSuccess();

        return new MeetingResponse(
            meetingId: (string) $res['id'],
            joinUrl:   $res['join_url'],
            startUrl:  $res['start_url'],
        );
    }

    public function updateMeeting(string $meetingId, MeetingRequest $req): void
    {
        $this->http->withToken($this->bearerToken())
            ->patch("https://api.zoom.us/v2/meetings/{$meetingId}", [
                'topic'      => $req->topic,
                'start_time' => $req->startUtc->toIso8601String(),
                'duration'   => $req->durationMinutes,
            ])->throw();

        $this->recordSuccess();
    }

    public function deleteMeeting(string $meetingId): void
    {
        $this->http->withToken($this->bearerToken())
            ->delete("https://api.zoom.us/v2/meetings/{$meetingId}")
            ->throw();

        $this->recordSuccess();
    }

    private function bearerToken(): string
    {
        return $this->cache->remember('zoom_oauth_token', 3000, function () {
            $res = $this->http
                ->withBasicAuth($this->clientId, $this->clientSecret)
                ->asForm()
                ->post('https://zoom.us/oauth/token', [
                    'grant_type' => 'account_credentials',
                    'account_id' => $this->accountId,
                ])->throw()->json();

            return $res['access_token'];
        });
    }

    private function recordSuccess(): void
    {
        DB::table('sys_settings')->updateOrInsert(
            ['key' => 'zoom.last_success_at'],
            ['value' => now()->toIso8601String(), 'updated_at' => now(), 'created_at' => now()]
        );
        DB::table('sys_settings')->updateOrInsert(
            ['key' => 'zoom.last_error'],
            ['value' => '', 'updated_at' => now(), 'created_at' => now()]
        );
    }

    public function recordError(string $message): void
    {
        DB::table('sys_settings')->updateOrInsert(
            ['key' => 'zoom.last_error'],
            ['value' => $message, 'updated_at' => now(), 'created_at' => now()]
        );
    }
}

<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\SysNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        $notifications = SysNotification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = SysNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = SysNotification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked as read.']);
    }

    /**
     * The panel calls this as soon as the inbox is opened. It returns the ids it marked so the
     * panel can keep showing those as new for the viewing that cleared them.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $unread = SysNotification::where('user_id', $request->user()->id)->whereNull('read_at');

        $ids = (clone $unread)->pluck('id');
        $unread->update(['read_at' => now()]);

        return response()->json(['message' => 'All marked as read.', 'ids' => $ids]);
    }
}

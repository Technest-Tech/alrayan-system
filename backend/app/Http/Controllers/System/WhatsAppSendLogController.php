<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\System\WhatsAppSendLogResource;
use App\Models\System\WhatsAppSendLog;
use App\Services\Integrations\Acadmyq\AcadmyqClient;
use App\Services\System\WhatsAppDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class WhatsAppSendLogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $logs = QueryBuilder::for(WhatsAppSendLog::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('kind'),
                AllowedFilter::partial('recipient_phone'),
                AllowedFilter::callback('date_from', fn ($q, $v) => $q->whereDate('created_at', '>=', $v)),
                AllowedFilter::callback('date_to',   fn ($q, $v) => $q->whereDate('created_at', '<=', $v)),
            ])
            ->allowedSorts(['created_at', 'updated_at'])
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 50))
            ->appends($request->query());

        return WhatsAppSendLogResource::collection($logs);
    }

    public function show(WhatsAppSendLog $whatsappSendLog): WhatsAppSendLogResource
    {
        return new WhatsAppSendLogResource($whatsappSendLog);
    }

    public function resend(WhatsAppSendLog $whatsappSendLog, WhatsAppDispatcher $dispatcher): JsonResponse
    {
        if ($whatsappSendLog->status !== WhatsAppSendLog::STATUS_FAILED) {
            return response()->json(['message' => 'Only failed messages can be resent.'], 422);
        }

        $dispatcher->resend($whatsappSendLog);

        return response()->json(['message' => 'Message re-queued for delivery.']);
    }

    public function status(AcadmyqClient $client): JsonResponse
    {
        // Staff poll this from the log page header; the upstream answer changes
        // only when someone rescans the QR.
        return response()->json(
            Cache::remember('whatsapp.connection_status', 30, fn () => $client->status())
        );
    }
}

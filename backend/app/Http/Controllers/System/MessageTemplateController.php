<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\MessageTemplate\UpdateMessageTemplateRequest;
use App\Http\Resources\System\MessageTemplateResource;
use App\Models\System\MessageTemplate;
use App\Services\System\MessageTemplateRenderer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageTemplateController extends Controller
{
    public function index(): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('viewAny', MessageTemplate::class);
        return MessageTemplateResource::collection(MessageTemplate::orderBy('key')->get());
    }

    public function show(MessageTemplate $messageTemplate): MessageTemplateResource
    {
        $this->authorize('view', $messageTemplate);
        return new MessageTemplateResource($messageTemplate);
    }

    public function update(UpdateMessageTemplateRequest $request, MessageTemplate $messageTemplate): MessageTemplateResource
    {
        $this->authorize('update', $messageTemplate);
        $messageTemplate->update($request->validated());
        return new MessageTemplateResource($messageTemplate->fresh());
    }

    public function preview(Request $request, MessageTemplate $messageTemplate, MessageTemplateRenderer $renderer): JsonResponse
    {
        $this->authorize('view', $messageTemplate);

        $variables = $request->input('variables', $messageTemplate->example_values ?? []);
        $rendered  = $renderer->render($messageTemplate, $variables);

        return response()->json(['rendered' => $rendered]);
    }
}

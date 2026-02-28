<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PagePresenceEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PresenceController extends Controller
{
    public function heartbeat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['sometimes', 'nullable', 'string', 'max:32'],
            'active_ms' => ['required', 'integer', 'min:1', 'max:600000'],
            'recorded_at' => ['sometimes', 'date'],
        ]);

        $recordedAt = isset($validated['recorded_at']) ? Carbon::parse($validated['recorded_at']) : now();

        $event = PagePresenceEvent::query()->create([
            'page' => $validated['page'] ?? 'dashboard',
            'active_ms' => (int) $validated['active_ms'],
            'recorded_at' => $recordedAt,
            'event_date' => $recordedAt->toDateString(),
        ]);

        return response()->json([
            'message' => 'Presence heartbeat saved.',
            'data' => $event,
        ], 201);
    }

    public function dailyStats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'end_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'page' => ['sometimes', 'nullable', 'string', 'max:32'],
        ]);

        $endDate = $validated['end_date'] ?? now()->toDateString();
        $startDate = $validated['start_date'] ?? Carbon::parse($endDate)->subDays(6)->toDateString();
        $page = $validated['page'] ?? null;

        $query = PagePresenceEvent::query()
            ->selectRaw('DATE(event_date) as event_date, page, SUM(active_ms) as total_active_ms')
            ->whereDate('event_date', '>=', $startDate)
            ->whereDate('event_date', '<=', $endDate);

        if (! empty($page) && $page !== 'all') {
            $query->where('page', $page);
        }

        $items = $query
            ->groupBy(DB::raw('DATE(event_date)'), 'page')
            ->orderByDesc('event_date')
            ->orderBy('page')
            ->get()
            ->map(fn (PagePresenceEvent $item): array => [
                'event_date' => $item->event_date instanceof Carbon ? $item->event_date->toDateString() : (string) $item->event_date,
                'page' => $item->page,
                'total_active_ms' => (int) $item->total_active_ms,
            ])
            ->values();

        return response()->json([
            'data' => $items,
            'meta' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'page' => $page ?? 'all',
                'total_active_ms' => $items->sum('total_active_ms'),
            ],
        ]);
    }
}

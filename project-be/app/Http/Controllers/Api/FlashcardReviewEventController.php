<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flashcard;
use App\Models\FlashcardReviewEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class FlashcardReviewEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'end_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'back_lang' => ['sometimes', 'nullable', 'string', 'max:10'],
            'limit' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $endDate = $validated['end_date'] ?? now()->toDateString();
        $startDate = $validated['start_date'] ?? Carbon::parse($endDate)->subDays(6)->toDateString();
        $backLang = $validated['back_lang'] ?? null;
        $limit = (int) ($validated['limit'] ?? 500);

        $query = FlashcardReviewEvent::query()
            ->with(['flashcard:id,front_text,back_text,back_lang'])
            ->whereDate('event_date', '>=', $startDate)
            ->whereDate('event_date', '<=', $endDate);

        if (! empty($backLang) && $backLang !== 'all') {
            $query->where('back_lang', $backLang);
        }

        $items = $query
            ->orderByDesc('event_at')
            ->limit($limit)
            ->get()
            ->map(fn (FlashcardReviewEvent $item): array => [
                'id' => $item->id,
                'flashcard_id' => $item->flashcard_id,
                'event_at' => optional($item->event_at)->toDateTimeString(),
                'event_date' => $item->event_date instanceof Carbon ? $item->event_date->toDateString() : (string) $item->event_date,
                'back_lang' => $item->back_lang,
                'remembered' => $item->remembered,
                'known' => $item->known,
                'vietnamese_sentence' => $item->flashcard?->front_text,
                'english_sentence' => $item->flashcard?->back_text,
            ])
            ->values();

        return response()->json([
            'data' => $items,
            'meta' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'back_lang' => $backLang ?? 'all',
                'count' => $items->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'flashcard_id' => ['required', 'integer', 'exists:flashcards,id'],
            'back_lang' => ['sometimes', 'nullable', 'string', 'max:10'],
            'remembered' => ['sometimes', 'nullable', 'boolean'],
            'known' => ['sometimes', 'nullable', 'boolean'],
            'event_at' => ['sometimes', 'date'],
        ]);

        /** @var Flashcard $flashcard */
        $flashcard = Flashcard::query()->findOrFail($validated['flashcard_id']);
        $eventAt = isset($validated['event_at']) ? Carbon::parse($validated['event_at']) : now();

        $event = FlashcardReviewEvent::query()->create([
            'flashcard_id' => $flashcard->id,
            'event_at' => $eventAt,
            'event_date' => $eventAt->toDateString(),
            'back_lang' => $validated['back_lang'] ?? $flashcard->back_lang ?? 'en',
            'remembered' => $validated['remembered'] ?? null,
            'known' => $validated['known'] ?? null,
        ]);

        return response()->json([
            'message' => 'Flashcard review event saved.',
            'data' => $event,
        ], 201);
    }

    public function dailyStats(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'end_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'back_lang' => ['sometimes', 'nullable', 'string', 'max:10'],
        ]);

        $endDate = $validated['end_date'] ?? now()->toDateString();
        $startDate = $validated['start_date'] ?? Carbon::parse($endDate)->subDays(6)->toDateString();
        $backLang = $validated['back_lang'] ?? null;

        $query = FlashcardReviewEvent::query()
            ->selectRaw('DATE(event_date) as event_date, back_lang, COUNT(*) as total_clicks')
            ->whereDate('event_date', '>=', $startDate)
            ->whereDate('event_date', '<=', $endDate);

        if (! empty($backLang) && $backLang !== 'all') {
            $query->where('back_lang', $backLang);
        }

        $items = $query
            ->groupBy(DB::raw('DATE(event_date)'), 'back_lang')
            ->orderByDesc('event_date')
            ->orderBy('back_lang')
            ->get()
            ->map(fn (FlashcardReviewEvent $item): array => [
                'event_date' => $item->event_date instanceof Carbon ? $item->event_date->toDateString() : (string) $item->event_date,
                'back_lang' => $item->back_lang,
                'total_clicks' => (int) $item->total_clicks,
            ])
            ->values();

        return response()->json([
            'data' => $items,
            'meta' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'back_lang' => $backLang ?? 'all',
                'total_clicks' => $items->sum('total_clicks'),
            ],
        ]);
    }
}

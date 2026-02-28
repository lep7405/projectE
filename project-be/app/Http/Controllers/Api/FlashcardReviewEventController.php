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
    public function learningOverview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'end_date'  => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'days'      => ['sometimes', 'nullable', 'integer', 'min:1', 'max:60'],
            'back_lang' => ['sometimes', 'nullable', 'string', 'max:10'],
        ]);

        $endDate  = $validated['end_date'] ?? now()->toDateString();
        $days     = (int) ($validated['days'] ?? 14);
        $startDate = Carbon::parse($endDate)->subDays($days - 1)->toDateString();
        $backLang = $validated['back_lang'] ?? null;

        // Created words per day in selected range.
        $createdQuery = Flashcard::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as created_count')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        if (!empty($backLang) && $backLang !== 'all') {
            $createdQuery->where('back_lang', $backLang);
        }

        $createdByDate = $createdQuery
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('created_count', 'date');

        // Learned words per day in selected range.
        $learnedQuery = FlashcardReviewEvent::query()
            ->selectRaw('DATE(event_date) as date, COUNT(DISTINCT flashcard_id) as learned_count')
            ->whereDate('event_date', '>=', $startDate)
            ->whereDate('event_date', '<=', $endDate);

        if (!empty($backLang) && $backLang !== 'all') {
            $learnedQuery->where('back_lang', $backLang);
        }

        $learnedByDate = $learnedQuery
            ->groupBy(DB::raw('DATE(event_date)'))
            ->pluck('learned_count', 'date');

        // Build daily series as learned_today / created_today.
        $series = collect();

        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::parse($startDate)->addDays($i)->toDateString();

            $createdToday = (int) ($createdByDate[$date] ?? 0);
            $learnedToday = (int) ($learnedByDate[$date] ?? 0);

            $series->push([
                'event_date' => $date,
                'created_today' => $createdToday,
                'learned_today' => $learnedToday,
                'unlearned_today' => max(0, $createdToday - $learnedToday),
            ]);
        }

        return response()->json([
            'data' => $series,
            'meta' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'days' => $days,
                'back_lang' => $backLang ?? 'all',
                'created_total_in_range' => $series->sum('created_today'),
                'learned_total_in_range' => $series->sum('learned_today'),
            ],
        ]);
    }
    public function dayDetail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'back_lang' => ['sometimes', 'nullable', 'string', 'max:10'],
        ]);

        $date = $validated['date'];
        $backLang = $validated['back_lang'] ?? null;

        $learnedQuery = FlashcardReviewEvent::query()
            ->join('flashcards', 'flashcards.id', '=', 'flashcard_review_events.flashcard_id')
            ->selectRaw('flashcard_review_events.flashcard_id, flashcards.front_text, flashcards.back_text, flashcards.back_lang, COUNT(*) as click_count, MIN(event_at) as first_clicked_at, MAX(event_at) as last_clicked_at')
            ->whereDate('flashcard_review_events.event_date', '=', $date);

        if (! empty($backLang) && $backLang !== 'all') {
            $learnedQuery->where('flashcard_review_events.back_lang', $backLang);
            $learnedQuery->where('flashcards.back_lang', $backLang);
        }

        $learnedWords = $learnedQuery
            ->groupBy('flashcard_review_events.flashcard_id', 'flashcards.front_text', 'flashcards.back_text', 'flashcards.back_lang')
            ->orderByDesc('click_count')
            ->orderBy('flashcard_review_events.flashcard_id')
            ->get()
            ->map(fn ($row): array => [
                'flashcard_id' => (int) $row->flashcard_id,
                'vietnamese_sentence' => $row->front_text,
                'english_sentence' => $row->back_text,
                'back_lang' => $row->back_lang,
                'click_count' => (int) $row->click_count,
                'first_clicked_at' => $row->first_clicked_at,
                'last_clicked_at' => $row->last_clicked_at,
            ])
            ->values();

        $clickedInDay = FlashcardReviewEvent::query()
            ->select('flashcard_id')
            ->whereDate('event_date', '=', $date);
        if (! empty($backLang) && $backLang !== 'all') {
            $clickedInDay->where('back_lang', $backLang);
        }
        $clickedIds = $clickedInDay->distinct()->pluck('flashcard_id');

        $unlearnedQuery = Flashcard::query()->select(['id', 'front_text', 'back_text', 'back_lang']);
        if (! empty($backLang) && $backLang !== 'all') {
            $unlearnedQuery->where('back_lang', $backLang);
        }
        if ($clickedIds->count() > 0) {
            $unlearnedQuery->whereNotIn('id', $clickedIds);
        }

        $unlearnedWords = $unlearnedQuery
            ->orderBy('id')
            ->limit(5000)
            ->get()
            ->map(fn (Flashcard $row): array => [
                'flashcard_id' => (int) $row->id,
                'vietnamese_sentence' => $row->front_text,
                'english_sentence' => $row->back_text,
                'back_lang' => $row->back_lang,
            ])
            ->values();

        return response()->json([
            'data' => [
                'date' => $date,
                'back_lang' => $backLang ?? 'all',
                'learned_words' => $learnedWords,
                'unlearned_words' => $unlearnedWords,
            ],
            'meta' => [
                'learned_count' => $learnedWords->count(),
                'unlearned_count' => $unlearnedWords->count(),
            ],
        ]);
    }

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

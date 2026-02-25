<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Flashcard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SentenceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'back_lang' => ['sometimes', 'nullable', 'string', 'max:10'],
            'created_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
        ]);

        $limit = (int) $request->query('limit', 10);
        $limit = max(1, min($limit, 200));
        $backLang = $request->query('back_lang');
        $createdDate = $request->query('created_date');

        $query = Flashcard::query();
        if (! empty($backLang)) {
            $query->where('back_lang', $backLang);
        }
        if (! empty($createdDate)) {
            $query->whereDate('created_at', $createdDate);
        }

        $sentences = $query
            ->inRandomOrder()
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $sentences->map(fn (Flashcard $flashcard): array => $this->serializeFlashcard($flashcard)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'english_sentence' => ['nullable', 'string', 'required_without:back_text'],
            'vietnamese_sentence' => ['nullable', 'string', 'required_without:front_text'],
            'front_text' => ['nullable', 'string', 'required_without:vietnamese_sentence'],
            'back_text' => ['nullable', 'string', 'required_without:english_sentence'],
            'front_lang' => ['nullable', 'string', 'max:10'],
            'back_lang' => ['nullable', 'string', 'max:10'],
            'topic' => ['nullable', 'string', 'max:120'],
            'images' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('images')) {
            $validated['images'] = $request->file('images')->store('flashcards', 'public');
        }

        $payload = $this->buildFlashcardPayload($validated);
        $flashcard = Flashcard::query()->create($payload);

        return response()->json([
            'message' => 'Flashcard created successfully.',
            'data' => $this->serializeFlashcard($flashcard),
        ], 201);
    }

    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'images' => ['sometimes', 'array'],
            'images.*' => ['image', 'max:5120'],
        ]);

        $itemsInput = $request->input('items');
        $decodedItems = is_string($itemsInput) ? json_decode($itemsInput, true) : $itemsInput;

        if (! is_array($decodedItems)) {
            return response()->json([
                'message' => 'The items field must be a valid array.',
            ], 422);
        }

        $validated = validator([
            'items' => $decodedItems,
        ], [
            'items' => ['required', 'array', 'min:1', 'max:500'],
            'items.*.english_sentence' => ['required', 'string'],
            'items.*.vietnamese_sentence' => ['required', 'string'],
            'items.*.front_lang' => ['nullable', 'string', 'max:10'],
            'items.*.back_lang' => ['nullable', 'string', 'max:10'],
            'items.*.topic' => ['nullable', 'string', 'max:120'],
            'items.*.image_ref' => ['nullable', 'string'],
        ])->validate();

        $storedImagesByName = [];
        foreach ($request->file('images', []) as $imageFile) {
            $storedImagesByName[$imageFile->getClientOriginalName()] = $imageFile->store('flashcards', 'public');
        }

        $now = now();
        $rows = collect($validated['items'])
            ->map(fn (array $item): array => [
                'front_text' => $item['vietnamese_sentence'],
                'back_text' => $item['english_sentence'],
                'front_lang' => $item['front_lang'] ?? 'vi',
                'back_lang' => $item['back_lang'] ?? 'en',
                'topic' => $item['topic'] ?? null,
                'images' => $this->resolveBulkImagePath($item['image_ref'] ?? null, $storedImagesByName),
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        DB::transaction(function () use ($rows): void {
            Flashcard::query()->insert($rows);
        });

        return response()->json([
            'message' => 'Bulk create successful.',
            'count' => count($rows),
        ], 201);
    }

    private function resolveBulkImagePath(?string $imageRef, array $storedImagesByName): ?string
    {
        if ($imageRef === null) {
            return null;
        }

        $imageRef = trim($imageRef);
        if ($imageRef === '') {
            return null;
        }

        if (Str::startsWith($imageRef, ['http://', 'https://'])) {
            return $imageRef;
        }

        return $storedImagesByName[$imageRef] ?? null;
    }

    public function update(Request $request, Flashcard $sentence): JsonResponse
    {
        $validated = $request->validate([
            'english_sentence' => ['sometimes', 'required', 'string'],
            'vietnamese_sentence' => ['sometimes', 'required', 'string'],
            'front_text' => ['sometimes', 'required', 'string'],
            'back_text' => ['sometimes', 'required', 'string'],
            'front_lang' => ['sometimes', 'required', 'string', 'max:10'],
            'back_lang' => ['sometimes', 'required', 'string', 'max:10'],
            'topic' => ['sometimes', 'nullable', 'string', 'max:120'],
            'images' => ['nullable', 'image', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
        ]);

        $oldImagePath = $sentence->images;
        $shouldRemoveImage = $request->boolean('remove_image');

        if ($shouldRemoveImage && ! empty($oldImagePath)) {
            Storage::disk('public')->delete($oldImagePath);
            $validated['images'] = null;
            $oldImagePath = null;
        }

        if ($request->hasFile('images')) {
            if (! empty($oldImagePath)) {
                Storage::disk('public')->delete($oldImagePath);
            }

            $validated['images'] = $request->file('images')->store('flashcards', 'public');
        }

        $validated = $this->buildFlashcardPayload($validated, $sentence);
        unset($validated['remove_image']);
        $sentence->update($validated);

        return response()->json([
            'message' => 'Flashcard updated successfully.',
            'data' => $this->serializeFlashcard($sentence->fresh()),
        ]);
    }

    public function destroy(Flashcard $sentence): JsonResponse
    {
        if (! empty($sentence->images)) {
            Storage::disk('public')->delete($sentence->images);
        }

        $sentence->delete();

        return response()->json([
            'message' => 'Sentence deleted successfully.',
        ]);
    }

    private function buildFlashcardPayload(array $validated, ?Flashcard $current = null): array
    {
        $payload = [];

        if (array_key_exists('images', $validated)) {
            $payload['images'] = $validated['images'];
        }
        if (array_key_exists('topic', $validated)) {
            $payload['topic'] = $validated['topic'];
        }

        if (array_key_exists('vietnamese_sentence', $validated)) {
            $payload['front_text'] = $validated['vietnamese_sentence'];
        } elseif (array_key_exists('front_text', $validated)) {
            $payload['front_text'] = $validated['front_text'];
        } elseif ($current === null) {
            $payload['front_text'] = '';
        }

        if (array_key_exists('english_sentence', $validated)) {
            $payload['back_text'] = $validated['english_sentence'];
        } elseif (array_key_exists('back_text', $validated)) {
            $payload['back_text'] = $validated['back_text'];
        } elseif ($current === null) {
            $payload['back_text'] = '';
        }

        if (array_key_exists('front_lang', $validated)) {
            $payload['front_lang'] = $validated['front_lang'];
        } elseif ($current === null) {
            $payload['front_lang'] = 'vi';
        }

        if (array_key_exists('back_lang', $validated)) {
            $payload['back_lang'] = $validated['back_lang'];
        } elseif ($current === null) {
            $payload['back_lang'] = 'en';
        }

        return $payload;
    }

    private function serializeFlashcard(Flashcard $flashcard): array
    {
        return [
            'id' => $flashcard->id,
            'images' => $flashcard->images,
            'front_text' => $flashcard->front_text,
            'back_text' => $flashcard->back_text,
            'front_lang' => $flashcard->front_lang,
            'back_lang' => $flashcard->back_lang,
            'topic' => $flashcard->topic,
            'english_sentence' => $flashcard->back_text,
            'vietnamese_sentence' => $flashcard->front_text,
            'created_at' => $flashcard->created_at,
            'updated_at' => $flashcard->updated_at,
        ];
    }
}

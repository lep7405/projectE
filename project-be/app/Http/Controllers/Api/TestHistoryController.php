<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyReward;
use App\Models\TestHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TestHistoryController extends Controller
{
    private const DAILY_REWARD_AMOUNT = 100000;

    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 100);
        $limit = max(1, min($limit, 500));

        $items = TestHistory::query()
            ->orderByDesc('tested_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $items,
        ]);
    }

    public function complete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'back_lang' => ['required', 'string', 'max:10'],
            'total_cards' => ['required', 'integer', 'min:1'],
            'completed_cards' => ['required', 'integer', 'min:0'],
            'total_time_ms' => ['required', 'integer', 'min:0'],
            'average_time_ms' => ['required', 'integer', 'min:0'],
            'remember_yes_count' => ['required', 'integer', 'min:0'],
            'known_yes_count' => ['required', 'integer', 'min:0'],
            'tested_at' => ['sometimes', 'date'],
        ]);

        $testedAt = isset($validated['tested_at']) ? Carbon::parse($validated['tested_at']) : now();
        $isCompleted = $validated['completed_cards'] >= $validated['total_cards'];

        $result = DB::transaction(function () use ($validated, $testedAt, $isCompleted): array {
            $history = TestHistory::query()->create([
                'tested_at' => $testedAt,
                'back_lang' => $validated['back_lang'],
                'total_cards' => $validated['total_cards'],
                'completed_cards' => $validated['completed_cards'],
                'total_time_ms' => $validated['total_time_ms'],
                'average_time_ms' => $validated['average_time_ms'],
                'remember_yes_count' => $validated['remember_yes_count'],
                'known_yes_count' => $validated['known_yes_count'],
                'is_completed' => $isCompleted,
            ]);

            $rewardDate = $testedAt->toDateString();
            $reward = DailyReward::query()->firstOrNew(['reward_date' => $rewardDate]);
            $oldAmount = (int) ($reward->amount ?? 0);

            if (! $reward->exists) {
                $reward->amount = 0;
                $reward->test_histories_count = 0;
            }

            if ($isCompleted && $reward->amount === 0) {
                $reward->amount = self::DAILY_REWARD_AMOUNT;
            }

            $reward->test_histories_count += 1;
            $reward->save();

            return [
                'history' => $history,
                'reward' => $reward,
                'reward_awarded_now' => $isCompleted && $oldAmount === 0 && (int) $reward->amount === self::DAILY_REWARD_AMOUNT,
            ];
        });

        return response()->json([
            'message' => 'Test result saved.',
            'data' => $result['history'],
            'daily_reward' => $result['reward'],
            'reward_awarded_now' => $result['reward_awarded_now'],
        ], 201);
    }

    public function rewards(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 100);
        $limit = max(1, min($limit, 500));

        $items = DailyReward::query()
            ->orderByDesc('reward_date')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $items,
        ]);
    }

    public function storeReward(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reward_date' => ['required', 'date'],
            'amount' => ['required', 'integer', 'min:0'],
            'test_histories_count' => ['nullable', 'integer', 'min:0'],
        ]);

        $reward = DailyReward::query()->updateOrCreate(
            ['reward_date' => $validated['reward_date']],
            [
                'amount' => $validated['amount'],
                'test_histories_count' => $validated['test_histories_count'] ?? 0,
            ]
        );

        return response()->json([
            'message' => 'Daily reward saved successfully.',
            'data' => $reward,
        ], 201);
    }

    public function updateReward(Request $request, DailyReward $dailyReward): JsonResponse
    {
        $validated = $request->validate([
            'reward_date' => ['sometimes', 'required', 'date'],
            'amount' => ['sometimes', 'required', 'integer', 'min:0'],
            'test_histories_count' => ['sometimes', 'required', 'integer', 'min:0'],
        ]);

        $dailyReward->update($validated);

        return response()->json([
            'message' => 'Daily reward updated successfully.',
            'data' => $dailyReward->fresh(),
        ]);
    }

    public function destroyReward(DailyReward $dailyReward): JsonResponse
    {
        $dailyReward->delete();

        return response()->json([
            'message' => 'Daily reward deleted successfully.',
        ]);
    }
}

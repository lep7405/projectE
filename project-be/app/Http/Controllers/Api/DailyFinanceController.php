<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyFinance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DailyFinanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 200);
        $limit = max(1, min($limit, 500));

        $items = DailyFinance::query()
            ->orderByDesc('date')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'expense' => ['nullable', 'numeric', 'min:0'],
            'income' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        $item = DailyFinance::query()->updateOrCreate(
            ['date' => $validated['date']],
            [
                'expense' => $validated['expense'] ?? 0,
                'income' => $validated['income'] ?? 0,
                'description' => $validated['description'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Daily finance saved successfully.',
            'data' => $item,
        ], 201);
    }

    public function update(Request $request, DailyFinance $dailyFinance): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['sometimes', 'required', 'date', Rule::unique('daily_finances', 'date')->ignore($dailyFinance->id)],
            'expense' => ['sometimes', 'required', 'numeric', 'min:0'],
            'income' => ['sometimes', 'required', 'numeric', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        $dailyFinance->update($validated);

        return response()->json([
            'message' => 'Daily finance updated successfully.',
            'data' => $dailyFinance->fresh(),
        ]);
    }

    public function destroy(DailyFinance $dailyFinance): JsonResponse
    {
        $dailyFinance->delete();

        return response()->json([
            'message' => 'Daily finance deleted successfully.',
        ]);
    }
}

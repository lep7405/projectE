<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 200);
        $limit = max(1, min($limit, 500));

        $items = Task::query()
            ->orderByDesc('task_date')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $items->map(fn (Task $task): array => $this->serializeTask($task)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'description' => ['required', 'string'],
            'created_at' => ['required', 'date'],
            'type' => ['nullable', 'string', 'max:50'],
        ]);

        $item = Task::query()->create([
            'description' => $validated['description'],
            'task_date' => $validated['created_at'],
            'type' => $validated['type'] ?? 'custom',
        ]);

        return response()->json([
            'message' => 'Task created successfully.',
            'data' => $this->serializeTask($item),
        ], 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'description' => ['sometimes', 'required', 'string'],
            'created_at' => ['sometimes', 'required', 'date'],
            'type' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $payload = [];
        if (array_key_exists('description', $validated)) {
            $payload['description'] = $validated['description'];
        }
        if (array_key_exists('created_at', $validated)) {
            $payload['task_date'] = $validated['created_at'];
        }
        if (array_key_exists('type', $validated)) {
            $payload['type'] = $validated['type'] ?? 'custom';
        }

        $task->update($payload);

        return response()->json([
            'message' => 'Task updated successfully.',
            'data' => $this->serializeTask($task->fresh()),
        ]);
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully.',
        ]);
    }

    private function serializeTask(Task $task): array
    {
        return [
            'id' => $task->id,
            'description' => $task->description,
            'type' => $task->type,
            'created_at' => $task->task_date,
            'updated_at' => $task->updated_at,
        ];
    }
}

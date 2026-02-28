<?php

use App\Http\Controllers\Api\DailyFinanceController;
use App\Http\Controllers\Api\FlashcardReviewEventController;
use App\Http\Controllers\Api\SentenceController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TestHistoryController;
use Illuminate\Support\Facades\Route;

Route::get('/sentences', [SentenceController::class, 'index']);
Route::post('/sentences', [SentenceController::class, 'store']);
Route::post('/sentences/bulk', [SentenceController::class, 'bulkStore']);
Route::put('/sentences/{sentence}', [SentenceController::class, 'update']);
Route::patch('/sentences/{sentence}', [SentenceController::class, 'update']);
Route::delete('/sentences/{sentence}', [SentenceController::class, 'destroy']);

Route::get('/daily-finances', [DailyFinanceController::class, 'index']);
Route::post('/daily-finances', [DailyFinanceController::class, 'store']);
Route::put('/daily-finances/{dailyFinance}', [DailyFinanceController::class, 'update']);
Route::patch('/daily-finances/{dailyFinance}', [DailyFinanceController::class, 'update']);
Route::delete('/daily-finances/{dailyFinance}', [DailyFinanceController::class, 'destroy']);

Route::get('/test-histories', [TestHistoryController::class, 'index']);
Route::post('/test-histories/complete', [TestHistoryController::class, 'complete']);
Route::get('/daily-rewards', [TestHistoryController::class, 'rewards']);
Route::post('/daily-rewards', [TestHistoryController::class, 'storeReward']);
Route::put('/daily-rewards/{dailyReward}', [TestHistoryController::class, 'updateReward']);
Route::patch('/daily-rewards/{dailyReward}', [TestHistoryController::class, 'updateReward']);
Route::delete('/daily-rewards/{dailyReward}', [TestHistoryController::class, 'destroyReward']);

Route::get('/tasks', [TaskController::class, 'index']);
Route::post('/tasks', [TaskController::class, 'store']);
Route::put('/tasks/{task}', [TaskController::class, 'update']);
Route::patch('/tasks/{task}', [TaskController::class, 'update']);
Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

Route::post('/flashcard-review-events', [FlashcardReviewEventController::class, 'store']);
Route::get('/flashcard-review-events', [FlashcardReviewEventController::class, 'index']);
Route::get('/flashcard-review-events/stats/daily', [FlashcardReviewEventController::class, 'dailyStats']);

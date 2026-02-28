<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('flashcard_review_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flashcard_id')->constrained('flashcards')->cascadeOnDelete();
            $table->timestamp('event_at');
            $table->date('event_date');
            $table->string('back_lang', 10);
            $table->boolean('remembered')->nullable();
            $table->boolean('known')->nullable();
            $table->timestamps();

            $table->index(['event_date', 'back_lang']);
            $table->index(['flashcard_id', 'event_date']);
            $table->index('event_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flashcard_review_events');
    }
};

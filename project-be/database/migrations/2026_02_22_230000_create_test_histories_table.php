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
        Schema::create('test_histories', function (Blueprint $table) {
            $table->id();
            $table->timestamp('tested_at');
            $table->string('back_lang', 10)->default('en');
            $table->unsignedInteger('total_cards')->default(0);
            $table->unsignedInteger('completed_cards')->default(0);
            $table->unsignedBigInteger('total_time_ms')->default(0);
            $table->unsignedBigInteger('average_time_ms')->default(0);
            $table->unsignedInteger('remember_yes_count')->default(0);
            $table->unsignedInteger('known_yes_count')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_histories');
    }
};

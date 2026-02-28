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
        Schema::create('page_presence_events', function (Blueprint $table) {
            $table->id();
            $table->string('page', 32)->default('dashboard');
            $table->unsignedInteger('active_ms');
            $table->timestamp('recorded_at');
            $table->date('event_date');
            $table->timestamps();

            $table->index(['event_date', 'page']);
            $table->index('recorded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('page_presence_events');
    }
};

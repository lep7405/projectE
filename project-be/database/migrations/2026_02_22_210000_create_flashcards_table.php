<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('flashcards', function (Blueprint $table) {
            $table->id();
            $table->text('front_text');
            $table->text('back_text');
            $table->string('front_lang', 10)->default('vi');
            $table->string('back_lang', 10)->default('en');
            $table->string('images')->nullable();
            $table->string('topic', 120)->nullable();
            $table->timestamps();
        });

        if (Schema::hasTable('sentences')) {
            DB::table('sentences')
                ->orderBy('id')
                ->chunk(500, function ($rows): void {
                    $insertRows = collect($rows)->map(function ($row): array {
                        return [
                            'id' => $row->id,
                            'front_text' => $row->vietnamese_sentence,
                            'back_text' => $row->english_sentence,
                            'front_lang' => 'vi',
                            'back_lang' => 'en',
                            'images' => $row->images,
                            'topic' => null,
                            'created_at' => $row->created_at,
                            'updated_at' => $row->updated_at,
                        ];
                    })->all();

                    DB::table('flashcards')->insert($insertRows);
                });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flashcards');
    }
};

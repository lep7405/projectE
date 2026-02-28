<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flashcard extends Model
{
    protected $table = 'flashcards';

    protected $fillable = [
        'front_text',
        'back_text',
        'front_lang',
        'back_lang',
        'images',
        'topic',
        'is_paragraph',
    ];

    protected $casts = [
        'is_paragraph' => 'boolean',
    ];
}

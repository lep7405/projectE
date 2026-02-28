<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlashcardReviewEvent extends Model
{
    protected $table = 'flashcard_review_events';

    protected $fillable = [
        'flashcard_id',
        'event_at',
        'event_date',
        'back_lang',
        'remembered',
        'known',
    ];

    protected $casts = [
        'event_at' => 'datetime',
        'event_date' => 'date',
        'remembered' => 'boolean',
        'known' => 'boolean',
    ];

    public function flashcard(): BelongsTo
    {
        return $this->belongsTo(Flashcard::class);
    }
}

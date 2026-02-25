<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestHistory extends Model
{
    protected $table = 'test_histories';

    protected $fillable = [
        'tested_at',
        'back_lang',
        'total_cards',
        'completed_cards',
        'total_time_ms',
        'average_time_ms',
        'remember_yes_count',
        'known_yes_count',
        'is_completed',
    ];

    protected $casts = [
        'tested_at' => 'datetime',
        'is_completed' => 'boolean',
    ];
}

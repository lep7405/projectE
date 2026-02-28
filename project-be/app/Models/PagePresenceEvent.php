<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PagePresenceEvent extends Model
{
    protected $table = 'page_presence_events';

    protected $fillable = [
        'page',
        'active_ms',
        'recorded_at',
        'event_date',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'event_date' => 'date',
    ];
}

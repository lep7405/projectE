<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyReward extends Model
{
    protected $table = 'daily_rewards';

    protected $fillable = [
        'reward_date',
        'amount',
        'test_histories_count',
    ];
}

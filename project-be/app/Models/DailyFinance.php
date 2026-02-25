<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyFinance extends Model
{
    protected $table = 'daily_finances';

    protected $fillable = [
        'date',
        'expense',
        'income',
        'description',
    ];
}

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Operator Dashboard Credentials
    |--------------------------------------------------------------------------
    |
    | HTTP Basic credentials for the dashboard at `/admin`. Leaving either value
    | unset locks the dashboard rather than opening it: the middleware refuses
    | every request until both are configured.
    |
    */

    'username' => env('ADMIN_USERNAME'),

    'password' => env('ADMIN_PASSWORD'),

];

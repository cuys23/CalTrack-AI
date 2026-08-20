<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing
    |--------------------------------------------------------------------------
    |
    | Laravel's default allows every origin. A native iOS client sends no Origin
    | header and is unaffected by CORS either way, so the only callers this
    | governs are browsers — the operator dashboard, and anything else someone
    | points at the API. Naming the origins keeps a stray web page from calling
    | the API with a user's credentials attached.
    |
    | Set CORS_ALLOWED_ORIGINS to a comma-separated list per deployment.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter(
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 3600,

    // The app authenticates with a bearer token, not a cookie, so browsers have
    // no reason to send credentials cross-origin.
    'supports_credentials' => false,

];

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'apple' => [
        // Audiences accepted in a Sign in with Apple identityToken: the iOS bundle
        // identifier, plus the Services ID if you ever add web/Android sign-in.
        'client_ids' => array_filter(explode(',', (string) env('APPLE_CLIENT_IDS', 'com.vin.calorielq'))),

        // Bundle identifier a signed StoreKit transaction must have been made in.
        'bundle_id' => env('APPLE_BUNDLE_ID', 'com.vin.calorielq'),

        // Root certificate every Apple JWS chain must terminate at.
        'root_ca_path' => env('APPLE_ROOT_CA_PATH', resource_path('certs/AppleRootCA-G3.pem')),
    ],

    'google' => [
        // OAuth client IDs accepted in a Google Sign-In id_token. The native SDK
        // mints the token for the *web* client ID, so that one is required; add
        // the iOS/Android client IDs if you ever call Google APIs directly.
        'client_ids' => array_filter(explode(',', (string) env('GOOGLE_CLIENT_IDS'))),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
    ],

];

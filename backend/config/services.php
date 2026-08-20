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

    /*
    | Sign in with Apple. `audiences` must list every client that may present a
    | token: the iOS bundle identifier, plus the Services ID if a web or Android
    | client is ever added. A token whose `aud` is absent from this list was
    | issued for a different application and is rejected.
    */
    'apple' => [
        'jwks_url' => env('APPLE_JWKS_URL', 'https://appleid.apple.com/auth/keys'),
        'issuer' => env('APPLE_TOKEN_ISSUER', 'https://appleid.apple.com'),
        'audiences' => array_values(array_filter(
            explode(',', (string) env('APPLE_AUDIENCES', 'com.vin.calorielq'))
        )),

        // Root that StoreKit JWS chains must terminate at. Overridden only by
        // tests, which pin a root they generate themselves.
        'storekit_root_certificate' => env('APPLE_STOREKIT_ROOT_CERTIFICATE'),
    ],

    /*
    | Google Sign-In. `audiences` holds the OAuth client IDs issued by the
    | Google Cloud console; iOS and Android each get their own, and both must be
    | listed. Google signs tokens with `iss` of either form below.
    */
    'google' => [
        'jwks_url' => env('GOOGLE_JWKS_URL', 'https://www.googleapis.com/oauth2/v3/certs'),
        'issuers' => ['https://accounts.google.com', 'accounts.google.com'],
        'audiences' => array_values(array_filter(
            explode(',', (string) env('GOOGLE_OAUTH_CLIENT_IDS', ''))
        )),
    ],

    /*
    | AI Vision. Each scan is a paid call to the provider, so the per-account
    | daily ceiling bounds the bill. Set to 0 to disable the cap entirely.
    */
    'ai_vision' => [
        'daily_scan_limit' => (int) env('AI_VISION_DAILY_SCAN_LIMIT', 50),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
    ],

];

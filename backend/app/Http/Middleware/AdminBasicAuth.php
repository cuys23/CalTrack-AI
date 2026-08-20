<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protects the operator dashboard with HTTP Basic credentials held in config.
 *
 * The dashboard exposes every user record, subscription, and revenue figure, and
 * was previously reachable by anyone who knew the URL.
 *
 * ponytail: single shared operator credential, no roles or audit trail. Move to
 * an `is_admin` column with Sanctum sessions if more than one person needs
 * access or if who-did-what has to be answerable.
 */
class AdminBasicAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $expectedUser = (string) config('admin.username');
        $expectedPassword = (string) config('admin.password');

        // Fail closed. An unset password must lock the dashboard rather than
        // open it, which is what an empty-string comparison would do.
        if ($expectedUser === '' || $expectedPassword === '') {
            abort(503, 'Admin dashboard is not configured.');
        }

        $user = (string) $request->getUser();
        $password = (string) $request->getPassword();

        // hash_equals compares in constant time, so a wrong credential does not
        // leak how much of it was correct through response timing.
        $userMatches = hash_equals($expectedUser, $user);
        $passwordMatches = hash_equals($expectedPassword, $password);

        if (! $userMatches || ! $passwordMatches) {
            return response('Unauthorized.', 401, [
                'WWW-Authenticate' => 'Basic realm="CalTrack Admin"',
            ]);
        }

        return $next($request);
    }
}

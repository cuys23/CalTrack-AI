#!/bin/sh
#
# Prepares the application before the container's main process starts.
#
# None of this ran previously: a fresh deployment came up with no schema, no
# public/storage symlink — so every uploaded meal photograph returned 404 — and
# no cached configuration.
set -e

# Only the web container should migrate. Several replicas running migrations at
# once race each other, so workers and one-off containers skip this step.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "==> Waiting for the database"
  until php -r '
      $dsn = sprintf("pgsql:host=%s;port=%s;dbname=%s",
          getenv("DB_HOST") ?: "postgres",
          getenv("DB_PORT") ?: "5432",
          getenv("DB_DATABASE") ?: "caltrack");
      try { new PDO($dsn, getenv("DB_USERNAME"), getenv("DB_PASSWORD")); exit(0); }
      catch (Throwable $e) { exit(1); }
  '; do
    sleep 2
  done

  echo "==> Running migrations"
  php artisan migrate --force
fi

# Serves uploaded meal images. Idempotent, and harmless when the link exists.
echo "==> Linking storage"
php artisan storage:link || true

# Caches are rebuilt each start rather than baked into the image, because they
# capture environment values that differ between deployments.
echo "==> Caching configuration"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Ready"
exec "$@"

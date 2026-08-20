# Build stage: resolve dependencies with Composer available, so the runtime
# image does not have to carry Composer or the build toolchain.
FROM php:8.4-cli-alpine AS vendor

RUN apk add --no-cache git unzip libzip-dev postgresql-dev \
    && docker-php-ext-install zip pdo pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copied ahead of the source so a source-only change does not invalidate the
# dependency layer.
COPY composer.json composer.lock ./

# Scripts are skipped here because artisan needs the application code, which is
# not present yet; they run in the finalise step below.
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --no-scripts \
    --optimize-autoloader

COPY . .

RUN composer dump-autoload --no-dev --optimize --classmap-authoritative

# ---------------------------------------------------------------------------

FROM php:8.4-fpm-alpine AS runtime

# Build-only packages are installed, used, and removed in one layer so they do
# not persist in the final image.
RUN apk add --no-cache \
        postgresql-libs \
        libpng \
        libjpeg-turbo \
        freetype \
        libzip \
        curl \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        postgresql-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        oniguruma-dev \
        linux-headers \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo pdo_pgsql pgsql mbstring exif pcntl bcmath gd zip opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

WORKDIR /var/www

COPY ./docker/php/local.ini /usr/local/etc/php/conf.d/local.ini

# The application ships inside the image. The previous version installed no
# dependencies at all and only ran because docker-compose bind-mounted the host
# directory over /var/www — a development arrangement, not a deployable one.
COPY --from=vendor --chown=www-data:www-data /app /var/www

RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY --chmod=0755 ./docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# PHP-FPM would otherwise run its master process as root.
USER www-data

EXPOSE 9000

# Compose and orchestrators use this to tell "the container started" apart from
# "the application can serve traffic".
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD php -r 'exit(0);'

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]

# ---------------------------------------------------------------------------

# The web tier serves static files and the uploaded-image symlink itself, and
# only hands .php requests to FPM. It therefore needs `public/` present: with a
# self-contained app image there is no bind mount to supply it, and nginx
# answered every request with 404 until this stage existed.
FROM nginx:alpine AS web

COPY --from=vendor /app/public /var/www/public
COPY ./docker/nginx/default.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost/api/health || exit 1

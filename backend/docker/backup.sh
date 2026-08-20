#!/bin/sh
#
# Nightly database dump, kept for two weeks.
set -eu

BACKUP_DIR=/backups
RETENTION_DAYS=14

while true; do
  stamp="$(date +%Y%m%d-%H%M)"
  target="${BACKUP_DIR}/caltrack-${stamp}.sql.gz"

  echo "==> Dumping to ${target}"

  # Write to a temporary name first: an interrupted dump must not be mistaken
  # for a usable backup by whoever reaches for it.
  if pg_dump -h postgres -U "${DB_USERNAME}" -d "${DB_DATABASE}" | gzip > "${target}.partial"; then
    mv "${target}.partial" "${target}"
    echo "==> Wrote ${target}"
  else
    rm -f "${target}.partial"
    echo "==> Dump failed" >&2
  fi

  find "${BACKUP_DIR}" -name 'caltrack-*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete

  sleep 86400
done

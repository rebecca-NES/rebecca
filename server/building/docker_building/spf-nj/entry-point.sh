#!/bin/sh

set -e

export PGPASSWORD="$DBPASSWORD"

until psql -h "$DBHOST" -U "$DBUSER" "$DBNAME" -c '\l'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
cd /opt/cubee/node
exec node ./scripts/server.js

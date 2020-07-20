#!/bin/sh

psql -h "$DBHOST" -U "$DBUSER" "$DBNAME" -f /opt/cubee/db_update/rightctl_update.sql

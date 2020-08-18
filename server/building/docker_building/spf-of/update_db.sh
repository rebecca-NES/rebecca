#!/bin/sh

# cubee起動時にテーブル、カラムの有無を確認しテーブルの追加やカラムの追加を行う。

psql -h "$DBHOST" -U "$DBUSER" "$DBNAME" -f /opt/cubee/db_update/globalsns_update.sql


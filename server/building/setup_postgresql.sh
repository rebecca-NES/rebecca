#!/bin/bash

##
## PostgreSQL
##

##
## repo
yum install https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm

##
## install
yum install postgresql12-server


##
## initialize
/usr/pgsql-12/bin/postgresql-12-setup initdb

##
## 設定変更
cp -p  /var/lib/pgsql/12/data/postgresql.conf  /var/lib/pgsql/12/data/postgresql.conf.org
echo "search_path = '\"\$user\",globalsns,globalsns_manager,public'" >> /var/lib/pgsql/12/data/postgresql.conf
echo "listen_addresses = '*'" >> /var/lib/pgsql/12/data/postgresql.conf
sed -i -e "s/max_connections = 100/max_connections = 300/" /var/lib/pgsql/12/data/postgresql.conf
sed -i -e "s/^#standard_conforming_strings = on/standard_conforming_strings = off/" /var/lib/pgsql/12/data/postgresql.conf
sed -i -e "s/^#bytea_output = 'hex'/bytea_output = 'escape'/" /var/lib/pgsql/12/data/postgresql.conf


## pg_hba.conf のバックアップ
cp -p /var/lib/pgsql/12/data/pg_hba.conf  /var/lib/pgsql/12/data/pg_hba.conf.org

## デフォルト設定をコメントアウト
sed -i -e "s/^local/# local/g" /var/lib/pgsql/12/data/pg_hba.conf
sed -i -e "s/^host/# host/g" /var/lib/pgsql/12/data/pg_hba.conf

## postgres ユーザの PW変更のために一時的に設定
echo "local all all trust" >> /var/lib/pgsql/12/data/pg_hba.conf

## postgresql を起動
systemctl start postgresql-12

## postgres ユーザの PWを変更
psql -U postgres -c "alter role postgres with password '${POSTGRES_PASSWORD}'"

## 一時的な変更を元に戻す
sed -i -e "s/^local all all trust/local all all md5/g" /var/lib/pgsql/12/data/pg_hba.conf
echo "host all all ${HOST_IPADDRESS}/32 md5" >> /var/lib/pgsql/12/data/pg_hba.conf
if [ ! "${DATABASE_IPADDR}" == "${HOST_IPADDRESS}" ]; then
  echo "host all all ${DATABASE_IPADDR}/32 md5" >> /var/lib/pgsql/12/data/pg_hba.conf
fi
echo "host all all 172.18.0.0/16 md5" >> /var/lib/pgsql/12/data/pg_hba.conf
echo "host all all ::1/128 md5" >> /var/lib/pgsql/12/data/pg_hba.conf

## docker のコンテナからアクセスを許容する設定
# JSON=`docker network inspect cubee-network`
# SUBNET=`echo $JSON | python -c "exec(\"import json, sys\\nj=json.load(sys.stdin)\\nprint j[0].get('IPAM').get('Config')[0].get('Subnet')\")"`
# echo "host all all ${SUBNET} md5" >> /var/lib/pgsql/12/data/pg_hba.conf

##
## postgresql を再起動と、自動起動
systemctl restart postgresql-12
systemctl enable postgresql-12

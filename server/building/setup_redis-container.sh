#!/bin/bash

##
## redis-server
##

##
## docker image を pull する
docker pull redis:3.0.7

##
## 設定ファイルを配置する
mkdir -p /var/lib/docker/volumes/usr_locall_etc/spf-srvr-redis/
cat <<EOF > /var/lib/docker/volumes/usr_locall_etc/spf-srvr-redis/redis.conf
logfile "/data/redis.log"
requirepass ${REDIS_PASSWORD}
EOF

## 1000:1000 は、コンテナの初期ユーザのID
chown -R 1000:1000 /var/lib/docker/volumes/usr_locall_etc
